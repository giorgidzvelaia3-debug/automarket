"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireApprovedVendor() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "VENDOR") throw new Error("Unauthorized")
  const vendor = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
    select: { id: true, status: true },
  })
  if (!vendor || vendor.status !== "APPROVED") throw new Error("Vendor not approved")
  return vendor
}

async function requireAdmin() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")
}

// ─── Vendor Actions ────────────────────────────────────────────────────────

type SaleItemInput = {
  productId: string
  discountType: "PERCENTAGE" | "FIXED"
  discountValue: number
  maxQuantity?: number
}

export async function createFlashSale(data: {
  title: string
  titleEn: string
  startTime: string
  endTime: string
  saleMode?: "PRODUCTS" | "CATEGORY"
  categoryId?: string
  categoryDiscount?: number
  categoryDiscountType?: "PERCENTAGE" | "FIXED"
  items: SaleItemInput[]
}) {
  const vendor = await requireApprovedVendor()
  const mode = data.saleMode ?? "PRODUCTS"

  // For category mode, generate items from all vendor products in that category
  let itemsToCreate: SaleItemInput[] = data.items
  if (mode === "CATEGORY" && data.categoryId && data.categoryDiscount !== undefined) {
    const catProducts = await prisma.product.findMany({
      where: { vendorId: vendor.id, categoryId: data.categoryId, status: "ACTIVE" },
      select: { id: true, price: true },
    })
    itemsToCreate = catProducts.map((p) => ({
      productId: p.id,
      discountType: data.categoryDiscountType ?? "PERCENTAGE",
      discountValue: data.categoryDiscount!,
    }))
  }

  // Fetch product prices
  const productIds = itemsToCreate.map((i) => i.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, vendorId: vendor.id, status: "ACTIVE" },
    select: { id: true, price: true },
  })
  const priceMap = new Map(products.map((p) => [p.id, Number(p.price)]))

  await prisma.flashSale.create({
    data: {
      vendorId: vendor.id,
      title: data.title,
      titleEn: data.titleEn,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      saleMode: mode,
      categoryId: mode === "CATEGORY" ? data.categoryId : null,
      categoryDiscount: mode === "CATEGORY" ? data.categoryDiscount : null,
      categoryDiscountType: mode === "CATEGORY" ? data.categoryDiscountType : null,
      items: {
        create: itemsToCreate.map((item) => {
          const originalPrice = priceMap.get(item.productId) ?? 0
          const salePrice =
            item.discountType === "PERCENTAGE"
              ? originalPrice * (1 - item.discountValue / 100)
              : originalPrice - item.discountValue
          return {
            productId: item.productId,
            discountType: item.discountType,
            discountValue: item.discountValue,
            originalPrice,
            salePrice: Math.max(0, Math.round(salePrice * 100) / 100),
            maxQuantity: item.maxQuantity ?? null,
          }
        }),
      },
    },
  })

  revalidatePath("/vendor/flash-sales")
  redirect("/vendor/flash-sales")
}

export async function updateFlashSale(
  id: string,
  data: {
    title: string
    titleEn: string
    startTime: string
    endTime: string
    saleMode?: "PRODUCTS" | "CATEGORY"
    categoryId?: string
    categoryDiscount?: number
    categoryDiscountType?: "PERCENTAGE" | "FIXED"
    items: (SaleItemInput & { id?: string })[]
  }
) {
  const vendor = await requireApprovedVendor()

  const sale = await prisma.flashSale.findUnique({
    where: { id },
    select: { vendorId: true, status: true },
  })
  if (!sale || sale.vendorId !== vendor.id) throw new Error("Not found")
  if (sale.status === "ENDED") throw new Error("Cannot edit ended sale")

  const mode = data.saleMode ?? "PRODUCTS"

  // For category mode, generate items
  let itemsToSave = data.items
  if (mode === "CATEGORY" && data.categoryId && data.categoryDiscount !== undefined) {
    const catProducts = await prisma.product.findMany({
      where: { vendorId: vendor.id, categoryId: data.categoryId, status: "ACTIVE" },
      select: { id: true, price: true },
    })
    itemsToSave = catProducts.map((p) => ({
      productId: p.id,
      discountType: data.categoryDiscountType ?? "PERCENTAGE",
      discountValue: data.categoryDiscount!,
    }))
  }

  const productIds = itemsToSave.map((i) => i.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, vendorId: vendor.id },
    select: { id: true, price: true },
  })
  const priceMap = new Map(products.map((p) => [p.id, Number(p.price)]))

  await prisma.$transaction(async (tx) => {
    await tx.flashSale.update({
      where: { id },
      data: {
        title: data.title,
        titleEn: data.titleEn,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        saleMode: mode,
        categoryId: mode === "CATEGORY" ? data.categoryId : null,
        categoryDiscount: mode === "CATEGORY" ? data.categoryDiscount : null,
        categoryDiscountType: mode === "CATEGORY" ? data.categoryDiscountType : null,
      },
    })

    await tx.flashSaleItem.deleteMany({ where: { flashSaleId: id } })

    for (const item of itemsToSave) {
      const originalPrice = priceMap.get(item.productId) ?? 0
      const salePrice =
        item.discountType === "PERCENTAGE"
          ? originalPrice * (1 - item.discountValue / 100)
          : originalPrice - item.discountValue
      await tx.flashSaleItem.create({
        data: {
          flashSaleId: id,
          productId: item.productId,
          discountType: item.discountType,
          discountValue: item.discountValue,
          originalPrice,
          salePrice: Math.max(0, Math.round(salePrice * 100) / 100),
          maxQuantity: item.maxQuantity ?? null,
        },
      })
    }
  })

  revalidatePath("/vendor/flash-sales")
  redirect("/vendor/flash-sales")
}

