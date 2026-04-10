import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { optimizeImageUrl } from "@/lib/imageUtils"

const statusStyles: Record<string, string> = {
  PENDING:   "bg-amber-50  text-amber-700  border-amber-200",
  CONFIRMED: "bg-blue-50   text-blue-700   border-blue-200",
  SHIPPED:   "bg-purple-50 text-purple-700 border-purple-200",
  DELIVERED: "bg-green-50  text-green-700  border-green-200",
  CANCELLED: "bg-red-50    text-red-600    border-red-200",
}

const statusLabel: Record<string, string> = {
  PENDING:   "Pending",
  CONFIRMED: "Confirmed",
  SHIPPED:   "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
}

export default async function OrdersPage(props: {
  searchParams: Promise<{ success?: string }>
}) {
  const [{ success }, session] = await Promise.all([props.searchParams, auth()])
  if (!session?.user?.id) redirect("/login")

  const orders = await prisma.order.findMany({
    where: { buyerId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      total: true,
      address: true,
      createdAt: true,
      orderItems: {
        select: {
          id: true,
          quantity: true,
          price: true,
          variantName: true,
          product: { select: { name: true, slug: true, images: { take: 1, orderBy: { order: "asc" }, where: { variantId: null }, select: { url: true } } } },
        },
      },
      returnRequests: { select: { status: true } },
    },
  })

  const now = Date.now()
  function canReturnOrder(order: (typeof orders)[number]): boolean {
    if (order.status !== "DELIVERED") return false
    const days = (now - order.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    if (days > 14) return false
    return !order.returnRequests.some((r) => r.status === "PENDING" || r.status === "APPROVED")
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {orders.length} {orders.length === 1 ? "order" : "orders"}
        </p>
      </div>

      {/* Success banner */}
      {success && (
        <div className="mb-6 rounded-xl bg-green-50 border border-green-200 px-5 py-4">
          <p className="text-sm font-medium text-green-800">
            ✓ Order placed successfully! We&apos;ll confirm it shortly.
          </p>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-gray-400 text-sm mb-4">You haven&apos;t placed any orders yet.</p>
          <Link
            href="/vendors"
            className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Items
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors align-top">
                  <td className="px-6 py-4">
                    <Link href={`/account/orders/${order.id}`} className="hover:text-blue-600 transition-colors">
                      <span className="font-mono text-xs text-gray-500">
                        #{order.id.slice(-8).toUpperCase()}
                      </span>
                    </Link>
                    {/* Item previews */}
                    <div className="mt-2 space-y-1">
                      {order.orderItems.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          {item.product.images[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={optimizeImageUrl(item.product.images[0].url, 48)} alt="" className="w-6 h-6 rounded object-cover bg-gray-100" />
                          )}
                          <span className="text-xs text-gray-600 truncate max-w-[150px]">
                            {item.product.name}
                            {item.variantName && <span className="text-gray-400"> · {item.variantName}</span>}
                          </span>
                          <span className="text-[10px] text-gray-400">×{item.quantity}</span>
                        </div>
                      ))}
                      {order.orderItems.length > 3 && (
                        <p className="text-[10px] text-gray-400">+{order.orderItems.length - 3} more</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {order.createdAt.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {order.orderItems.length}{" "}
                    {order.orderItems.length === 1 ? "item" : "items"}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900">
                    ₾{Number(order.total).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[order.status]}`}
                    >
                      {statusLabel[order.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {canReturnOrder(order) && (
                      <Link
                        href={`/account/orders/${order.id}/return`}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Request Return
                      </Link>
                    )}
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
