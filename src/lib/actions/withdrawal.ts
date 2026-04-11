"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin, requireApprovedVendor } from "@/lib/authHelpers"

const MIN_WITHDRAWAL = 50

export async function getVendorBalance(vendorId: string) {
  // Authorization: only the vendor themselves or an admin may view balance
  const session = await (await import("@/lib/auth")).auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  if (session.user.role === "ADMIN") {
    // Admin can view any vendor balance
  } else if (session.user.role === "VENDOR") {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!vendor || vendor.id !== vendorId) throw new Error("Unauthorized")
  } else {
    throw new Error("Unauthorized")
  }

  const [deliveredItems, pendingItems, withdrawals] = await Promise.all([
    prisma.orderItem.findMany({
      where: { vendorId, order: { status: "DELIVERED" } },
      select: { vendorEarning: true },
    }),
    prisma.orderItem.findMany({
      where: {
        vendorId,
        order: { status: { in: ["PENDING", "CONFIRMED", "SHIPPED"] } },
      },
      select: { vendorEarning: true },
    }),
    prisma.vendorWithdrawal.findMany({
      where: { vendorId },
      select: { amount: true, status: true },
    }),
  ])

  const totalEarned = deliveredItems.reduce((sum, i) => sum + Number(i.vendorEarning), 0)
  const pendingBalance = pendingItems.reduce((sum, i) => sum + Number(i.vendorEarning), 0)
  const reservedOrPaid = withdrawals
    .filter((w) => w.status === "APPROVED" || w.status === "PAID")
    .reduce((sum, w) => sum + Number(w.amount), 0)
  const totalWithdrawn = withdrawals
    .filter((w) => w.status === "PAID")
    .reduce((sum, w) => sum + Number(w.amount), 0)

  return {
    availableBalance: Math.max(0, totalEarned - reservedOrPaid),
    pendingBalance,
    totalEarned,
    totalWithdrawn,
  }
}

export async function requestWithdrawal(
  amount: number,
  method: "BANK_TRANSFER" | "PAYPAL" | "CASH" | "OTHER",
  note?: string
) {
  const vendor = await requireApprovedVendor()

  if (amount < MIN_WITHDRAWAL) {
    throw new Error(`Minimum withdrawal amount is ₾${MIN_WITHDRAWAL}`)
  }

  const balance = await getVendorBalance(vendor.id)
  if (amount > balance.availableBalance) {
    throw new Error("Amount exceeds available balance")
  }

  await prisma.vendorWithdrawal.create({
    data: {
      vendorId: vendor.id,
      amount,
      method,
      note: note || null,
      status: "PENDING",
    },
  })

  revalidatePath("/vendor/balance")
}

export async function getVendorWithdrawals() {
  const vendor = await requireApprovedVendor()
  return prisma.vendorWithdrawal.findMany({
    where: { vendorId: vendor.id },
    orderBy: { requestedAt: "desc" },
  })
}

export async function adminGetAllWithdrawals(status?: string) {
  await requireAdmin()
  return prisma.vendorWithdrawal.findMany({
    where: status ? { status: status as never } : {},
    orderBy: { requestedAt: "desc" },
    include: {
      vendor: { select: { name: true, slug: true } },
    },
  })
}

export async function adminProcessWithdrawal(
  withdrawalId: string,
  action: "approve" | "reject" | "paid",
  adminNote?: string
) {
  await requireAdmin()

  const statusMap = {
    approve: "APPROVED" as const,
    reject: "REJECTED" as const,
    paid: "PAID" as const,
  }

  await prisma.vendorWithdrawal.update({
    where: { id: withdrawalId },
    data: {
      status: statusMap[action],
      adminNote: adminNote || null,
      processedAt: action === "paid" ? new Date() : undefined,
    },
  })

  revalidatePath("/admin/withdrawals")
}

export async function getMinWithdrawalAmount(): Promise<number> {
  return MIN_WITHDRAWAL
}
