"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const RETURN_WINDOW_DAYS = 14

async function requireBuyer() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session.user.id
}

async function requireApprovedVendor() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "VENDOR") throw new Error("Unauthorized")
  const vendor = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
    select: { id: true, status: true },
  })
  if (!vendor || vendor.status !== "APPROVED") throw new Error("Vendor not approved")
  return vendor
}

async function requireAdmin() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")
}

export async function canRequestReturn(
  orderId: string
): Promise<{ canReturn: boolean; reason?: string }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true, createdAt: true, returnRequests: { select: { status: true } } },
  })

  if (!order) return { canReturn: false, reason: "Order not found" }
  if (order.status !== "DELIVERED") return { canReturn: false, reason: "Order not delivered" }

  const daysSince = (Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  if (daysSince > RETURN_WINDOW_DAYS) {
    return { canReturn: false, reason: `Return window expired (${RETURN_WINDOW_DAYS} days)` }
  }

  const blocking = order.returnRequests.find(
    (r) => r.status === "PENDING" || r.status === "APPROVED"
  )
  if (blocking) {
    return { canReturn: false, reason: "An active return request already exists" }
  }

  return { canReturn: true }
}

export async function createReturnRequest(data: {
  orderId: string
  vendorId: string
  type: "RETURN" | "WARRANTY"
  reason: "DEFECTIVE" | "WRONG_ITEM" | "NOT_AS_DESCRIBED" | "CHANGED_MIND" | "OTHER"
  description?: string
  images: string[]
  items: { orderItemId: string; quantity: number }[]
}) {
  const buyerId = await requireBuyer()

  const check = await canRequestReturn(data.orderId)
  if (!check.canReturn) throw new Error(check.reason ?? "Cannot return this order")

  // Verify order belongs to buyer
  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    select: { buyerId: true },
  })
  if (!order || order.buyerId !== buyerId) throw new Error("Unauthorized")

  if (data.items.length === 0) throw new Error("No items selected")

  await prisma.returnRequest.create({
    data: {
      orderId: data.orderId,
      buyerId,
      vendorId: data.vendorId,
      type: data.type,
      reason: data.reason,
      description: data.description?.trim() || null,
      images: data.images,
      items: {
        create: data.items.map((i) => ({
          orderItemId: i.orderItemId,
          quantity: i.quantity,
        })),
      },
    },
  })

  revalidatePath("/account/orders")
  revalidatePath("/account/returns")
}

export async function getBuyerReturnRequests() {
  const buyerId = await requireBuyer()
  return prisma.returnRequest.findMany({
    where: { buyerId },
    orderBy: { createdAt: "desc" },
    include: {
      vendor: { select: { name: true, slug: true } },
      items: {
        include: {
          orderItem: {
            select: {
              quantity: true,
              price: true,
              product: { select: { name: true, nameEn: true, slug: true } },
            },
          },
        },
      },
    },
  })
}

export async function getVendorReturnRequests(status?: string) {
  const vendor = await requireApprovedVendor()
  return prisma.returnRequest.findMany({
    where: {
      vendorId: vendor.id,
      ...(status ? { status: status as never } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      buyer: { select: { name: true, email: true } },
      items: {
        include: {
          orderItem: {
            select: {
              quantity: true,
              price: true,
              product: { select: { name: true, nameEn: true } },
            },
          },
        },
      },
    },
  })
}

export async function vendorProcessReturn(
  returnId: string,
  action: "approve" | "reject",
  vendorNote: string
) {
  const vendor = await requireApprovedVendor()

  const ret = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    select: { vendorId: true, status: true },
  })
  if (!ret || ret.vendorId !== vendor.id) throw new Error("Not found")
  if (ret.status !== "PENDING") throw new Error("Already processed")

  await prisma.returnRequest.update({
    where: { id: returnId },
    data: {
      status: action === "approve" ? "APPROVED" : "REJECTED",
      vendorNote: vendorNote.trim() || null,
    },
  })

  revalidatePath("/vendor/returns")
}

export async function markReturnCompleted(returnId: string) {
  const vendor = await requireApprovedVendor()

  const ret = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    select: { vendorId: true, status: true },
  })
  if (!ret || ret.vendorId !== vendor.id) throw new Error("Not found")
  if (ret.status !== "APPROVED") throw new Error("Must be approved first")

  await prisma.returnRequest.update({
    where: { id: returnId },
    data: { status: "COMPLETED" },
  })

  revalidatePath("/vendor/returns")
}

export async function adminGetAllReturns(filters?: { status?: string; vendorId?: string }) {
  await requireAdmin()
  return prisma.returnRequest.findMany({
    where: {
      ...(filters?.status ? { status: filters.status as never } : {}),
      ...(filters?.vendorId ? { vendorId: filters.vendorId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      buyer: { select: { name: true, email: true } },
      vendor: { select: { name: true } },
      items: {
        include: {
          orderItem: {
            select: { quantity: true, product: { select: { nameEn: true } } },
          },
        },
      },
    },
  })
}

export async function adminOverrideReturn(
  returnId: string,
  action: "approve" | "reject" | "complete",
  adminNote: string
) {
  await requireAdmin()

  const statusMap = {
    approve: "APPROVED" as const,
    reject: "REJECTED" as const,
    complete: "COMPLETED" as const,
  }

  await prisma.returnRequest.update({
    where: { id: returnId },
    data: {
      status: statusMap[action],
      adminNote: adminNote.trim() || null,
    },
  })

  revalidatePath("/admin/returns")
}
