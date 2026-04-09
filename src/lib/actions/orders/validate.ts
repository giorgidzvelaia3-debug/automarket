"use server"

import { prisma } from "@/lib/prisma"
import type { LimitCheckItem } from "./helpers"

export async function validateOrderLimits(
  cartItems: LimitCheckItem[]
): Promise<{ valid: true } | { valid: false; errors: string[] }> {
  const groups = new Map<string, { total: number; qty: number }>()
  for (const item of cartItems) {
    if (!groups.has(item.vendorId)) groups.set(item.vendorId, { total: 0, qty: 0 })
    const g = groups.get(item.vendorId)!
    g.total += item.price * item.quantity
    g.qty += item.quantity
  }

  if (groups.size === 0) return { valid: true }

  const vendors = await prisma.vendor.findMany({
    where: { id: { in: Array.from(groups.keys()) } },
    select: {
      id: true, name: true,
      minOrderAmount: true, maxOrderAmount: true,
      minOrderQty: true, maxOrderQty: true,
    },
  })

  const errors: string[] = []
  for (const vendor of vendors) {
    const g = groups.get(vendor.id)
    if (!g) continue

    if (vendor.minOrderAmount && g.total < Number(vendor.minOrderAmount)) {
      errors.push(`მინიმალური შეკვეთა ${vendor.name}-ისთვის არის ₾${Number(vendor.minOrderAmount).toFixed(2)} (ახლა: ₾${g.total.toFixed(2)})`)
    }
    if (vendor.maxOrderAmount && g.total > Number(vendor.maxOrderAmount)) {
      errors.push(`მაქსიმალური შეკვეთა ${vendor.name}-ისთვის არის ₾${Number(vendor.maxOrderAmount).toFixed(2)} (ახლა: ₾${g.total.toFixed(2)})`)
    }
    if (vendor.minOrderQty && g.qty < vendor.minOrderQty) {
      errors.push(`მინიმალური რაოდენობა ${vendor.name}-ისთვის არის ${vendor.minOrderQty} (ახლა: ${g.qty})`)
    }
    if (vendor.maxOrderQty && g.qty > vendor.maxOrderQty) {
      errors.push(`მაქსიმალური რაოდენობა ${vendor.name}-ისთვის არის ${vendor.maxOrderQty} (ახლა: ${g.qty})`)
    }
  }

  if (errors.length > 0) return { valid: false, errors }
  return { valid: true }
}
