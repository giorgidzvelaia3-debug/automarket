"use server"

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getCommissionRate } from "@/lib/actions/commission"
import { validateCoupon, type ValidateCartItem } from "@/lib/actions/coupons"
import { validateOrderLimits } from "./validate"
import { getCartItemPrice, type GuestCartEntry } from "./helpers"

export async function createOrder(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id

  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    select: {
      id: true,
      quantity: true,
      vendorId: true,
      variantId: true,
      price: true,
      product: { select: { id: true, price: true, stock: true, status: true, categoryId: true } },
      variant: { select: { id: true, name: true, price: true, stock: true } },
      vendor: { select: { name: true, vacationMode: true } },
    },
  })

  // Vacation mode check
  for (const item of cartItems) {
    if (item.vendor.vacationMode) {
      redirect(`/cart?error=Vendor+${encodeURIComponent(item.vendor.name)}+is+currently+on+vacation`)
    }
  }

  // Order limits check (use stored prices)
  const limitCheck = await validateOrderLimits(
    cartItems.map((item) => ({
      vendorId: item.vendorId,
      price: getCartItemPrice(item),
      quantity: item.quantity,
    }))
  )
  if (!limitCheck.valid) {
    redirect(`/cart?error=${encodeURIComponent(limitCheck.errors.join(" · "))}`)
  }

  const couponCode = (formData.get("couponCode") as string | null)?.trim() || null

  if (cartItems.length === 0) redirect("/cart")

  const address = [
    formData.get("fullName") as string,
    formData.get("address") as string,
    formData.get("city") as string,
    formData.get("phone") as string,
  ]
    .map((s) => s.trim())
    .join(", ")

  const note = (formData.get("note") as string | null)?.trim() || null

  const subtotal = cartItems.reduce(
    (sum, item) => sum + getCartItemPrice(item) * item.quantity,
    0
  )

  // Validate coupon if provided
  let couponDiscount = 0
  let couponId: string | null = null
  let couponCodeFinal: string | null = null
  if (couponCode) {
    const validateItems: ValidateCartItem[] = cartItems.map((item) => ({
      productId: item.product.id,
      vendorId: item.vendorId,
      categoryId: item.product.categoryId,
      price: getCartItemPrice(item),
      quantity: item.quantity,
    }))
    const result = await validateCoupon(couponCode, validateItems, userId)
    if (result.valid) {
      couponDiscount = result.discount
      couponId = result.couponId
      couponCodeFinal = result.couponCode
    }
  }

  const total = Math.max(0, subtotal - couponDiscount)

  // Compute commission per item
  const itemsWithCommission = await Promise.all(
    cartItems.map(async (item) => {
      const rate = await getCommissionRate(item.product.id, item.product.categoryId, item.vendorId)
      const unitPrice = getCartItemPrice(item)
      const itemTotal = unitPrice * item.quantity
      const adminCommission = Math.round((itemTotal * rate) / 100 * 100) / 100
      const vendorEarning = Math.round((itemTotal - adminCommission) * 100) / 100
      return { ...item, rate, adminCommission, vendorEarning, unitPrice }
    })
  )

  // Create order, order items, decrement stock, clear cart — all in one transaction
  try {
  await prisma.$transaction(async (tx) => {
    // Validate stock INSIDE transaction to prevent race conditions
    for (const item of itemsWithCommission) {
      if (item.variantId) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          select: { stock: true },
        })
        if (!variant || variant.stock < item.quantity) {
          throw new Error("Some items are out of stock. Please review your cart.")
        }
      } else {
        const product = await tx.product.findUnique({
          where: { id: item.product.id },
          select: { stock: true, status: true },
        })
        if (!product || product.status !== "ACTIVE" || product.stock < item.quantity) {
          throw new Error("Some items are out of stock. Please review your cart.")
        }
      }
    }

    const order = await tx.order.create({
      data: {
        buyerId: userId,
        total,
        couponCode: couponCodeFinal,
        couponDiscount: couponDiscount > 0 ? couponDiscount : null,
        address,
        note,
        orderItems: {
          create: itemsWithCommission.map((item) => ({
            productId: item.product.id,
            vendorId: item.vendorId,
            variantId: item.variantId ?? null,
            variantName: item.variant?.name ?? null,
            quantity: item.quantity,
            price: item.unitPrice,
            commissionRate: item.rate,
            adminCommission: item.adminCommission,
            vendorEarning: item.vendorEarning,
          })),
        },
      },
    })

    // Decrement stock for each product/variant
    for (const item of itemsWithCommission) {
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        })
      } else {
        await tx.product.update({
          where: { id: item.product.id },
          data: { stock: { decrement: item.quantity } },
        })
      }
    }

    // Coupon usage tracking
    if (couponId && couponDiscount > 0) {
      await tx.couponUse.create({
        data: { couponId, orderId: order.id, userId, discount: couponDiscount },
      })
      await tx.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      })
    }

    // Clear cart
    await tx.cartItem.deleteMany({ where: { userId } })

    return order
  })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Order failed"
    redirect(`/cart?error=${encodeURIComponent(message)}`)
  }

  redirect("/account/orders?success=true")
}

