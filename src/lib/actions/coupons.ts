"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")
  return session.user.id!
}

async function requireApprovedVendor() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "VENDOR") throw new Error("Unauthorized")
  const vendor = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
    select: { id: true, status: true },
  })
  if (!vendor || vendor.status !== "APPROVED") throw new Error("Vendor not approved")
  return { vendor, userId: session.user.id }
}

export type ValidateCartItem = {
  productId: string
  vendorId: string
  categoryId: string
  price: number
  quantity: number
}

export async function validateCoupon(
  code: string,
  cartItems: ValidateCartItem[],
  userId?: string
): Promise<
  | { valid: true; discount: number; couponId: string; couponCode: string }
  | { valid: false; error: string }
> {
  if (!code.trim()) return { valid: false, error: "Enter a coupon code" }

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
  })

  if (!coupon) return { valid: false, error: "Coupon not found" }
  if (!coupon.isActive) return { valid: false, error: "Coupon is not active" }

  const now = new Date()
  if (coupon.startDate && coupon.startDate > now) {
    return { valid: false, error: "Coupon is not yet active" }
  }
  if (coupon.endDate && coupon.endDate < now) {
    return { valid: false, error: "Coupon has expired" }
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, error: "Coupon usage limit reached" }
  }

  // Determine applicable items based on scope
  let applicableItems: ValidateCartItem[] = []
  switch (coupon.scope) {
    case "MARKETPLACE":
      applicableItems = cartItems
      break
    case "VENDOR":
      applicableItems = cartItems.filter((i) => i.vendorId === coupon.vendorId)
      break
    case "CATEGORY":
      applicableItems = cartItems.filter((i) => i.categoryId === coupon.categoryId)
      break
    case "PRODUCT":
      applicableItems = cartItems.filter((i) => i.productId === coupon.productId)
      break
  }

  if (applicableItems.length === 0) {
    return { valid: false, error: "Coupon does not apply to any item in your cart" }
  }

  const applicableTotal = applicableItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

  if (coupon.minOrderAmount && applicableTotal < Number(coupon.minOrderAmount)) {
    return {
      valid: false,
      error: `Minimum order amount is ₾${Number(coupon.minOrderAmount).toFixed(2)}`,
    }
  }

  // Calculate discount
  let discount = 0
  if (coupon.type === "PERCENTAGE") {
    discount = applicableTotal * (Number(coupon.value) / 100)
  } else {
    discount = Math.min(Number(coupon.value), applicableTotal)
  }
  discount = Math.round(discount * 100) / 100

  void userId // reserved for per-user limits in future

  return { valid: true, discount, couponId: coupon.id, couponCode: coupon.code }
}

export async function createCoupon(data: {
  code: string
  type: "PERCENTAGE" | "FIXED"
  value: number
  scope: "MARKETPLACE" | "VENDOR" | "PRODUCT" | "CATEGORY"
  vendorId?: string
  categoryId?: string
  productId?: string
  minOrderAmount?: number
  maxUses?: number
  startDate?: string
  endDate?: string
}) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  let createdBy: "ADMIN" | "VENDOR"
  let createdById: string
  let vendorId = data.vendorId

  if (session.user.role === "ADMIN") {
    createdBy = "ADMIN"
    createdById = session.user.id
  } else if (session.user.role === "VENDOR") {
    const { vendor, userId } = await requireApprovedVendor()
    createdBy = "VENDOR"
    createdById = userId
    // Vendors can only create coupons scoped to their own store
    if (data.scope === "MARKETPLACE") throw new Error("Vendors cannot create marketplace coupons")
    vendorId = vendor.id
  } else {
    throw new Error("Unauthorized")
  }

  await prisma.coupon.create({
    data: {
      code: data.code.trim().toUpperCase(),
      type: data.type,
      value: data.value,
      scope: data.scope,
      vendorId: data.scope === "MARKETPLACE" ? null : vendorId,
      categoryId: data.scope === "CATEGORY" ? data.categoryId : null,
      productId: data.scope === "PRODUCT" ? data.productId : null,
      minOrderAmount: data.minOrderAmount ?? null,
      maxUses: data.maxUses ?? null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      createdBy,
      createdById,
    },
  })

  revalidatePath("/admin/coupons")
  revalidatePath("/vendor/coupons")
}

export async function getAdminCoupons() {
  await requireAdmin()
  return prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      vendor: { select: { name: true } },
      category: { select: { nameEn: true } },
      product: { select: { nameEn: true } },
      _count: { select: { uses: true } },
    },
  })
}

export async function getVendorCoupons() {
  const { vendor } = await requireApprovedVendor()
  return prisma.coupon.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { nameEn: true } },
      product: { select: { nameEn: true } },
      _count: { select: { uses: true } },
    },
  })
}

export async function toggleCoupon(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const coupon = await prisma.coupon.findUnique({ where: { id } })
  if (!coupon) throw new Error("Not found")

  // Vendor can only toggle own coupons
  if (session.user.role === "VENDOR") {
    const { vendor } = await requireApprovedVendor()
    if (coupon.vendorId !== vendor.id) throw new Error("Unauthorized")
  } else if (session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  await prisma.coupon.update({
    where: { id },
    data: { isActive: !coupon.isActive },
  })

  revalidatePath("/admin/coupons")
  revalidatePath("/vendor/coupons")
}

export async function deleteCoupon(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const coupon = await prisma.coupon.findUnique({ where: { id } })
  if (!coupon) throw new Error("Not found")

  if (session.user.role === "VENDOR") {
    const { vendor } = await requireApprovedVendor()
    if (coupon.vendorId !== vendor.id) throw new Error("Unauthorized")
  } else if (session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  await prisma.coupon.delete({ where: { id } })
  revalidatePath("/admin/coupons")
  revalidatePath("/vendor/coupons")
}
