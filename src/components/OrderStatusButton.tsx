"use client"

import { useTransition } from "react"
import { updateOrderStatus } from "@/lib/actions/orders"

type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED"

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING:   "CONFIRMED",
  CONFIRMED: "SHIPPED",
  SHIPPED:   "DELIVERED",
}

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  PENDING:   "Confirm",
  CONFIRMED: "Mark Shipped",
  SHIPPED:   "Mark Delivered",
}

export default function OrderStatusButton({
  orderId,
  status,
}: {
  orderId: string
  status: OrderStatus
}) {
  const [isPending, startTransition] = useTransition()
  const next = NEXT_STATUS[status]

  if (!next) return null

  function handleClick() {
    startTransition(async () => {
      await updateOrderStatus(orderId, next!)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
    >
      {isPending ? "…" : NEXT_LABEL[status]}
    </button>
  )
}
