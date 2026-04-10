"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getFlashSaleByProduct } from "@/lib/actions/flashSales"
import { getEffectivePrice } from "@/lib/flashSalePrice"
import { serializeCartItem } from "@/lib/serialize"

async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session.user.id
}

export async function addToCart(productId: string, quantity: number = 1, variantId?: string) {
  const userId = await requireUser()

  const product = await prisma.product.findUnique({
    where: { id: productId, status: "ACTIVE" },
    select: {
      id: true,
      vendorId: true,
      price: true,
      stock: true,
      _count: { select: { variants: true } },
    },
  })

  if (!product) throw new Error("Product not found")

  if (product._count.variants > 0 && !variantId) {
    throw new Error("Please select a variant")
  }

  // Validate variant + get its price
  let effectiveStock = product.stock
  let variantPrice: number | null = null
  if (variantId) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { stock: true, price: true, productId: true },
    })
    if (!variant || variant.productId !== productId) throw new Error("Variant not found")
    effectiveStock = variant.stock
    variantPrice = Number(variant.price)
  }

  // Compute effective price (with flash sale)
  const flashSale = await getFlashSaleByProduct(productId)
  const finalPrice = getEffectivePrice(Number(product.price), variantPrice, flashSale)

  const existing = await prisma.cartItem.findFirst({
    where: { userId, productId, variantId: variantId ?? null },
    select: { id: true, quantity: true },
  })

  if (existing) {
    const newQty = Math.min(existing.quantity + quantity, effectiveStock)
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQty, price: finalPrice },
    })
  } else {
    await prisma.cartItem.create({
      data: {
        userId,
        productId,
        vendorId: product.vendorId,
        variantId: variantId ?? null,
        quantity: Math.min(quantity, effectiveStock),
        price: finalPrice,
      },
    })
  }

  revalidatePath("/cart")
}

export async function removeFromCart(cartItemId: string) {
  const userId = await requireUser()

  await prisma.cartItem.deleteMany({
    where: { id: cartItemId, userId },
  })

  revalidatePath("/cart")
}

export async function updateCartQuantity(cartItemId: string, quantity: number) {
  const userId = await requireUser()

  if (quantity < 1) {
    await prisma.cartItem.deleteMany({ where: { id: cartItemId, userId } })
  } else {
    const item = await prisma.cartItem.findFirst({
      where: { id: cartItemId, userId },
      select: { product: { select: { stock: true } } },
    })
    if (!item) throw new Error("Cart item not found")

    await prisma.cartItem.updateMany({
      where: { id: cartItemId, userId },
      data: { quantity: Math.min(quantity, item.product.stock) },
    })
  }

  revalidatePath("/cart")
}

export async function getCart() {
  const userId = await requireUser()

  const items = await prisma.cartItem.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      quantity: true,
      variantId: true,
      price: true,
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          nameEn: true,
          price: true,
          stock: true,
          images: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
        },
      },
      variant: {
        select: {
          id: true, name: true, nameEn: true, price: true, stock: true,
          images: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
        },
      },
      vendor: {
        select: { id: true, name: true, slug: true },
      },
    },
  })

  return items.map(serializeCartItem)
}
