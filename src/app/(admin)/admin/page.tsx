import { prisma } from "@/lib/prisma"

export default async function AdminDashboardPage() {
  const [vendorCount, productCount, pendingCount, recentVendors] =
    await Promise.all([
      prisma.vendor.count(),
      prisma.product.count(),
      prisma.vendor.count({ where: { status: "PENDING" } }),
      prisma.vendor.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { email: true } },
        },
      }),
    ])

  const stats = [
    { label: "Total Vendors", value: vendorCount },
    { label: "Total Products", value: productCount },
    { label: "Pending Approvals", value: pendingCount, highlight: pendingCount > 0 },
  ]

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Overview of your marketplace
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, highlight }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-gray-200 px-6 py-5"
          >
            <p className="text-sm text-gray-500">{label}</p>
            <p
              className={`mt-1 text-3xl font-bold ${
                highlight ? "text-amber-500" : "text-gray-900"
              }`}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent vendors */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">
            Recent Vendors
          </h2>
        </div>

        {recentVendors.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400 text-center">
            No vendors yet.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recentVendors.map((vendor) => (
              <li
                key={vendor.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {vendor.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {vendor.user.email}
                  </p>
                </div>
                <span
                  className={`shrink-0 ml-4 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    vendor.status === "APPROVED"
                      ? "bg-green-50 text-green-700"
                      : vendor.status === "PENDING"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-700"
                  }`}
                >
                  {vendor.status.charAt(0) + vendor.status.slice(1).toLowerCase()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
