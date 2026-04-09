import Link from "next/link"
import { prisma } from "@/lib/prisma"
import AdminReturnActions from "./AdminReturnActions"
import VendorFilter from "./VendorFilter"

const ALL_STATUSES = ["PENDING", "APPROVED", "REJECTED", "COMPLETED"] as const

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-blue-50 text-blue-700 border-blue-200",
  REJECTED: "bg-red-50 text-red-600 border-red-200",
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
}

const reasonLabels: Record<string, string> = {
  DEFECTIVE: "Defective",
  WRONG_ITEM: "Wrong item",
  NOT_AS_DESCRIBED: "Not as described",
  CHANGED_MIND: "Changed mind",
  OTHER: "Other",
}

export default async function AdminReturnsPage(props: {
  searchParams: Promise<{ status?: string; vendorId?: string }>
}) {
  const { status: filterStatus, vendorId: filterVendor } = await props.searchParams

  const [returns, allReturns, vendors, deliveredOrders] = await Promise.all([
    prisma.returnRequest.findMany({
      where: {
        ...(filterStatus && (ALL_STATUSES as readonly string[]).includes(filterStatus) ? { status: filterStatus as never } : {}),
        ...(filterVendor ? { vendorId: filterVendor } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        buyer: { select: { name: true, email: true } },
        vendor: { select: { id: true, name: true } },
        items: {
          include: {
            orderItem: {
              select: { quantity: true, product: { select: { name: true, nameEn: true } } },
            },
          },
        },
      },
    }),
    prisma.returnRequest.findMany({
      select: { status: true, vendorId: true },
    }),
    prisma.vendor.findMany({ where: { status: "APPROVED" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.order.groupBy({
      by: ["id"],
      where: { status: "DELIVERED" },
      _count: true,
    }),
  ])

  const counts = {
    total: allReturns.length,
    pending: allReturns.filter((r) => r.status === "PENDING").length,
    approved: allReturns.filter((r) => r.status === "APPROVED").length,
    rejected: allReturns.filter((r) => r.status === "REJECTED").length,
    completed: allReturns.filter((r) => r.status === "COMPLETED").length,
  }

  // Return rate per vendor
  const totalDeliveredOrders = deliveredOrders.length
  const returnsByVendor = new Map<string, number>()
  for (const r of allReturns) {
    returnsByVendor.set(r.vendorId, (returnsByVendor.get(r.vendorId) ?? 0) + 1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Returns</h1>
        <p className="mt-0.5 text-sm text-gray-500">{counts.total} total return requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-4">
          <p className="text-xs text-gray-500">Total</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{counts.total}</p>
          {totalDeliveredOrders > 0 && (
            <p className="text-[10px] text-gray-400">{((counts.total / totalDeliveredOrders) * 100).toFixed(1)}% rate</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-4">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{counts.pending}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-4">
          <p className="text-xs text-gray-500">Approved</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{counts.approved}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-4">
          <p className="text-xs text-gray-500">Rejected</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{counts.rejected}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-4">
          <p className="text-xs text-gray-500">Completed</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{counts.completed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <Link href="/admin/returns" className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!filterStatus ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>All</Link>
        {ALL_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/returns?status=${s}${filterVendor ? `&vendorId=${filterVendor}` : ""}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </Link>
        ))}
        <span className="ml-2 text-xs text-gray-400">·</span>
        <VendorFilter
          vendors={vendors.map((v) => ({ id: v.id, name: v.name, count: returnsByVendor.get(v.id) ?? 0 }))}
          current={filterVendor}
        />
      </div>

      {returns.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">No return requests.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Return</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Buyer</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vendor</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reason</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {returns.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50 align-top">
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">#{req.id.slice(-8).toUpperCase()}</td>
                  <td className="px-5 py-3 text-xs text-gray-700">{req.buyer?.name ?? req.buyer?.email}</td>
                  <td className="px-5 py-3 text-xs text-gray-700">{req.vendor.name}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      req.type === "RETURN" ? "bg-green-50 text-green-700 border border-green-200" : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}>
                      {req.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-600">{reasonLabels[req.reason]}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusStyles[req.status]}`}>
                      {req.status.charAt(0) + req.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {req.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <AdminReturnActions returnId={req.id} status={req.status} />
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
