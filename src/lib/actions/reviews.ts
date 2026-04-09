"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { recalculateVendorBadges } from "@/lib/actions/badges"

export async function createReview(
  productId: string,
  rating: number,
  comment: string
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const clampedRating = Math.max(1, Math.min(5, Math.round(rating)))
  const trimmedComment = comment.trim() || null

  await prisma.review.upsert({
    where: { userId_productId: { userId: session.user.id, productId } },
    update: { rating: clampedRating, comment: trimmedComment },
    create: {
      userId: session.user.id,
      productId,
      rating: clampedRating,
      comment: trimmedComment,
    },
  })

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true, vendorId: true },
  })

  if (product) {
    await recalculateVendorBadges(product.vendorId)
  }

  revalidatePath(`/products/${product?.slug}`)
}
