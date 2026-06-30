import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getAdapter } from "./registry"
import { politeDelay } from "./http"
import { normalizeName, scoreConfidence, slugifyAggregated } from "./normalize"
import type { SourceConfig, SourceLike, SyncResult } from "./types"

// Grace period before an offer that stops appearing in syncs is deactivated.
const MISSING_GRACE_MS = 48 * 60 * 60 * 1000

/**
 * Sync a single source: scrape its offers, upsert them, propose matches for
 * unmatched offers, and deactivate offers that have disappeared. Idempotent —
 * safe to re-run. Returns counts; also persisted as a SyncRun row.
 */
export async function runSync(sourceSlug: string): Promise<SyncResult> {
  const source = await prisma.source.findUnique({ where: { slug: sourceSlug } })
  if (!source) {
    return emptyResult("FAILED", `Source not found: ${sourceSlug}`)
  }
  if (!source.enabled) {
    return emptyResult("FAILED", `Source disabled: ${sourceSlug}`)
  }

  const adapter = getAdapter(sourceSlug)
  if (!adapter) {
    return emptyResult("FAILED", `No adapter for source: ${sourceSlug}`)
  }

  const config = (source.config as SourceConfig | null) ?? {}
  const sourceLike: SourceLike = {
    id: source.id,
    slug: source.slug,
    name: source.name,
    baseUrl: source.baseUrl,
    config,
  }

  // Resolve the local category these products map to (once).
  const defaultCategory = config.defaultCategorySlug
    ? await prisma.category.findUnique({ where: { slug: config.defaultCategorySlug } })
    : null

  const run = await prisma.syncRun.create({
    data: { sourceId: source.id, status: "RUNNING" },
  })

  const result: SyncResult = {
    status: "SUCCESS",
    offersSeen: 0,
    offersNew: 0,
    offersUpdated: 0,
    offersMissing: 0,
    proposalsCreated: 0,
  }
  const seenUrls = new Set<string>()
  const errors: string[] = []

  try {
    for await (const offer of adapter.scrape(sourceLike)) {
      result.offersSeen++
      seenUrls.add(offer.sourceUrl)

      const identity = normalizeName(offer.rawName)

      const existing = await prisma.productOffer.findUnique({
        where: { sourceId_sourceUrl: { sourceId: source.id, sourceUrl: offer.sourceUrl } },
        select: { id: true, aggregatedProductId: true, specs: true },
      })

      const saved = await prisma.productOffer.upsert({
        where: { sourceId_sourceUrl: { sourceId: source.id, sourceUrl: offer.sourceUrl } },
        create: {
          sourceId: source.id,
          rawName: offer.rawName,
          sourceUrl: offer.sourceUrl,
          sourceImageUrl: offer.sourceImageUrl,
          price: offer.price,
          originalPrice: offer.originalPrice,
          discountPercent: offer.discountPercent,
          availability: offer.availability,
          brand: identity.brand,
          viscosity: identity.viscosity,
          volume: identity.volume,
          matchKey: identity.matchKey,
          specs: offer.specs ?? undefined,
          active: true,
        },
        update: {
          rawName: offer.rawName,
          sourceImageUrl: offer.sourceImageUrl,
          price: offer.price,
          originalPrice: offer.originalPrice,
          discountPercent: offer.discountPercent,
          availability: offer.availability,
          brand: identity.brand,
          viscosity: identity.viscosity,
          volume: identity.volume,
          matchKey: identity.matchKey,
          ...(offer.specs ? { specs: offer.specs } : {}),
          lastCheckedAt: new Date(),
          missingSince: null,
          active: true,
        },
        select: { id: true, aggregatedProductId: true },
      })

      if (existing) result.offersUpdated++
      else result.offersNew++

      // Lazily fetch characteristics once — only when this offer has none yet
      // and the listing didn't already include them inline.
      // Keeps repeated syncs cheap (no detail-page hit for already-known offers).
      if (adapter.fetchSpecs && !existing?.specs && !offer.specs) {
        try {
          const specs = await adapter.fetchSpecs(offer.sourceUrl)
          if (specs) {
            await prisma.productOffer.update({ where: { id: saved.id }, data: { specs } })
          }
        } catch {
          /* specs are best-effort */
        }
        await politeDelay()
      }

      // Every unattached offer gets a canonical (visible) or a cross-source
      // merge proposal — even without a matchKey (it just can't be matched).
      if (!saved.aggregatedProductId) {
        const created = await proposeOrAutoCreateMatch({
          offerId: saved.id,
          sourceId: source.id,
          identity,
          rawName: offer.rawName,
          categoryId: defaultCategory?.id ?? null,
          imageUrl: offer.sourceImageUrl ?? null,
        })
        if (created) result.proposalsCreated++
      }
    }

    // Deactivate offers that were not seen this run.
    const missing = await prisma.productOffer.findMany({
      where: { sourceId: source.id, active: true, sourceUrl: { notIn: Array.from(seenUrls) } },
      select: { id: true, missingSince: true },
    })
    const now = Date.now()
    for (const m of missing) {
      result.offersMissing++
      if (!m.missingSince) {
        await prisma.productOffer.update({ where: { id: m.id }, data: { missingSince: new Date() } })
      } else if (now - m.missingSince.getTime() > MISSING_GRACE_MS) {
        await prisma.productOffer.update({ where: { id: m.id }, data: { active: false } })
      }
    }
  } catch (err) {
    result.status = "FAILED"
    errors.push(err instanceof Error ? err.message : String(err))
  }

  if (result.status !== "FAILED" && errors.length > 0) result.status = "PARTIAL"

  await prisma.syncRun.update({
    where: { id: run.id },
    data: {
      status: result.status,
      finishedAt: new Date(),
      offersSeen: result.offersSeen,
      offersNew: result.offersNew,
      offersUpdated: result.offersUpdated,
      offersMissing: result.offersMissing,
      proposalsCreated: result.proposalsCreated,
      error: errors.length ? errors.join("; ") : null,
    },
  })

  await prisma.source.update({
    where: { id: source.id },
    data: { lastSyncedAt: new Date() },
  })

  if (result.status !== "FAILED") {
    result.error = errors.length ? errors.join("; ") : undefined
    // revalidatePath only works inside a request scope (route handler / server
    // action). When runSync is invoked from a plain script it throws — ignore.
    try {
      revalidatePath("/aggregator")
      revalidatePath("/shop")
    } catch {
      /* not in a request context */
    }
  }

  return result
}

