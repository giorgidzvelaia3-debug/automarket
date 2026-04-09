import { prisma } from "@/lib/prisma"
import { toggleCoupon, deleteCoupon } from "@/lib/actions/coupons"
import CouponForm from "./CouponForm"

export default async function AdminCouponsPage() {
  const [coupons, vendors, categories, products] = await Promise.all([
    prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        vendor: { select: { name: true } },
        category: { select: { nameEn: true } },
        product: { select: { nameEn: true } },
        _count: { select: { uses: true } },
      },
    }),
    prisma.vendor.findMany({ where: { status: "APPROVED" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.category.findMany({ orderBy: { nameEn: "asc" }, select: { id: true, nameEn: true } }),
    prisma.product.findMany({ where: { status: "ACTIVE" }, orderBy: { nameEn: "asc" }, select: { id: true, nameEn: true }, take: 200 }),
  ])

  const totalActive = coupons.filter((c) => c.isActive).length
  const totalDiscount = await prisma.couponUse.aggregate({
    _sum: { discount: true },
  })
  const mostUsed = coupons.reduce((max, c) => (c._count.uses > (max?._count.uses ?? 0) ? c : max), coupons[0])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Coupons</h1>
          <p className="mt-0.5 text-sm text-gray-500">{coupons.length} total coupons</p>
        </div>
        <CouponForm vendors={vendors} categories={categories} products={products} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-gray-500">Active Coupons</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalActive}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-gray-500">Total Discount Given</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">₾{Number(totalDiscount._sum.discount ?? 0).toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-gray-500">Most Used</p>
          <p className="mt-1 text-lg font-bold text-gray-900 font-mono">{mostUsed?.code ?? "—"}</p>
          <p className="text-xs text-gray-400">{mostUsed?._count.uses ?? 0} uses</p>
        </div>
      </div>

      {coupons.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">No coupons yet.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Discount</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Scope</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Created By</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Uses</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Expires</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Active</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono font-bold text-gray-900">{c.code}</td>
                  <td className="px-5 py-3">
                    {c.type === "PERCENTAGE" ? `${Number(c.value)}%` : `₾${Number(c.value).toFixed(2)}`}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-600">
                    {c.scope}
                    {c.vendor && ` · ${c.vendor.name}`}
                    {c.category && ` · ${c.category.nameEn}`}
                    {c.product && ` · ${c.product.nameEn}`}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">{c.createdBy}</td>
                  <td className="px-5 py-3 text-center text-xs text-gray-500">
                    {c._count.uses}{c.maxUses != null && ` / ${c.maxUses}`}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {c.endDate ? c.endDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <form action={async () => { "use server"; await toggleCoupon(c.id) }}>
                      <button type="submit" className={`w-10 h-6 rounded-full transition-colors relative ${c.isActive ? "bg-green-500" : "bg-gray-300"}`}>
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${c.isActive ? "left-[18px]" : "left-0.5"}`} />
                      </button>
                    </form>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <form action={async () => { "use server"; await deleteCoupon(c.id) }}>
                      <button type="submit" className="text-xs text-red-500 hover:underline">Delete</button>
                    </form>
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
