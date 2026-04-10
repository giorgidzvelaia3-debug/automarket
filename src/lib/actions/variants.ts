"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireVendorOwnership } from "@/lib/authHelpers"

export async function addVariant(
  productId: string,
  data: { name: string; nameEn: string; price: string; stock: number; sku?: string }
) {
  await requireVendorOwnership(productId)

  const maxOrder = await prisma.productVariant.aggregate({
    where: { productId },
    _max: { order: true },
  })

  await prisma.productVariant.create({
    data: {
      productId,
      name: data.name,
      nameEn: data.nameEn,
      price: data.price,
      stock: data.stock,
      sku: data.sku || null,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  })

  revalidatePath(`/vendor/products/${productId}/edit`)
}

export async function updateVariant(
  variantId: string,
  data: { name: string; nameEn: string; price: string; stock: number; sku?: string }
) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { productId: true },
  })
  if (!variant) throw new Error("Variant not found")

  await requireVendorOwnership(variant.productId)

  await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      name: data.name,
      nameEn: data.nameEn,
      price: data.price,
      stock: data.stock,
      sku: data.sku || null,
    },
  })

  revalidatePath(`/vendor/products/${variant.productId}/edit`)
}

export async function deleteVariant(variantId: string) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { productId: true },
  })
  if (!variant) throw new Error("Variant not found")

  await requireVendorOwnership(variant.productId)

  await prisma.productVariant.delete({ where: { id: variantId } })

  revalidatePath(`/vendor/products/${variant.productId}/edit`)
}

export async function saveVariants(
  productId: string,
  variants: { id?: string; name: string; nameEn: string; price: string; stock: number; sku?: string }[]
) {
  await requireVendorOwnership(productId)

  const existing = await prisma.productVariant.findMany({
    where: { productId },
    select: { id: true },
  })

  const incomingIds = variants.filter((v) => v.id).map((v) => v.id!)
  const toDelete = existing.filter((e) => !incomingIds.includes(e.id))

  await prisma.$transaction(async (tx) => {
    // Delete removed variants
    if (toDelete.length > 0) {
      await tx.productVariant.deleteMany({
        where: { id: { in: toDelete.map((d) => d.id) } },
      })
    }

    // Upsert each variant
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i]
      if (v.id) {
        await tx.productVariant.update({
          where: { id: v.id },
          data: { name: v.name, nameEn: v.nameEn, price: v.price, stock: v.stock, sku: v.sku || null, order: i },
        })
      } else {
        await tx.productVariant.create({
          data: { productId, name: v.name, nameEn: v.nameEn, price: v.price, stock: v.stock, sku: v.sku || null, order: i },
        })
      }
    }
  })

  revalidatePath(`/vendor/products/${productId}/edit`)
}
