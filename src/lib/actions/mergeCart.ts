"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

type GuestItem = {
  productId: string
  vendorId: string
  quantity: number
  variantId?: string | null
}

export async function mergeGuestCart(guestItems: GuestItem[]) {
  const session = await auth()
  if (!session?.user?.id || !guestItems.length) return

  const userId = session.user.id

  for (const item of guestItems) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId, status: "ACTIVE" },
      select: { id: true, vendorId: true, stock: true },
    })
    if (!product) continue

    const variantId = item.variantId ?? null

    // If variant, check variant stock instead
    let effectiveStock = product.stock
    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        select: { stock: true },
      })
      if (!variant) continue
      effectiveStock = variant.stock
    }

    const existing = await prisma.cartItem.findFirst({
      where: { userId, productId: item.productId, variantId },
      select: { id: true, quantity: true },
    })

    if (existing) {
      const newQty = Math.min(existing.quantity + item.quantity, effectiveStock)
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      })
    } else {
      await prisma.cartItem.create({
        data: {
          userId,
          productId: item.productId,
          vendorId: product.vendorId,
          variantId,
          quantity: Math.min(item.quantity, effectiveStock),
        },
      })
    }
  }

  revalidatePath("/cart")
}
