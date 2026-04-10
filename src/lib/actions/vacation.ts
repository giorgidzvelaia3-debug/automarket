"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireApprovedVendor } from "@/lib/authHelpers"

export async function setVacationMode(
  enabled: boolean,
  message?: string,
  endDate?: string
) {
  const vendor = await requireApprovedVendor()

  await prisma.vendor.update({
    where: { id: vendor.id },
    data: {
      vacationMode: enabled,
      vacationMessage: enabled ? (message?.trim() || null) : null,
      vacationEnd: enabled && endDate ? new Date(endDate) : null,
    },
  })

  revalidatePath("/vendor/profile")
  revalidatePath("/vendor/dashboard")
}

export async function getVacationStatus() {
  const vendor = await requireApprovedVendor()
  return prisma.vendor.findUnique({
    where: { id: vendor.id },
    select: { vacationMode: true, vacationMessage: true, vacationEnd: true },
  })
}

export async function checkAndAutoEndVacations() {
  const now = new Date()
  await prisma.vendor.updateMany({
    where: {
      vacationMode: true,
      vacationEnd: { not: null, lt: now },
    },
    data: {
      vacationMode: false,
      vacationMessage: null,
      vacationEnd: null,
    },
  })
}
