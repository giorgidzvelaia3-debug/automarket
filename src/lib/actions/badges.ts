"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/authHelpers"

type AutoBadge = "TOP_SELLER" | "HIGH_RATED" | "TRUSTED" | "NEW_VENDOR"

export async function recalculateVendorBadges(vendorId: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: { id: true, createdAt: true },
  })
  if (!vendor) return

  const [deliveredCount, reviews] = await Promise.all([
    prisma.orderItem
      .findMany({
        where: { vendorId, order: { status: "DELIVERED" } },
        select: { orderId: true },
        distinct: ["orderId"],
      })
      .then((items) => items.length),
    prisma.review.findMany({
      where: { product: { vendorId } },
      select: { rating: true },
    }),
  ])

  const reviewCount = reviews.length
  const avgRating = reviewCount > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviewCount : 0
  const daysSinceJoined = (Date.now() - vendor.createdAt.getTime()) / (1000 * 60 * 60 * 24)

  const earnedBadges = new Set<AutoBadge>()
  if (deliveredCount >= 50) earnedBadges.add("TOP_SELLER")
  if (avgRating >= 4.5 && reviewCount >= 10) earnedBadges.add("HIGH_RATED")
  if (deliveredCount >= 100 && avgRating >= 4.0) earnedBadges.add("TRUSTED")
  if (daysSinceJoined < 30) earnedBadges.add("NEW_VENDOR")

  // Get current auto-badges (exclude VERIFIED — only manual)
  const currentBadges = await prisma.vendorBadge.findMany({
    where: {
      vendorId,
      badge: { in: ["TOP_SELLER", "HIGH_RATED", "TRUSTED", "NEW_VENDOR"] },
    },
    select: { badge: true },
  })
  const currentSet = new Set(currentBadges.map((b) => b.badge as AutoBadge))

  // Add new badges
  for (const badge of earnedBadges) {
    if (!currentSet.has(badge)) {
      await prisma.vendorBadge.upsert({
        where: { vendorId_badge: { vendorId, badge } },
        update: {},
        create: { vendorId, badge },
      })
    }
  }

  // Remove badges no longer earned
  for (const badge of currentSet) {
    if (!earnedBadges.has(badge)) {
      await prisma.vendorBadge.deleteMany({
        where: { vendorId, badge },
      })
    }
  }
}

export async function adminAssignVerified(vendorId: string) {
  await requireAdmin()
  await prisma.vendorBadge.upsert({
    where: { vendorId_badge: { vendorId, badge: "VERIFIED" } },
    update: {},
    create: { vendorId, badge: "VERIFIED" },
  })
  revalidatePath("/admin/vendors")
}

export async function adminRevokeVerified(vendorId: string) {
  await requireAdmin()
  await prisma.vendorBadge.deleteMany({
    where: { vendorId, badge: "VERIFIED" },
  })
  revalidatePath("/admin/vendors")
}

export async function getVendorBadges(vendorId: string) {
  return prisma.vendorBadge.findMany({
    where: { vendorId },
    orderBy: { awardedAt: "desc" },
    select: { badge: true, awardedAt: true },
  })
}