export async function createGuestOrder(
  formData: FormData
): Promise<{ error?: string } | void> {
  const fullName = (formData.get("fullName") as string)?.trim()
  const email = (formData.get("email") as string)?.trim()
  const phone = (formData.get("phone") as string)?.trim()
  const addressLine = (formData.get("address") as string)?.trim()
  const city = (formData.get("city") as string)?.trim()
  const note = (formData.get("note") as string | null)?.trim() || null
  const cartItemsRaw = formData.get("cartItems") as string
  const couponCode = (formData.get("couponCode") as string | null)?.trim() || null

  if (!fullName || !email || !phone || !addressLine || !city) {
    return { error: "All required fields must be filled." }
  }

  let cartEntries: GuestCartEntry[]
  try {
    cartEntries = JSON.parse(cartItemsRaw)
  } catch {
    return { error: "Invalid cart data." }
  }

  if (!cartEntries.length) {
    return { error: "Cart is empty." }
  }

  // Validate products
  const productIds = cartEntries.map((e) => e.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: "ACTIVE" },
    select: {
      id: true,
      price: true,
      stock: true,
      vendorId: true,
      categoryId: true,
      vendor: { select: { name: true, vacationMode: true } },
    },
  })
  const productMap = new Map(products.map((p) => [p.id, p]))

  for (const entry of cartEntries) {
    const product = productMap.get(entry.productId)
    if (!product || product.stock < entry.quantity) {
      return { error: "Some items are out of stock. Please review your cart." }
    }
    if (product.vendor.vacationMode) {
      return { error: `Vendor ${product.vendor.name} is currently on vacation.` }
    }
  }

  // Order limits check
  const limitCheck = await validateOrderLimits(
    cartEntries.map((entry) => {
      const product = productMap.get(entry.productId)!
      return {
        vendorId: product.vendorId,
        price: entry.price,
        quantity: entry.quantity,
      }
    })
  )
  if (!limitCheck.valid) {
    return { error: limitCheck.errors.join(" · ") }
  }

  const address = [fullName, addressLine, city, phone].join(", ")
  const subtotal = cartEntries.reduce((sum, entry) => sum + entry.price * entry.quantity, 0)

  // Validate coupon
  let couponDiscount = 0
  let couponId: string | null = null
  let couponCodeFinal: string | null = null
  if (couponCode) {
    const validateItems: ValidateCartItem[] = cartEntries.map((entry) => {
      const product = productMap.get(entry.productId)!
      return {
        productId: entry.productId,
        vendorId: product.vendorId,
        categoryId: product.categoryId,
        price: entry.price,
        quantity: entry.quantity,
      }
    })
    const result = await validateCoupon(couponCode, validateItems)
    if (result.valid) {
      couponDiscount = result.discount
      couponId = result.couponId
      couponCodeFinal = result.couponCode
    }
  }

  const total = Math.max(0, subtotal - couponDiscount)

  // Compute commission per item
  const entriesWithCommission = await Promise.all(
    cartEntries.map(async (entry) => {
      const product = productMap.get(entry.productId)!
      const rate = await getCommissionRate(product.id, product.categoryId, product.vendorId)
      const itemTotal = entry.price * entry.quantity
      const adminCommission = Math.round((itemTotal * rate) / 100 * 100) / 100
      const vendorEarning = Math.round((itemTotal - adminCommission) * 100) / 100
      return { entry, product, rate, adminCommission, vendorEarning }
    })
  )

  await prisma.$transaction(async (tx) => {
    // Validate stock INSIDE transaction to prevent race conditions
    for (const entry of cartEntries) {
      const product = await tx.product.findUnique({
        where: { id: entry.productId },
        select: { stock: true, status: true },
      })
      if (!product || product.status !== "ACTIVE" || product.stock < entry.quantity) {
        throw new Error("Some items are out of stock. Please review your cart.")
      }
    }

    const order = await tx.order.create({
      data: {
        buyerId: null,
        guestName: fullName,
        guestEmail: email,
        guestPhone: phone,
        total,
        couponCode: couponCodeFinal,
        couponDiscount: couponDiscount > 0 ? couponDiscount : null,
        address,
        note,
        orderItems: {
          create: entriesWithCommission.map(({ entry, product, rate, adminCommission, vendorEarning }) => ({
            productId: entry.productId,
            vendorId: product.vendorId,
            variantId: entry.variantId ?? null,
            variantName: entry.variantName ?? null,
            quantity: entry.quantity,
            price: entry.price,
            commissionRate: rate,
            adminCommission,
            vendorEarning,
          })),
        },
      },
    })

    if (couponId && couponDiscount > 0) {
      await tx.couponUse.create({
        data: { couponId, orderId: order.id, userId: null, discount: couponDiscount },
      })
      await tx.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      })
    }

    for (const entry of cartEntries) {
      await tx.product.update({
        where: { id: entry.productId },
        data: { stock: { decrement: entry.quantity } },
      })
    }
  })
}
