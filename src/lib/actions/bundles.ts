"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { addToCart } from "./cart"

async function requireVendorOwnership(productId: string) {
  const { auth } = await import("@/lib/auth")
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const vendor = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!vendor) throw new Error("Not a vendor")

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { vendorId: true },
  })
  if (!product || product.vendorId !== vendor.id) throw new Error("Not your product")

  return vendor
}

export async function getBundleItems(productId: string) {
  return prisma.productBundle.findMany({
    where: { productId },
    orderBy: { order: "asc" },
    select: {
      id: true,
      discountPercent: true,
      order: true,
      bundleProduct: {
        select: {
          id: true,
          name: true,
          nameEn: true,
          price: true,
          stock: true,
          slug: true,
          images: { take: 1, orderBy: { order: "asc" }, where: { variantId: null }, select: { url: true } },
          variants: { orderBy: { order: "asc" }, select: { id: true, name: true, nameEn: true, price: true, stock: true } },
        },
      },
    },
  })
}

export async function addBundleItem(productId: string, bundleProductId: string, discountPercent: number = 5) {
  await requireVendorOwnership(productId)

  if (productId === bundleProductId) throw new Error("Cannot bundle a product with itself")

  const maxOrder = await prisma.productBundle.aggregate({
    where: { productId },
    _max: { order: true },
  })

  await prisma.productBundle.create({
    data: {
      productId,
      bundleProductId,
      discountPercent: Math.max(0, Math.min(50, discountPercent)),
      order: (maxOrder._max.order ?? -1) + 1,
    },
  })

  revalidatePath(`/vendor/products/${productId}/edit`)
}

export async function updateBundleItem(id: string, discountPercent: number) {
  const bundle = await prisma.productBundle.findUnique({
    where: { id },
    select: { productId: true },
  })
  if (!bundle) throw new Error("Not found")

  await requireVendorOwnership(bundle.productId)

  await prisma.productBundle.update({
    where: { id },
    data: { discountPercent: Math.max(0, Math.min(50, discountPercent)) },
  })

  revalidatePath(`/vendor/products/${bundle.productId}/edit`)
}

export async function removeBundleItem(id: string) {
  const bundle = await prisma.productBundle.findUnique({
    where: { id },
    select: { productId: true },
  })
  if (!bundle) throw new Error("Not found")

  await requireVendorOwnership(bundle.productId)

  await prisma.productBundle.delete({ where: { id } })
  revalidatePath(`/vendor/products/${bundle.productId}/edit`)
}

export async function searchVendorProducts(productId: string, query: string) {
  const vendor = await requireVendorOwnership(productId)

  const existing = await prisma.productBundle.findMany({
    where: { productId },
    select: { bundleProductId: true },
  })
  const excludeIds = [productId, ...existing.map((b) => b.bundleProductId)]

  return prisma.product.findMany({
    where: {
      vendorId: vendor.id,
      status: "ACTIVE",
      id: { notIn: excludeIds },
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { nameEn: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 5,
    select: {
      id: true,
      name: true,
      nameEn: true,
      price: true,
      images: { take: 1, orderBy: { order: "asc" }, where: { variantId: null }, select: { url: true } },
    },
  })
}

export async function addBundleToCart(items: { productId: string; discountedPrice?: number }[]) {
  for (const item of items) {
    await addToCart(item.productId, 1)
  }
}