/** Run every enabled source sequentially (polite + within a time budget). */
export async function runAllEnabledSources(): Promise<Record<string, SyncResult>> {
  const sources = await prisma.source.findMany({ where: { enabled: true }, select: { slug: true } })
  const out: Record<string, SyncResult> = {}
  for (const s of sources) {
    out[s.slug] = await runSync(s.slug)
  }
  return out
}

/**
 * Full rebuild of all canonicals/proposals from the offers (source of truth).
 * Recomputes each offer's normalized identity (so a changed matchKey formula —
 * e.g. adding product line — takes effect), wipes derived canonicals/proposals,
 * then re-runs cross-source-only matching. Destructive to canonicals only.
 */
export async function rebuildAllMatches(): Promise<{
  offers: number
  canonicals: number
  proposals: number
}> {
  // 1. Recompute identity for every offer and detach from canonicals.
  const offers = await prisma.productOffer.findMany({ select: { id: true, rawName: true } })
  for (const o of offers) {
    const id = normalizeName(o.rawName)
    await prisma.productOffer.update({
      where: { id: o.id },
      data: {
        brand: id.brand,
        viscosity: id.viscosity,
        volume: id.volume,
        matchKey: id.matchKey,
        aggregatedProductId: null,
      },
    })
  }

  // 2. Wipe derived data.
  await prisma.matchProposal.deleteMany({})
  await prisma.aggregatedProduct.deleteMany({})

  // 3. Re-run matching for every active offer (matchKey optional — keyless
  //    offers still get their own canonical so they remain visible).
  const active = await prisma.productOffer.findMany({
    where: { active: true },
    select: {
      id: true, sourceId: true, rawName: true, sourceImageUrl: true,
      brand: true, viscosity: true, volume: true, matchKey: true,
      source: { select: { config: true } },
    },
  })
  let proposals = 0
  let canonicals = 0
  for (const o of active) {
    const categoryId = await categoryIdForConfig(o.source.config)
    const created = await proposeOrAutoCreateMatch({
      offerId: o.id,
      sourceId: o.sourceId,
      identity: { brand: o.brand, viscosity: o.viscosity, volume: o.volume, line: null, matchKey: o.matchKey },
      rawName: o.rawName,
      categoryId,
      imageUrl: o.sourceImageUrl,
    })
    if (created) proposals++
    else canonicals++
  }
  return { offers: offers.length, canonicals, proposals }
}

async function categoryIdForConfig(config: unknown): Promise<string | null> {
  const slug = (config as { defaultCategorySlug?: string } | null)?.defaultCategorySlug
  if (!slug) return null
  const c = await prisma.category.findUnique({ where: { slug }, select: { id: true } })
  return c?.id ?? null
}

/**
 * Repair matches under the cross-source-only rule. Safe to re-run.
 *  1. Split canonicals that hold more than one offer from the same source
 *     (each kept-back offer is detached and re-matched/auto-created on its own).
 *  2. Drop all PENDING proposals (some may have been same-source).
 *  3. Re-run matching for every active unmatched offer.
 */
