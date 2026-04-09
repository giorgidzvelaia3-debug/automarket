import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type Range = "month" | "lastMonth" | "all"

function getDateRange(range: Range): { gte?: Date; lt?: Date } {
  const now = new Date()
  if (range === "month") return { gte: new Date(now.getFullYear(), now.getMonth(), 1) }
  if (range === "lastMonth") {
    return {
      gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      lt: new Date(now.getFullYear(), now.getMonth(), 1),
    }
  }
  return {}
}

export default async function VendorEarningsPage(props: {
  searchParams: Promise<{ range?: string }>
}) {
  const session = await auth()
  const vendor = await prisma.vendor.findUnique({
    where: { userId: session!.user.id },
    select: { id: true, status: true },
  })
  if (!vendor) redirect("/vendor/register")
  if (vendor.status !== "APPROVED") redirect("/vendor/dashboard")

  const { range: rangeParam } = await props.searchParams
  const range: Range = rangeParam === "lastMonth" ? "lastMonth" : rangeParam === "all" ? "all" : "month"
  const dateRange = getDateRange(range)

  const items = await prisma.orderItem.findMany({
    where: {
      vendorId: vendor.id,
      order: {
        status: "DELIVERED",
        ...(Object.keys(dateRange).length > 0 ? { createdAt: dateRange } : {}),
      },
    },
    orderBy: { order: { createdAt: "desc" } },
    select: {
      id: true,
      quantity: true,
      price: true,
      commissionRate: true,
      adminCommission: true,
      vendorEarning: true,
      product: { select: { name: true, nameEn: true } },
      order: { select: { id: true, createdAt: true } },
    },
  })

  // Group by order
  const ordersMap = new Map<string, {
    orderId: string
    createdAt: Date
    products: string[]
    saleTotal: number
    adminTook: number
    youEarned: number
    rate: number
  }>()
  for (const item of items) {
    const key = item.order.id
    if (!ordersMap.has(key)) {
      ordersMap.set(key, {
        orderId: item.order.id,
        createdAt: item.order.createdAt,
        products: [],
        saleTotal: 0,
        adminTook: 0,
        youEarned: 0,
        rate: Number(item.commissionRate),
      })
    }
    const o = ordersMap.get(key)!
    o.products.push(item.product.name)
    o.saleTotal += Number(item.price) * item.quantity
    o.adminTook += Number(item.adminCommission)
    o.youEarned += Number(item.vendorEarning)
  }
  const orders = Array.from(ordersMap.values())

  const totalSales = orders.reduce((sum, o) => sum + o.saleTotal, 0)
  const totalAdmin = orders.reduce((sum, o) => sum + o.adminTook, 0)
  const totalEarned = orders.reduce((sum, o) => sum + o.youEarned, 0)
  const avgRate = totalSales > 0 ? (totalAdmin / totalSales) * 100 : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Earnings</h1>
        <p className="mt-0.5 text-sm text-gray-500">Detailed breakdown of your sales</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-gray-500">Total Sales</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">₾{totalSales.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-gray-500">Avg Commission Rate</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{avgRate.toFixed(1)}%</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-gray-500">You Earned</p>
          <p className="mt-1 text-2xl font-bold text-green-600">₾{totalEarned.toFixed(2)}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {([
          { value: "month", label: "This Month" },
          { value: "lastMonth", label: "Last Month" },
          { value: "all", label: "All Time" },
        ] as const).map((opt) => (
          <Link
            key={opt.value}
            href={`/vendor/earnings?range=${opt.value}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              range === opt.value ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {/* Per-order table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {orders.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No earnings in this period.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Products</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Sale</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Rate</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Admin</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">You Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o.orderId} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">#{o.orderId.slice(-8).toUpperCase()}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {o.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-600 truncate max-w-[200px]">
                    {o.products.join(", ")}
                  </td>
                  <td className="px-5 py-3 text-right">₾{o.saleTotal.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right text-gray-500">{o.rate.toFixed(1)}%</td>
                  <td className="px-5 py-3 text-right text-blue-600">₾{o.adminTook.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right font-semibold text-green-600">₾{o.youEarned.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold border-t border-gray-200">
                <td colSpan={3} className="px-5 py-3 text-xs text-gray-500 uppercase">Total</td>
                <td className="px-5 py-3 text-right">₾{totalSales.toFixed(2)}</td>
                <td />
                <td className="px-5 py-3 text-right text-blue-600">₾{totalAdmin.toFixed(2)}</td>
                <td className="px-5 py-3 text-right text-green-600">₾{totalEarned.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}
