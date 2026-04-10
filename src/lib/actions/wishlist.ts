"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/authHelpers"

export async function toggleWishlist(productId: string) {
  const userId = await requireUser()

  const existing = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId, productId } },
  })

  if (existing) {
    await prisma.wishlist.delete({ where: { id: existing.id } })
  } else {
    await prisma.wishlist.create({ data: { userId, productId } })
  }

  revalidatePath("/account/wishlist")
  return !existing
}

export async function getWishlist() {
  const userId = await requireUser()

  return prisma.wishlist.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      productId: true,
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          nameEn: true,
          price: true,
          status: true,
          images: { take: 1, orderBy: { order: "asc" }, where: { variantId: null }, select: { url: true } },
          category: { select: { nameEn: true } },
          vendor: { select: { name: true } },
          reviews: { select: { rating: true } },
          variants: { orderBy: { order: "asc" }, select: { id: true, name: true, nameEn: true, price: true, stock: true } },
        },
      },
    },
  })
}

export async function isWishlisted(productId: string): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.id) return false

  const item = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId: session.user.id, productId } },
    select: { id: true },
  })

  return !!item
}

export async function getWishlistIds(): Promise<Set<string>> {
  const session = await auth()
  if (!session?.user?.id) return new Set()

  const items = await prisma.wishlist.findMany({
    where: { userId: session.user.id },
    select: { productId: true },
  })

  return new Set(items.map((i) => i.productId))
}
