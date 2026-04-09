import { prisma } from "@/lib/prisma"
import VendorActions from "./VendorActions"
import { adminAssignVerified, adminRevokeVerified } from "@/lib/actions/badges"

const statusBadge: Record<string, string> = {
  PENDING:   "bg-amber-50 text-amber-700",
  APPROVED:  "bg-green-50 text-green-700",
  SUSPENDED: "bg-red-50 text-red-600",
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default async function VendorsPage() {
  const vendors = await prisma.vendor.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true } },
      badges: { select: { badge: true } },
    },
  })

  const counts = {
    total:    vendors.length,
    pending:  vendors.filter((v) => v.status === "PENDING").length,
    approved: vendors.filter((v) => v.status === "APPROVED").length,
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Vendors</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {counts.total} total · {counts.approved} approved ·{" "}
            {counts.pending > 0 ? (
              <span className="text-amber-600 font-medium">
                {counts.pending} pending
              </span>
            ) : (
              "0 pending"
            )}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {vendors.length === 0 ? (
          <p className="px-6 py-12 text-sm text-gray-400 text-center">
            No vendors yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Verified
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Badges
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Joined
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vendors.map((vendor) => {
                const isVerified = vendor.badges.some((b) => b.badge === "VERIFIED")
                return (
                  <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900">{vendor.name}</td>
                    <td className="px-6 py-3 text-gray-500">{vendor.user.email}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[vendor.status]}`}>
                        {vendor.status.charAt(0) + vendor.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <form
                        action={async () => {
                          "use server"
                          if (isVerified) await adminRevokeVerified(vendor.id)
                          else await adminAssignVerified(vendor.id)
                        }}
                      >
                        <button type="submit" className={`w-9 h-5 rounded-full transition-colors relative ${isVerified ? "bg-blue-600" : "bg-gray-300"}`}>
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isVerified ? "left-[18px]" : "left-0.5"}`} />
                        </button>
                      </form>
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-500">
                      {vendor.badges.length} badge{vendor.badges.length !== 1 ? "s" : ""}
                    </td>
                    <td className="px-6 py-3 text-gray-500">{formatDate(vendor.createdAt)}</td>
                    <td className="px-6 py-3">
                      <VendorActions id={vendor.id} status={vendor.status} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
