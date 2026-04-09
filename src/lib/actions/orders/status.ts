"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { recalculateVendorBadges } from "@/lib/actions/badges"
import type { OrderStatus } from "./helpers"

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  if (session.user.role === "ADMIN") {
    await prisma.order.update({ where: { id: orderId }, data: { status } })
    if (status === "DELIVERED") {
      const items = await prisma.orderItem.findMany({
        where: { orderId },
        select: { vendorId: true },
        distinct: ["vendorId"],
      })
      for (const item of items) await recalculateVendorBadges(item.vendorId)
    }
    revalidatePath("/admin/orders")
    return
  }

  if (session.user.role === "VENDOR") {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!vendor) throw new Error("Vendor not found")

    const match = await prisma.orderItem.findFirst({
      where: { orderId, vendorId: vendor.id },
    })
    if (!match) throw new Error("Order not found")

    await prisma.order.update({ where: { id: orderId }, data: { status } })
    if (status === "DELIVERED") {
      await recalculateVendorBadges(vendor.id)
    }
    revalidatePath("/vendor/orders")
    return
  }

  throw new Error("Unauthorized")
}
