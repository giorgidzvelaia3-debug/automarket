import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { adminProcessWithdrawal } from "@/lib/actions/withdrawal"

const ALL_STATUSES = ["PENDING", "APPROVED", "PAID", "REJECTED"] as const

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-blue-50 text-blue-700 border-blue-200",
  PAID: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-600 border-red-200",
}

export default async function AdminWithdrawalsPage(props: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: filterStatus } = await props.searchParams

  const [withdrawals, allWithdrawals] = await Promise.all([
    prisma.vendorWithdrawal.findMany({
      where: filterStatus && (ALL_STATUSES as readonly string[]).includes(filterStatus) ? { status: filterStatus as never } : {},
      orderBy: { requestedAt: "desc" },
      include: { vendor: { select: { name: true } } },
    }),
    prisma.vendorWithdrawal.findMany({
      select: { amount: true, status: true, processedAt: true },
    }),
  ])

  const totalPending = allWithdrawals
    .filter((w) => w.status === "PENDING")
    .reduce((sum, w) => sum + Number(w.amount), 0)
  const pendingCount = allWithdrawals.filter((w) => w.status === "PENDING").length

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const totalPaidThisMonth = allWithdrawals
    .filter((w) => w.status === "PAID" && w.processedAt && w.processedAt >= startOfMonth)
    .reduce((sum, w) => sum + Number(w.amount), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Withdrawals</h1>
        <p className="mt-0.5 text-sm text-gray-500">Manage vendor withdrawal requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-gray-500">Pending Amount</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">₾{totalPending.toFixed(2)}</p>
          <p className="text-xs text-gray-400">{pendingCount} request{pendingCount !== 1 ? "s" : ""}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-gray-500">Paid This Month</p>
          <p className="mt-1 text-2xl font-bold text-green-600">₾{totalPaidThisMonth.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-gray-500">Total Requests</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{allWithdrawals.length}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Link href="/admin/withdrawals" className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!filterStatus ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>All</Link>
        {ALL_STATUSES.map((s) => (
          <Link key={s} href={`/admin/withdrawals?status=${s}`} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>

      {withdrawals.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">No withdrawals found.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vendor</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Method</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Requested</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {withdrawals.map((w) => (
                <tr key={w.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{w.vendor.name}</td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">₾{Number(w.amount).toFixed(2)}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{w.method.replace("_", " ")}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {w.requestedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusStyles[w.status]}`}>
                      {w.status.charAt(0) + w.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {w.status === "PENDING" && (
                      <div className="flex items-center gap-2 justify-end">
                        <form action={async () => { "use server"; await adminProcessWithdrawal(w.id, "approve") }}>
                          <button type="submit" className="text-xs font-semibold text-green-600 hover:underline">Approve</button>
                        </form>
                        <form action={async () => { "use server"; await adminProcessWithdrawal(w.id, "reject") }}>
                          <button type="submit" className="text-xs font-semibold text-red-500 hover:underline">Reject</button>
                        </form>
                      </div>
                    )}
                    {w.status === "APPROVED" && (
                      <form action={async () => { "use server"; await adminProcessWithdrawal(w.id, "paid") }}>
                        <button type="submit" className="text-xs font-semibold text-blue-600 hover:underline">Mark as Paid</button>
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
