"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

type GuestItem = {
  productId: string
  vendorId: string
  quantity: number
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

    const existing = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId: item.productId } },
      select: { id: true, quantity: true },
    })

    if (existing) {
      const newQty = Math.min(existing.quantity + item.quantity, product.stock)
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
          quantity: Math.min(item.quantity, product.stock),
        },
      })
    }
  }

  revalidatePath("/cart")
}
