"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")
}

async function requireVendor() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "VENDOR") throw new Error("Unauthorized")

  const vendor = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!vendor) throw new Error("Vendor profile not found")
  return vendor
}

export async function updateVendorProfile(formData: FormData) {
  const vendor = await requireVendor()

  const name        = (formData.get("name") as string).trim()
  const description = (formData.get("description") as string | null)?.trim() || null
  const phone       = (formData.get("phone") as string | null)?.trim() || null

  await prisma.vendor.update({
    where: { id: vendor.id },
    data: { name, description, phone },
  })

  revalidatePath("/vendor/profile")
  revalidatePath("/vendor/dashboard")
  redirect("/vendor/profile?saved=true")
}

export async function updateOrderLimits(data: {
  minOrderAmount?: number | null
  maxOrderAmount?: number | null
  minOrderQty?: number | null
  maxOrderQty?: number | null
}) {
  const vendor = await requireVendor()

  await prisma.vendor.update({
    where: { id: vendor.id },
    data: {
      minOrderAmount: data.minOrderAmount ?? null,
      maxOrderAmount: data.maxOrderAmount ?? null,
      minOrderQty: data.minOrderQty ?? null,
      maxOrderQty: data.maxOrderQty ?? null,
    },
  })

  revalidatePath("/vendor/profile")
}

export async function approveVendor(id: string) {
  await requireAdmin()
  await prisma.vendor.update({ where: { id }, data: { status: "APPROVED" } })
  revalidatePath("/admin/vendors")
}

export async function suspendVendor(id: string) {
  await requireAdmin()
  await prisma.vendor.update({ where: { id }, data: { status: "SUSPENDED" } })
  revalidatePath("/admin/vendors")
}
