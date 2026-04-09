import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import RevenueChart from "./RevenueChart"
import { getVendorBalance } from "@/lib/actions/withdrawal"

const statusStyles: Record<string, string> = {
  PENDING:   "bg-amber-50  text-amber-700  border-amber-200",
  CONFIRMED: "bg-blue-50   text-blue-700   border-blue-200",
  SHIPPED:   "bg-purple-50 text-purple-700 border-purple-200",
  DELIVERED: "bg-green-50  text-green-700  border-green-200",
  CANCELLED: "bg-red-50    text-red-600    border-red-200",
}

export default async function VendorDashboardPage() {
  const session = await auth()

  const vendor = await prisma.vendor.findUnique({
    where: { userId: session!.user.id },
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
  })

  if (!vendor) redirect("/vendor/register")

  if (vendor.status !== "APPROVED") {
    return (
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-gray-500">{vendor.name}</p>
        </div>

        {vendor.status === "PENDING" && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-semibold text-amber-800">
              Awaiting admin approval
            </p>
            <p className="mt-1 text-sm text-amber-700">
              Your shop has been submitted and is under review. You'll be able to
              add products once approved. This usually takes 1–2 business days.
            </p>
          </div>
        )}

        {vendor.status === "SUSPENDED" && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-semibold text-red-800">
              Account suspended
            </p>
            <p className="mt-1 text-sm text-red-700">
              Your shop has been suspended. Please contact support for more
              information.
            </p>
          </div>
        )}
      </div>
    )
  }

  // ─── Fetch all analytics data in parallel ─────────────────────────────────

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    deliveredItems,
    totalOrdersCount,
    activeProducts,
    unreadMessages,
    revenueByDay,
    popularProducts,
    recentOrderItems,
    balance,
  ] = await Promise.all([
    // Total revenue + commission rate — delivered order items for this vendor
    prisma.orderItem.findMany({
      where: { vendorId: vendor.id, order: { status: "DELIVERED" } },
      select: { price: true, quantity: true, commissionRate: true },
    }),
    // Total orders count — distinct orders with at least one item from this vendor
    prisma.orderItem
      .findMany({
        where: { vendorId: vendor.id },
        select: { orderId: true },
        distinct: ["orderId"],
      })
      .then((items) => items.length),
    // Active products count
    prisma.product.count({
      where: { vendorId: vendor.id, status: "ACTIVE" },
    }),
    // Unread messages count
    prisma.message.count({
      where: {
        conversation: { vendorId: vendor.id },
        senderId: { not: session!.user.id },
        isRead: false,
      },
    }),
    // Revenue last 30 days — delivered orders grouped by day
    prisma.orderItem.findMany({
      where: {
        vendorId: vendor.id,
        order: { status: "DELIVERED", createdAt: { gte: thirtyDaysAgo } },
      },
      select: {
        price: true,
        quantity: true,
        order: { select: { createdAt: true } },
      },
    }),
    // Popular products — top 5 by total ordered quantity
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { vendorId: vendor.id },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    // Recent orders — last 50 items (grouped into ~5 orders later)
    prisma.orderItem.findMany({
      where: { vendorId: vendor.id },
      orderBy: { order: { createdAt: "desc" } },
      take: 50,
      select: {
        id: true,
        quantity: true,
        price: true,
        product: { select: { name: true } },
        order: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            buyer: { select: { name: true, email: true } },
          },
        },
      },
    }),
    // Vendor balance
    getVendorBalance(vendor.id),
  ])

  // Average commission rate — reuse deliveredItems (no extra query)
  const avgCommissionRate = deliveredItems.length > 0
    ? deliveredItems.reduce((sum, i) => sum + Number(i.commissionRate), 0) / deliveredItems.length
    : 0

  // ─── Compute stats ────────────────────────────────────────────────────────

  const totalRevenue = deliveredItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  )

  // Build revenue chart data (last 30 days)
  const dailyRevenue = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dailyRevenue.set(d.toISOString().slice(0, 10), 0)
  }
  for (const item of revenueByDay) {
    const day = item.order.createdAt.toISOString().slice(0, 10)
    dailyRevenue.set(day, (dailyRevenue.get(day) ?? 0) + Number(item.price) * item.quantity)
  }
  const chartData = Array.from(dailyRevenue.entries()).map(([date, amount]) => ({
    date,
    amount,
  }))

  // Resolve popular product names
  const popularProductIds = popularProducts.map((p) => p.productId)
  const productNames =
    popularProductIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: popularProductIds } },
          select: { id: true, name: true, slug: true },
        })
      : []
  const productNameMap = new Map(productNames.map((p) => [p.id, p]))

  const topProducts = popularProducts.map((p) => ({
    name: productNameMap.get(p.productId)?.name ?? "Unknown",
    slug: productNameMap.get(p.productId)?.slug ?? "",
    totalOrdered: p._sum.quantity ?? 0,
  }))

  // Group recent order items by order, take last 5 orders
  const recentMap = new Map<
    string,
    {
      order: (typeof recentOrderItems)[0]["order"]
      items: typeof recentOrderItems
      vendorTotal: number
    }
  >()
  for (const item of recentOrderItems) {
    const key = item.order.id
    if (!recentMap.has(key)) {
      recentMap.set(key, { order: item.order, items: [], vendorTotal: 0 })
    }
    const entry = recentMap.get(key)!
    entry.items.push(item)
    entry.vendorTotal += Number(item.price) * item.quantity
  }
  const recentOrders = Array.from(recentMap.values()).slice(0, 5)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-0.5 text-sm text-gray-500">{vendor.name}</p>
      </div>

      <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-3">
        <p className="text-sm font-medium text-green-700">
          Your shop is live and accepting orders.
        </p>
      </div>

      {/* ─── Available Balance Highlight ──────────────────────────────── */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 px-6 py-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Available Balance</p>
          <p className="mt-1 text-3xl font-bold text-green-700">₾{balance.availableBalance.toFixed(2)}</p>
          {avgCommissionRate > 0 && (
            <p className="mt-1 text-xs text-green-600">Platform takes {avgCommissionRate.toFixed(1)}% commission</p>
          )}
        </div>
        <Link
          href="/vendor/balance"
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors shrink-0"
        >
          Withdraw →
        </Link>
      </div>

      {/* ─── Stats Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            ₾{totalRevenue.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-gray-400">From delivered orders</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {totalOrdersCount}
          </p>
          <p className="mt-1 text-xs text-gray-400">All time</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
          <p className="text-sm text-gray-500">Products</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {vendor._count.products}
          </p>
          <p className="mt-1 text-xs text-gray-400">{activeProducts} active</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
          <p className="text-sm text-gray-500">Unread Messages</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {unreadMessages}
          </p>
          <p className="mt-1 text-xs text-gray-400">Pending reply</p>
        </div>
      </div>

      {/* ─── Revenue Chart (last 30 days) ────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">
          Revenue — Last 30 Days
        </h2>
        <RevenueChart data={chartData} />
      </div>

      {/* ─── Bottom grid: Popular products + Recent orders ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Products */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Popular Products
          </h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-gray-400">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, i) => (
                <div
                  key={product.slug || i}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-900 truncate">
                      {product.name}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-3">
                    {product.totalOrdered} sold
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Recent Orders
          </h2>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-400">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map(({ order, items, vendorTotal }) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-500">
                        #{order.id.slice(-8).toUpperCase()}
                      </span>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${statusStyles[order.status]}`}
                      >
                        {order.status.charAt(0) +
                          order.status.slice(1).toLowerCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {order.buyer.name ?? order.buyer.email} ·{" "}
                      {items.length} item{items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">
                      ₾{vendorTotal.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {order.createdAt.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