export async function deleteFlashSale(id: string) {
  const vendor = await requireApprovedVendor()
  const sale = await prisma.flashSale.findUnique({
    where: { id },
    select: { vendorId: true },
  })
  if (!sale || sale.vendorId !== vendor.id) throw new Error("Not found")

  await prisma.flashSale.delete({ where: { id } })
  revalidatePath("/vendor/flash-sales")
}

export async function getVendorFlashSales() {
  const vendor = await requireApprovedVendor()
  return prisma.flashSale.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  })
}

// ─── Public Queries ────────────────────────────────────────────────────────

export async function getActiveFlashSales() {
  const now = new Date()
  return prisma.flashSale.findMany({
    where: {
      status: "ACTIVE",
      startTime: { lte: now },
      endTime: { gte: now },
    },
    orderBy: { endTime: "asc" },
    include: {
      vendor: { select: { name: true, slug: true } },
      items: {
        include: {
          product: {
            select: {
              id: true,
              slug: true,
              name: true,
              nameEn: true,
              stock: true,
              images: { take: 1, orderBy: { order: "asc" }, where: { variantId: null }, select: { url: true } },
              category: { select: { nameEn: true } },
              vendor: { select: { name: true, slug: true } },
            },
          },
        },
      },
    },
  })
}

export async function getFeaturedFlashSales() {
  const now = new Date()
  return prisma.flashSale.findMany({
    where: {
      status: "ACTIVE",
      featured: true,
      startTime: { lte: now },
      endTime: { gte: now },
    },
    orderBy: { endTime: "asc" },
    take: 3,
    include: {
      vendor: { select: { name: true, slug: true } },
      items: {
        take: 6,
        include: {
          product: {
            select: {
              id: true,
              slug: true,
              name: true,
              nameEn: true,
              stock: true,
              images: { take: 1, orderBy: { order: "asc" }, where: { variantId: null }, select: { url: true } },
              vendor: { select: { name: true, slug: true } },
            },
          },
        },
      },
    },
  })
}

export type FlashSaleData = {
  salePrice: number
  originalPrice: number
  discountType: "PERCENTAGE" | "FIXED"
  discountValue: number
  endTime: string
  title: string
}

