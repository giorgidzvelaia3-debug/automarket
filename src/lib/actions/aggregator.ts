"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/authHelpers"
import { runSync } from "@/lib/scraping/runSync"
import { slugifyAggregated } from "@/lib/scraping/normalize"
import type { SyncResult } from "@/lib/scraping/types"

// ─── Sources ──────────────────────────────────────────────────────────────

export async function runSyncNow(formData: FormData): Promise<void> {
  await requireAdmin()
  const slug = (formData.get("slug") as string | null)?.trim()
  if (!slug) return
  await runSync(slug)
  revalidatePath("/admin/aggregator/sources")
  revalidatePath("/admin/aggregator/sync")
  revalidatePath("/admin/aggregator/matches")
}

export async function runSyncNowResult(slug: string): Promise<SyncResult> {
  await requireAdmin()
  const result = await runSync(slug)
  revalidatePath("/admin/aggregator/sources")
  return result
}

export async function toggleSource(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = formData.get("id") as string
  const enabled = formData.get("enabled") === "true"
  await prisma.source.update({ where: { id }, data: { enabled: !enabled } })
  revalidatePath("/admin/aggregator/sources")
}

// ─── Match proposals ────────────────────────────────────────────────────────

export async function confirmProposal(formData: FormData): Promise<void> {
  await requireAdmin()
  const proposalId = formData.get("proposalId") as string

  const proposal = await prisma.matchProposal.findUnique({
    where: { id: proposalId },
    include: { offer: true },
  })
  if (!proposal || proposal.status !== "PENDING") return

  let aggregatedProductId = proposal.aggregatedProductId

  // Guard: a canonical may hold at most one offer per source. Refuse to merge an
  // offer into a canonical that already has an offer from the same store — that
  // would group two listings from one shop, which is never a valid comparison.
  if (aggregatedProductId) {
    const sameSource = await prisma.productOffer.findFirst({
      where: { aggregatedProductId, sourceId: proposal.offer.sourceId },
      select: { id: true },
    })
    if (sameSource) {
      await prisma.matchProposal.update({
        where: { id: proposalId },
        data: { status: "REJECTED", resolvedAt: new Date() },
      })
      revalidatePath("/admin/aggregator/matches")
      return
    }
  }

  // Proposal to create a NEW canonical from this offer.
  if (!aggregatedProductId) {
    const offer = proposal.offer
    const categoryId = await resolveCategoryIdForOffer(offer.sourceId)
    if (!categoryId) throw new Error("No category resolved for this source")

    const name = proposal.proposedName ?? offer.rawName
    const created = await prisma.aggregatedProduct.create({
      data: {
        categoryId,
        name,
        nameEn: proposal.proposedNameEn ?? name,
        slug: await uniqueSlug(name),
        imageUrl: offer.sourceImageUrl,
        brand: offer.brand,
        viscosity: offer.viscosity,
        volume: offer.volume,
        matchKey: proposal.matchKey,
        status: "ACTIVE",
      },
      select: { id: true },
    })
    aggregatedProductId = created.id
  }

  await prisma.$transaction([
    prisma.productOffer.update({
      where: { id: proposal.offerId },
      data: { aggregatedProductId },
    }),
    prisma.matchProposal.update({
      where: { id: proposalId },
      data: { status: "CONFIRMED", resolvedAt: new Date() },
    }),
  ])

  await refreshCanonical(aggregatedProductId)
  revalidatePath("/admin/aggregator/matches")
  revalidatePath("/aggregator")
}

export async function rejectProposal(formData: FormData): Promise<void> {
  await requireAdmin()
  const proposalId = formData.get("proposalId") as string
  await prisma.matchProposal.update({
    where: { id: proposalId },
    data: { status: "REJECTED", resolvedAt: new Date() },
  })
  revalidatePath("/admin/aggregator/matches")
}

/** Move all offers from the source canonical into the target, delete the emptied source. */
export async function mergeCanonicals(formData: FormData): Promise<void> {
  await requireAdmin()
  const fromId = formData.get("sourceCanonicalId") as string
  const intoId = formData.get("targetCanonicalId") as string
  if (!fromId || !intoId || fromId === intoId) return

  // Guard: the merged canonical must still hold at most one offer per store.
  const [fromOffers, intoOffers] = await Promise.all([
    prisma.productOffer.findMany({ where: { aggregatedProductId: fromId }, select: { sourceId: true } }),
    prisma.productOffer.findMany({ where: { aggregatedProductId: intoId }, select: { sourceId: true } }),
  ])
  const intoStores = new Set(intoOffers.map((o) => o.sourceId))
  if (fromOffers.some((o) => intoStores.has(o.sourceId))) {
    // Same store on both sides — refuse; this is not a valid price comparison.
    throw new Error("Cannot merge: both products have an offer from the same store")
  }

  await prisma.productOffer.updateMany({
    where: { aggregatedProductId: fromId },
    data: { aggregatedProductId: intoId },
  })
  await prisma.aggregatedProduct.delete({ where: { id: fromId } })

  await refreshCanonical(intoId)
  revalidatePath("/admin/aggregator/products")
  revalidatePath("/aggregator")
}

export async function setAggregatedStatus(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = formData.get("id") as string
  const status = formData.get("status") as "ACTIVE" | "INACTIVE"
  await prisma.aggregatedProduct.update({ where: { id }, data: { status } })
  revalidatePath("/admin/aggregator/products")
  revalidatePath("/aggregator")
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function resolveCategoryIdForOffer(sourceId: string): Promise<string | null> {
  const source = await prisma.source.findUnique({ where: { id: sourceId }, select: { config: true } })
  const slug = (source?.config as { defaultCategorySlug?: string } | null)?.defaultCategorySlug
  if (!slug) return null
  const cat = await prisma.category.findUnique({ where: { slug }, select: { id: true } })
  return cat?.id ?? null
}

async function uniqueSlug(name: string): Promise<string> {
  const base = slugifyAggregated(name) || "product"
  let slug = base
  let n = 1
  while (await prisma.aggregatedProduct.findUnique({ where: { slug }, select: { id: true } })) {
    n++
    slug = `${base}-${n}`
  }
  return slug
}

/** Recompute the canonical's representative image from its cheapest active offer. */
async function refreshCanonical(aggregatedProductId: string): Promise<void> {
  const cheapest = await prisma.productOffer.findFirst({
    where: { aggregatedProductId, active: true, sourceImageUrl: { not: null } },
    orderBy: { price: "asc" },
    select: { sourceImageUrl: true },
  })
  if (cheapest?.sourceImageUrl) {
    await prisma.aggregatedProduct.update({
      where: { id: aggregatedProductId },
      data: { imageUrl: cheapest.sourceImageUrl },
    })
  }
}
