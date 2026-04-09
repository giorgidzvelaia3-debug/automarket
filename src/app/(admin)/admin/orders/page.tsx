import { prisma } from "@/lib/prisma"
import OrderStatusButton from "@/components/OrderStatusButton"
import DownloadInvoiceButton from "@/components/store/DownloadInvoiceButton"

const statusStyles: Record<string, string> = {
  PENDING:   "bg-amber-50  text-amber-700  border-amber-200",
  CONFIRMED: "bg-blue-50   text-blue-700   border-blue-200",
  SHIPPED:   "bg-purple-50 text-purple-700 border-purple-200",
  DELIVERED: "bg-green-50  text-green-700  border-green-200",
  CANCELLED: "bg-red-50    text-red-600    border-red-200",
}

const ALL_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const

export default async function AdminOrdersPage(props: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: filterStatus } = await props.searchParams

  const orders = await prisma.order.findMany({
    where: filterStatus && ALL_STATUSES.includes(filterStatus as never)
      ? { status: filterStatus as never }
      : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      total: true,
      address: true,
      couponCode: true,
      couponDiscount: true,
      createdAt: true,
      buyer: { select: { name: true, email: true } },
      guestName: true,
      orderItems: {
        select: {
          quantity: true,
          price: true,
          variantName: true,
          product: { select: { name: true, nameEn: true } },
          vendor: { select: { name: true } },
        },
      },
    },
  })

  function vendorNames(items: { vendor: { name: string } }[]) {
    return [...new Set(items.map((i) => i.vendor.name))].join(", ")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Orders</h1>
        <p className="mt-0.5 text-sm text-gray-500">{orders.length} orders</p>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        <a
          href="/admin/orders"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            !filterStatus ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          All
        </a>
        {ALL_STATUSES.map((s) => (
          <a
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === s ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </a>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">No orders found.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Order</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Buyer</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendors</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => {
                const subtotal = order.orderItems.reduce(
                  (sum, item) => sum + Number(item.price) * item.quantity, 0
                )
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs text-gray-500">
                        #{order.id.slice(-8).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-gray-900">{order.buyer?.name ?? order.guestName ?? "—"}</p>
                      <p className="text-xs text-gray-400">{order.buyer?.email ?? ""}</p>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-600 max-w-[160px] truncate">
                      {vendorNames(order.orderItems)}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      ₾{Number(order.total).toFixed(2)}
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
                      <div className="flex items-center gap-1 justify-end">
                        <DownloadInvoiceButton
                          variant="icon"
                          order={{
                            orderId: order.id,
                            createdAt: order.createdAt.toISOString(),
                            buyerName: order.buyer?.name ?? order.guestName ?? "Guest",
                            buyerPhone: "",
                            buyerAddress: order.address ?? "",
                            vendorName: vendorNames(order.orderItems),
                            items: order.orderItems.map((item) => ({
                              productName: item.product.name,
                              productNameEn: item.product.nameEn,
                              variantName: item.variantName,
                              quantity: item.quantity,
                              unitPrice: Number(item.price),
                              total: Number(item.price) * item.quantity,
                            })),
                            subtotal,
                            couponCode: order.couponCode,
                            couponDiscount: order.couponDiscount ? Number(order.couponDiscount) : null,
                            grandTotal: Number(order.total),
                          }}
                        />
                        <OrderStatusButton orderId={order.id} status={order.status} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
