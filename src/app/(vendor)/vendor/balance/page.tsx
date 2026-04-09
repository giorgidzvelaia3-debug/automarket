import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getVendorBalance } from "@/lib/actions/withdrawal"
import WithdrawalForm from "./WithdrawalForm"

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-blue-50 text-blue-700 border-blue-200",
  PAID: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-600 border-red-200",
}

export default async function VendorBalancePage() {
  const session = await auth()
  const vendor = await prisma.vendor.findUnique({
    where: { userId: session!.user.id },
    select: { id: true, status: true },
  })
  if (!vendor) redirect("/vendor/register")
  if (vendor.status !== "APPROVED") redirect("/vendor/dashboard")

  const [balance, withdrawals] = await Promise.all([
    getVendorBalance(vendor.id),
    prisma.vendorWithdrawal.findMany({
      where: { vendorId: vendor.id },
      orderBy: { requestedAt: "desc" },
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Balance</h1>
          <p className="mt-0.5 text-sm text-gray-500">Manage your earnings and withdrawals</p>
        </div>
        <WithdrawalForm availableBalance={balance.availableBalance} />
      </div>

      {/* Balance overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 px-5 py-5">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Available Balance</p>
          <p className="mt-2 text-3xl font-bold text-green-700">₾{balance.availableBalance.toFixed(2)}</p>
          <p className="mt-1 text-xs text-green-600">Ready to withdraw</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pending Balance</p>
          <p className="mt-2 text-2xl font-bold text-gray-700">₾{balance.pendingBalance.toFixed(2)}</p>
          <p className="mt-1 text-xs text-gray-400">From open orders</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Earned</p>
          <p className="mt-2 text-2xl font-bold text-blue-600">₾{balance.totalEarned.toFixed(2)}</p>
          <p className="mt-1 text-xs text-gray-400">All time</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Withdrawn</p>
          <p className="mt-2 text-2xl font-bold text-purple-600">₾{balance.totalWithdrawn.toFixed(2)}</p>
          <p className="mt-1 text-xs text-gray-400">All time</p>
        </div>
      </div>

      {/* Withdrawal history */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Withdrawal History</h2>
        </div>

        {withdrawals.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No withdrawals yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Method</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Admin Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {withdrawals.map((w) => (
                <tr key={w.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {w.requestedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">₾{Number(w.amount).toFixed(2)}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{w.method.replace("_", " ")}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusStyles[w.status]}`}>
                      {w.status.charAt(0) + w.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">{w.adminNote ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
