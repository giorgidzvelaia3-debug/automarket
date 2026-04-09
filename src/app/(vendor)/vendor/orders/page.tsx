import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import OrderStatusButton from "@/components/OrderStatusButton"

const statusStyles: Record<string, string> = {
  PENDING:   "bg-amber-50  text-amber-700  border-amber-200",
  CONFIRMED: "bg-blue-50   text-blue-700   border-blue-200",
  SHIPPED:   "bg-purple-50 text-purple-700 border-purple-200",
  DELIVERED: "bg-green-50  text-green-700  border-green-200",
  CANCELLED: "bg-red-50    text-red-600    border-red-200",
}

const ALL_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const

export default async function VendorOrdersPage(props: {
  searchParams: Promise<{ status?: string }>
}) {
  const [{ status: filterStatus }, session] = await Promise.all([
    props.searchParams,
    auth(),
  ])

  const vendor = await prisma.vendor.findUnique({
    where: { userId: session!.user.id },
    select: { id: true, status: true },
  })

  if (!vendor) redirect("/vendor/register")
  if (vendor.status !== "APPROVED") redirect("/vendor/dashboard")

  // Get all orders that have at least one item from this vendor
  const orderItems = await prisma.orderItem.findMany({
    where: {
      vendorId: vendor.id,
      ...(filterStatus && ALL_STATUSES.includes(filterStatus as never)
        ? { order: { status: filterStatus as never } }
        : {}),
    },
    orderBy: { order: { createdAt: "desc" } },
    select: {
      id: true,
      quantity: true,
      price: true,
      variantName: true,
      product: { select: { name: true, nameEn: true } },
      order: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          buyer: { select: { name: true, email: true } },
        },
      },
    },
  })

  // Group by order
  const ordersMap = new Map<string, {
    order: (typeof orderItems)[0]["order"]
    items: typeof orderItems
    vendorTotal: number
  }>()

  for (const item of orderItems) {
    const key = item.order.id
    if (!ordersMap.has(key)) {
      ordersMap.set(key, { order: item.order, items: [], vendorTotal: 0 })
    }
    const entry = ordersMap.get(key)!
    entry.items.push(item)
    entry.vendorTotal += Number(item.price) * item.quantity
  }

  const grouped = Array.from(ordersMap.values())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Orders</h1>
        <p className="mt-0.5 text-sm text-gray-500">{grouped.length} orders</p>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/vendor/orders"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            !filterStatus ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          All
        </Link>
        {ALL_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/vendor/orders?status=${s}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === s ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>

      {grouped.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">
          No orders{filterStatus ? ` with status ${filterStatus.toLowerCase()}` : ""}.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Order</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Buyer</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Items</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {grouped.map(({ order, items, vendorTotal }) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/vendor/orders/${order.id}`} className="font-mono text-xs text-gray-500 hover:text-blue-600 transition-colors">
                      #{order.id.slice(-8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-gray-900">{order.buyer.name ?? "—"}</p>
                    <p className="text-xs text-gray-400">{order.buyer.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <div className="space-y-0.5">
                      {items.map((item) => (
                        <p key={item.id} className="text-xs text-gray-600">
                          {item.product.name}{item.variantName && <span className="text-gray-400"> · {item.variantName}</span>} ×{item.quantity}
                        </p>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">
                    ₾{vendorTotal.toFixed(2)}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusStyles[order.status]}`}>
                      {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {order.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3">
                    <OrderStatusButton orderId={order.id} status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