export async function reconcileMatches(): Promise<{
  detached: number
  proposalsDropped: number
  proposalsCreated: number
  canonicalsCreated: number
}> {
  // 1. Split same-source duplicates currently sharing a canonical.
  const canonicals = await prisma.aggregatedProduct.findMany({
    select: { id: true, offers: { orderBy: { firstSeenAt: "asc" }, select: { id: true, sourceId: true } } },
  })
  let detached = 0
  for (const c of canonicals) {
    const seen = new Set<string>()
    for (const o of c.offers) {
      if (seen.has(o.sourceId)) {
        await prisma.productOffer.update({ where: { id: o.id }, data: { aggregatedProductId: null } })
        detached++
      } else {
        seen.add(o.sourceId)
      }
    }
  }

  // 2. Drop pending proposals (regenerated correctly below).
  const { count: proposalsDropped } = await prisma.matchProposal.deleteMany({ where: { status: "PENDING" } })

  // 3. Re-match every unmatched active offer (matchKey optional).
  const unmatched = await prisma.productOffer.findMany({
    where: { active: true, aggregatedProductId: null },
    select: {
      id: true, sourceId: true, rawName: true, sourceImageUrl: true,
      brand: true, viscosity: true, volume: true, matchKey: true,
      source: { select: { config: true } },
    },
  })
  let proposalsCreated = 0
  let canonicalsCreated = 0
  for (const o of unmatched) {
    const categoryId = await categoryIdForConfig(o.source.config)
    const created = await proposeOrAutoCreateMatch({
      offerId: o.id,
      sourceId: o.sourceId,
      identity: { brand: o.brand, viscosity: o.viscosity, volume: o.volume, line: null, matchKey: o.matchKey },
      rawName: o.rawName,
      categoryId,
      imageUrl: o.sourceImageUrl,
    })
    if (created) proposalsCreated++
    else canonicalsCreated++
  }

  return { detached, proposalsDropped, proposalsCreated, canonicalsCreated }
}

/**
 * Matching is ONLY ever across DIFFERENT sources — a canonical holds at most one
 * offer per source. Comparing two listings from the same store is meaningless,
 * so same-source offers are never grouped (each gets its own canonical).
 *
 * For an unmatched offer with a usable matchKey:
 *  - existing canonical (from another store) with same key → cross-source merge proposal
 *  - otherwise → auto-create its own single-offer canonical so it is visible
 * Idempotent: never creates a second PENDING proposal for the same offer.
 * Returns true if a MatchProposal row was created (false when a canonical was made).
 */
async function proposeOrAutoCreateMatch({
  offerId,
  sourceId,
  identity,
  rawName,
  categoryId,
  imageUrl,
}: {
  offerId: string
  sourceId: string
  identity: ReturnType<typeof normalizeName>
  rawName: string
  categoryId: string | null
  imageUrl: string | null
}): Promise<boolean> {
  const matchKey = identity.matchKey

  const existingProposal = await prisma.matchProposal.findFirst({
    where: { offerId, status: "PENDING" },
    select: { id: true },
  })
  if (existingProposal) return false

  // 1. With a usable key: an existing canonical (from another store) that does
  //    NOT already carry an offer from this source → cross-source merge proposal.
  if (matchKey) {
    const canonical = await prisma.aggregatedProduct.findFirst({
      where: { matchKey, offers: { none: { sourceId } } },
      select: { id: true },
    })
    if (canonical) {
      await prisma.matchProposal.create({
        data: {
          offerId,
          aggregatedProductId: canonical.id,
          confidence: scoreConfidence(identity, { existingCanonical: true }),
          matchKey,
        },
      })
      return true
    }
  }

  // 2. Otherwise → auto-create this offer's own canonical so it is visible
  //    immediately. A later offer from a DIFFERENT store with the same key will
  //    hit branch 1 above and propose merging into this canonical (one confirm
  //    = a cross-store price comparison). Two offers from the SAME store never
  //    group — each keeps its own canonical.
  if (categoryId) {
    const slug = await uniqueAggregatedSlug(rawName, matchKey)
    const created = await prisma.aggregatedProduct.create({
      data: {
        categoryId,
        name: rawName,
        nameEn: rawName,
        slug,
        imageUrl,
        brand: identity.brand,
        viscosity: identity.viscosity,
        volume: identity.volume,
        matchKey,
        status: "ACTIVE",
      },
      select: { id: true },
    })
    await prisma.productOffer.update({
      where: { id: offerId },
      data: { aggregatedProductId: created.id },
    })
  }
  return false
}

async function uniqueAggregatedSlug(rawName: string, matchKey: string | null): Promise<string> {
  const base = slugifyAggregated(rawName) || (matchKey ? slugifyAggregated(matchKey) : "") || "product"
  let slug = base
  let n = 1
  for (;;) {
    const clash = await prisma.aggregatedProduct.findUnique({ where: { slug }, select: { id: true } })
    if (!clash) return slug
    n++
    slug = `${base}-${n}`
  }
}

function emptyResult(status: SyncResult["status"], error: string): SyncResult {
  return {
    status,
    offersSeen: 0,
    offersNew: 0,
    offersUpdated: 0,
    offersMissing: 0,
    proposalsCreated: 0,
    error,
  }
}
