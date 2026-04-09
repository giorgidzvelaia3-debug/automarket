import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { adminRejectFlashSale, adminToggleFeatured } from "@/lib/actions/flashSales"

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700 border-green-200",
  ENDED: "bg-gray-50 text-gray-600 border-gray-200",
  REJECTED: "bg-red-50 text-red-600 border-red-200",
}

const ALL_STATUSES = ["ACTIVE", "ENDED", "REJECTED"] as const

export default async function AdminFlashSalesPage(props: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: filterStatus } = await props.searchParams

  const sales = await prisma.flashSale.findMany({
    where: filterStatus && ALL_STATUSES.includes(filterStatus as never) ? { status: filterStatus as never } : {},
    orderBy: { createdAt: "desc" },
    include: {
      vendor: { select: { name: true } },
      _count: { select: { items: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Flash Sales</h1>
        <p className="mt-0.5 text-sm text-gray-500">{sales.length} sales</p>
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        <Link href="/admin/flash-sales" className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!filterStatus ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>All</Link>
        {ALL_STATUSES.map((s) => (
          <Link key={s} href={`/admin/flash-sales?status=${s}`} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>

      {sales.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">No flash sales found.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vendor</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Period</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Items</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Featured</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{sale.vendor.name}</td>
                  <td className="px-5 py-3">
                    <p className="text-sm text-gray-900">{sale.titleEn}</p>
                    <p className="text-xs text-gray-400">{sale.title}</p>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {sale.startTime.toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    {" → "}
                    {sale.endTime.toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-5 py-3 text-center">{sale._count.items}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusStyles[sale.status]}`}>
                      {sale.status.charAt(0) + sale.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <form action={async () => { "use server"; await adminToggleFeatured(sale.id) }}>
                      <button type="submit" className={`w-10 h-6 rounded-full transition-colors relative ${sale.featured ? "bg-blue-600" : "bg-gray-300"}`}>
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${sale.featured ? "left-[18px]" : "left-0.5"}`} />
                      </button>
                    </form>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {sale.status === "ACTIVE" && (
                      <form action={async () => { "use server"; await adminRejectFlashSale(sale.id) }}>
                        <button type="submit" className="text-xs text-red-500 hover:underline">Reject</button>
                      </form>
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
