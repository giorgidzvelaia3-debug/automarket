"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/authHelpers"
import { getFlashSalesForProducts } from "@/lib/actions/flashSales"
import { toProductCardProps } from "@/lib/productCard"
import {
  filterWishlistProductIds,
  getWishlistProductIdsToCreate,
  normalizeWishlistProductIds,
} from "@/lib/wishlistUtils"

const wishlistProductSelect = {
  id: true,
  slug: true,
  name: true,
  nameEn: true,
  price: true,
  stock: true,
  status: true,
  createdAt: true,
  vendorId: true,
  images: {
    take: 4,
    orderBy: { order: "asc" as const },
    where: { variantId: null },
    select: { url: true },
  },
  category: { select: { nameEn: true, name: true } },
  vendor: { select: { id: true, name: true, slug: true } },
  reviews: { select: { rating: true } },
  variants: {
    orderBy: { order: "asc" as const },
    select: { id: true, name: true, nameEn: true, price: true, stock: true },
  },
}

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
  revalidatePath("/wishlist")
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
        select: wishlistProductSelect,
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

export async function mergeGuestWishlist(productIds: string[]) {
  const userId = await requireUser()
  const normalizedIds = normalizeWishlistProductIds(productIds)

  if (normalizedIds.length === 0) {
    return { mergedIds: [] as string[], mergedCount: 0 }
  }

  const activeProducts = await prisma.product.findMany({
    where: { id: { in: normalizedIds }, status: "ACTIVE" },
    select: { id: true },
  })
  const activeProductIds = activeProducts.map((product) => product.id)

  if (activeProductIds.length === 0) {
    revalidatePath("/account/wishlist")
    return { mergedIds: [] as string[], mergedCount: 0 }
  }

  const existingItems = await prisma.wishlist.findMany({
    where: { userId, productId: { in: activeProductIds } },
    select: { productId: true },
  })
  const toCreate = getWishlistProductIdsToCreate(
    existingItems.map((item) => item.productId),
    activeProductIds
  )

  if (toCreate.length > 0) {
    await prisma.wishlist.createMany({
      data: toCreate.map((productId) => ({ userId, productId })),
      skipDuplicates: true,
    })
  }

  revalidatePath("/account/wishlist")
  return { mergedIds: activeProductIds, mergedCount: toCreate.length }
}

export async function getGuestWishlistProducts(productIds: string[], locale: string) {
  const normalizedIds = normalizeWishlistProductIds(productIds)

  if (normalizedIds.length === 0) {
    return []
  }

  const products = await prisma.product.findMany({
    where: { id: { in: normalizedIds }, status: "ACTIVE" },
    select: wishlistProductSelect,
  })

  const validIds = filterWishlistProductIds(
    normalizedIds,
    products.map((product) => product.id)
  )

  if (validIds.length === 0) {
    return []
  }

  const flashSaleMap = await getFlashSalesForProducts(validIds)
  const productsById = new Map(products.map((product) => [product.id, product]))

  return validIds.flatMap((productId) => {
    const product = productsById.get(productId)
    if (!product) return []

    return [
      toProductCardProps(product, {
        locale,
        flashSale: flashSaleMap.get(productId) ?? null,
        isLoggedIn: false,
        isWishlisted: true,
      }),
    ]
  })
}
