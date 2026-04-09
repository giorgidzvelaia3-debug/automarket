import Link from "next/link"
import { prisma } from "@/lib/prisma"

type Range = "month" | "lastMonth" | "all"

function getDateRange(range: Range): { gte?: Date; lt?: Date } {
  const now = new Date()
  if (range === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { gte: start }
  }
  if (range === "lastMonth") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 1)
    return { gte: start, lt: end }
  }
  return {}
}

export default async function AdminEarningsPage(props: {
  searchParams: Promise<{ range?: string }>
}) {
  const { range: rangeParam } = await props.searchParams
  const range: Range = rangeParam === "lastMonth" ? "lastMonth" : rangeParam === "all" ? "all" : "month"

  const dateRange = getDateRange(range)
  const lastMonthRange = getDateRange("lastMonth")
  const thisMonthRange = getDateRange("month")

  const [filtered, allItems, lastMonthItems, thisMonthItems, vendors] = await Promise.all([
    prisma.orderItem.findMany({
      where: {
        order: {
          status: "DELIVERED",
          ...(Object.keys(dateRange).length > 0 ? { createdAt: dateRange } : {}),
        },
      },
      select: { vendorId: true, adminCommission: true, vendorEarning: true, price: true, quantity: true, commissionRate: true },
    }),
    prisma.orderItem.findMany({
      where: { order: { status: "DELIVERED" } },
      select: { adminCommission: true },
    }),
    prisma.orderItem.findMany({
      where: { order: { status: "DELIVERED", createdAt: lastMonthRange } },
      select: { adminCommission: true },
    }),
    prisma.orderItem.findMany({
      where: { order: { status: "DELIVERED", createdAt: thisMonthRange } },
      select: { adminCommission: true },
    }),
    prisma.vendor.findMany({ select: { id: true, name: true } }),
  ])

  const totalEarnings = allItems.reduce((sum, i) => sum + Number(i.adminCommission), 0)
  const lastMonthTotal = lastMonthItems.reduce((sum, i) => sum + Number(i.adminCommission), 0)
  const thisMonthTotal = thisMonthItems.reduce((sum, i) => sum + Number(i.adminCommission), 0)

  // Per-vendor breakdown for filtered range
  const vendorMap = new Map(vendors.map((v) => [v.id, v.name]))
  const perVendor = new Map<string, { sales: number; adminEarned: number; vendorEarned: number; rateSum: number; count: number }>()
  for (const item of filtered) {
    const key = item.vendorId
    if (!perVendor.has(key)) {
      perVendor.set(key, { sales: 0, adminEarned: 0, vendorEarned: 0, rateSum: 0, count: 0 })
    }
    const stat = perVendor.get(key)!
    stat.sales += Number(item.price) * item.quantity
    stat.adminEarned += Number(item.adminCommission)
    stat.vendorEarned += Number(item.vendorEarning)
    stat.rateSum += Number(item.commissionRate)
    stat.count++
  }
  const vendorRows = Array.from(perVendor.entries())
    .map(([id, stat]) => ({
      id,
      name: vendorMap.get(id) ?? "Unknown",
      sales: stat.sales,
      adminEarned: stat.adminEarned,
      vendorEarned: stat.vendorEarned,
      avgRate: stat.count > 0 ? stat.rateSum / stat.count : 0,
    }))
    .sort((a, b) => b.adminEarned - a.adminEarned)

  const filteredTotal = vendorRows.reduce((sum, r) => sum + r.adminEarned, 0)
  const monthDelta = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Marketplace Earnings</h1>
        <p className="mt-0.5 text-sm text-gray-500">Commission earned from vendor sales</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-gray-500">Total Earnings (All Time)</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">₾{totalEarnings.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-gray-500">This Month</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">₾{thisMonthTotal.toFixed(2)}</p>
          {lastMonthTotal > 0 && (
            <p className={`text-xs font-medium ${monthDelta >= 0 ? "text-green-600" : "text-red-500"}`}>
              {monthDelta >= 0 ? "+" : ""}{monthDelta.toFixed(1)}% vs last month
            </p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-gray-500">Last Month</p>
          <p className="mt-1 text-2xl font-bold text-gray-700">₾{lastMonthTotal.toFixed(2)}</p>
        </div>
      </div>

      {/* Date filter */}
      <div className="flex gap-2">
        {([
          { value: "month", label: "This Month" },
          { value: "lastMonth", label: "Last Month" },
          { value: "all", label: "All Time" },
        ] as const).map((opt) => (
          <Link
            key={opt.value}
            href={`/admin/earnings?range=${opt.value}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              range === opt.value ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {/* Per-vendor table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">By Vendor</h2>
          <span className="text-xs text-gray-400">Total: ₾{filteredTotal.toFixed(2)}</span>
        </div>

        {vendorRows.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No earnings in this period.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vendor</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Sales</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Avg Rate</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Admin Took</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Vendor Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vendorRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{row.name}</td>
                  <td className="px-5 py-3 text-right text-sm">₾{row.sales.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right text-sm text-gray-500">{row.avgRate.toFixed(1)}%</td>
                  <td className="px-5 py-3 text-right text-sm font-semibold text-blue-600">₾{row.adminEarned.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right text-sm text-gray-700">₾{row.vendorEarned.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