export async function getFlashSaleByProduct(productId: string): Promise<FlashSaleData | null> {
  const now = new Date()

  // Check specific product-level flash sale item
  const productItem = await prisma.flashSaleItem.findFirst({
    where: {
      productId,
      flashSale: {
        status: "ACTIVE",
        startTime: { lte: now },
        endTime: { gte: now },
      },
    },
    select: {
      id: true,
      salePrice: true,
      originalPrice: true,
      discountType: true,
      discountValue: true,
      maxQuantity: true,
      soldCount: true,
      flashSale: { select: { endTime: true, title: true, titleEn: true, saleMode: true } },
    },
  })

  // Also check category-level sales (where saleMode=CATEGORY and product's category matches)
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { categoryId: true, price: true },
  })

  let categoryItem: typeof productItem = null
  if (product) {
    const catSale = await prisma.flashSale.findFirst({
      where: {
        status: "ACTIVE",
        saleMode: "CATEGORY",
        categoryId: product.categoryId,
        startTime: { lte: now },
        endTime: { gte: now },
      },
      select: {
        endTime: true,
        title: true,
        titleEn: true,
        saleMode: true,
        categoryDiscount: true,
        categoryDiscountType: true,
        items: {
          where: { productId },
          take: 1,
          select: {
            id: true,
            salePrice: true,
            originalPrice: true,
            discountType: true,
            discountValue: true,
            maxQuantity: true,
            soldCount: true,
          },
        },
      },
    })

    if (catSale?.items[0]) {
      categoryItem = {
        ...catSale.items[0],
        flashSale: { endTime: catSale.endTime, title: catSale.title, titleEn: catSale.titleEn, saleMode: catSale.saleMode },
      }
    }
  }

  // Return whichever gives a bigger discount
  let chosen = productItem
  if (productItem && categoryItem) {
    chosen = Number(productItem.salePrice) <= Number(categoryItem.salePrice) ? productItem : categoryItem
  } else if (categoryItem) {
    chosen = categoryItem
  }

  if (!chosen) return null

  return {
    salePrice: Number(chosen.salePrice),
    originalPrice: Number(chosen.originalPrice),
    discountType: chosen.discountType as "PERCENTAGE" | "FIXED",
    discountValue: Number(chosen.discountValue),
    endTime: chosen.flashSale.endTime.toISOString(),
    title: chosen.flashSale.titleEn,
  }
}

/**
 * Bulk fetch flash sale data for multiple products.
 * Returns a Map<productId, FlashSaleData> for efficient lookup.
 */
export async function getFlashSalesForProducts(
  productIds: string[]
): Promise<Map<string, FlashSaleData>> {
  if (productIds.length === 0) return new Map()
  const now = new Date()

  // Direct product-level items
  const directItems = await prisma.flashSaleItem.findMany({
    where: {
      productId: { in: productIds },
      flashSale: { status: "ACTIVE", startTime: { lte: now }, endTime: { gte: now } },
    },
    include: {
      flashSale: { select: { endTime: true, titleEn: true, saleMode: true } },
    },
  })

  // Category-level sales — need to get product categories
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, categoryId: true },
  })
  const productCats = new Map(products.map((p) => [p.id, p.categoryId]))
  const categoryIds = Array.from(new Set(products.map((p) => p.categoryId)))

  const catSales = await prisma.flashSale.findMany({
    where: {
      status: "ACTIVE",
      saleMode: "CATEGORY",
      categoryId: { in: categoryIds },
      startTime: { lte: now },
      endTime: { gte: now },
    },
    include: {
      items: { where: { productId: { in: productIds } } },
    },
  })

  const map = new Map<string, FlashSaleData>()

  for (const item of directItems) {
    map.set(item.productId, {
      salePrice: Number(item.salePrice),
      originalPrice: Number(item.originalPrice),
      discountType: item.discountType as "PERCENTAGE" | "FIXED",
      discountValue: Number(item.discountValue),
      endTime: item.flashSale.endTime.toISOString(),
      title: item.flashSale.titleEn,
    })
  }

  // Apply category sales (only if no direct sale exists, or if category gives a better deal)
  for (const sale of catSales) {
    for (const item of sale.items) {
      const candidate: FlashSaleData = {
        salePrice: Number(item.salePrice),
        originalPrice: Number(item.originalPrice),
        discountType: item.discountType as "PERCENTAGE" | "FIXED",
        discountValue: Number(item.discountValue),
        endTime: sale.endTime.toISOString(),
        title: sale.titleEn,
      }
      const existing = map.get(item.productId)
      if (!existing || candidate.salePrice < existing.salePrice) {
        map.set(item.productId, candidate)
      }
    }
  }

  // Use productCats only to keep the variable referenced (in case needed for future filtering)
  void productCats
  return map
}

// ─── Admin Actions ─────────────────────────────────────────────────────────

export async function adminRejectFlashSale(id: string) {
  await requireAdmin()
  await prisma.flashSale.update({ where: { id }, data: { status: "REJECTED" } })
  revalidatePath("/admin/flash-sales")
}

export async function adminToggleFeatured(id: string) {
  await requireAdmin()
  const sale = await prisma.flashSale.findUnique({ where: { id }, select: { featured: true } })
  if (!sale) throw new Error("Not found")
  await prisma.flashSale.update({ where: { id }, data: { featured: !sale.featured } })
  revalidatePath("/admin/flash-sales")
}

export async function adminGetAllFlashSales(statusFilter?: string) {
  return prisma.flashSale.findMany({
    where: statusFilter ? { status: statusFilter as never } : {},
    orderBy: { createdAt: "desc" },
    include: {
      vendor: { select: { name: true } },
      _count: { select: { items: true } },
    },
  })
}
