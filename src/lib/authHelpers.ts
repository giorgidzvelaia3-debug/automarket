"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Require any authenticated user. Returns userId.
 */
export async function requireUser(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session.user.id
}

/**
 * Require ADMIN role. Returns userId.
 */
export async function requireAdmin(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") throw new Error("Unauthorized")
  return session.user.id
}

/**
 * Require an approved vendor. Returns vendor { id, userId }.
 */
export async function requireApprovedVendor() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const vendor = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
    select: { id: true, userId: true, status: true },
  })
  if (!vendor || vendor.status !== "APPROVED") throw new Error("Vendor not approved")

  return vendor
}

/**
 * Require vendor owns a specific product. Returns vendor.
 */
export async function requireVendorOwnership(productId: string) {
  const vendor = await requireApprovedVendor()

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { vendorId: true },
  })
  if (!product || product.vendorId !== vendor.id) throw new Error("Not your product")

  return vendor
}
