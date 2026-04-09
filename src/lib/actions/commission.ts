"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getCachedCommissionSettings } from "@/lib/cache/commission"

async function requireAdmin() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")
}

export async function getCommissionRate(
  productId: string,
  categoryId: string,
  vendorId: string
): Promise<number> {
  // Use cached settings — revalidated when admin changes them
  const allSettings = await getCachedCommissionSettings()

  // Priority: PRODUCT > CATEGORY > VENDOR > GLOBAL
  const settings = allSettings.filter(
    (s) =>
      (s.type === "PRODUCT" && s.referenceId === productId) ||
      (s.type === "CATEGORY" && s.referenceId === categoryId) ||
      (s.type === "VENDOR" && s.referenceId === vendorId) ||
      (s.type === "GLOBAL")
  )

  const product = settings.find((s) => s.type === "PRODUCT")
  if (product) return Number(product.percentage)
  const category = settings.find((s) => s.type === "CATEGORY")
  if (category) return Number(category.percentage)
  const vendor = settings.find((s) => s.type === "VENDOR")
  if (vendor) return Number(vendor.percentage)
  const global = settings.find((s) => s.type === "GLOBAL")
  if (global) return Number(global.percentage)
  return 0
}

export async function setGlobalCommission(percentage: number) {
  await requireAdmin()
  const existing = await prisma.commissionSetting.findFirst({
    where: { type: "GLOBAL" },
  })
  if (existing) {
    await prisma.commissionSetting.update({
      where: { id: existing.id },
      data: { percentage },
    })
  } else {
    await prisma.commissionSetting.create({
      data: { type: "GLOBAL", referenceId: null, percentage },
    })
  }
  revalidatePath("/admin/commission")
}

export async function setVendorCommission(vendorId: string, percentage: number) {
  await requireAdmin()
  await prisma.commissionSetting.upsert({
    where: { type_referenceId: { type: "VENDOR", referenceId: vendorId } },
    update: { percentage },
    create: { type: "VENDOR", referenceId: vendorId, percentage },
  })
  revalidatePath("/admin/commission")
}

export async function setCategoryCommission(categoryId: string, percentage: number) {
  await requireAdmin()
  await prisma.commissionSetting.upsert({
    where: { type_referenceId: { type: "CATEGORY", referenceId: categoryId } },
    update: { percentage },
    create: { type: "CATEGORY", referenceId: categoryId, percentage },
  })
  revalidatePath("/admin/commission")
}

export async function setProductCommission(productId: string, percentage: number) {
  await requireAdmin()
  await prisma.commissionSetting.upsert({
    where: { type_referenceId: { type: "PRODUCT", referenceId: productId } },
    update: { percentage },
    create: { type: "PRODUCT", referenceId: productId, percentage },
  })
  revalidatePath("/admin/commission")
}

export async function deleteCommissionOverride(id: string) {
  await requireAdmin()
  await prisma.commissionSetting.delete({ where: { id } })
  revalidatePath("/admin/commission")
}

export async function getAllCommissionSettings() {
  await requireAdmin()
  return prisma.commissionSetting.findMany({ orderBy: { type: "asc" } })
}
