import { prisma } from "@/lib/prisma"
import {
  setGlobalCommission,
  setVendorCommission,
  setCategoryCommission,
  deleteCommissionOverride,
} from "@/lib/actions/commission"

export default async function AdminCommissionPage() {
  const [settings, vendors, categories] = await Promise.all([
    prisma.commissionSetting.findMany({ orderBy: { type: "asc" } }),
    prisma.vendor.findMany({ where: { status: "APPROVED" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.category.findMany({ orderBy: { nameEn: "asc" }, select: { id: true, nameEn: true } }),
  ])

  const globalSetting = settings.find((s) => s.type === "GLOBAL")
  const vendorOverrides = settings.filter((s) => s.type === "VENDOR")
  const categoryOverrides = settings.filter((s) => s.type === "CATEGORY")

  const vendorMap = new Map(vendors.map((v) => [v.id, v.name]))
  const categoryMap = new Map(categories.map((c) => [c.id, c.nameEn]))

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Commission Settings</h1>
        <p className="mt-0.5 text-sm text-gray-500">Configure platform commission rates</p>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
        <p className="text-sm text-blue-900 font-semibold mb-1">Commission Priority</p>
        <p className="text-xs text-blue-800">
          When calculating commission for an order item, the rate is determined in this order:
          <span className="font-semibold"> Product → Category → Vendor → Global</span>
        </p>
      </div>

      {/* Global commission */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Global Commission</h2>
        <p className="text-xs text-gray-500 mb-4">Applied to all vendors unless overridden</p>
        <form
          action={async (fd) => {
            "use server"
            const pct = parseFloat(fd.get("percentage") as string) || 0
            await setGlobalCommission(pct)
          }}
          className="flex items-center gap-3"
        >
          <input
            type="number"
            name="percentage"
            defaultValue={globalSetting ? Number(globalSetting.percentage) : 10}
            min="0"
            max="100"
            step="0.01"
            className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <span className="text-sm text-gray-500">%</span>
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
            Save
          </button>
          {globalSetting && (
            <span className="text-xs text-gray-400">Current: {Number(globalSetting.percentage)}%</span>
          )}
        </form>
      </div>

      {/* Vendor overrides */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Vendor Overrides</h2>

        <form
          action={async (fd) => {
            "use server"
            const vendorId = fd.get("vendorId") as string
            const pct = parseFloat(fd.get("percentage") as string) || 0
            if (vendorId) await setVendorCommission(vendorId, pct)
          }}
          className="flex items-center gap-2 mb-4"
        >
          <select name="vendorId" required className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">— Select vendor —</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
          <input type="number" name="percentage" placeholder="Rate %" min="0" max="100" step="0.01" required className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <button type="submit" className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
            Add
          </button>
        </form>

        {vendorOverrides.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No vendor overrides yet</p>
        ) : (
          <div className="space-y-2">
            {vendorOverrides.map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                <span className="text-sm font-medium text-gray-900">{vendorMap.get(s.referenceId ?? "") ?? "Unknown"}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-900">{Number(s.percentage)}%</span>
                  <form action={async () => { "use server"; await deleteCommissionOverride(s.id) }}>
                    <button type="submit" className="text-xs text-red-500 hover:underline">Remove</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category overrides */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Category Overrides</h2>

        <form
          action={async (fd) => {
            "use server"
            const categoryId = fd.get("categoryId") as string
            const pct = parseFloat(fd.get("percentage") as string) || 0
            if (categoryId) await setCategoryCommission(categoryId, pct)
          }}
          className="flex items-center gap-2 mb-4"
        >
          <select name="categoryId" required className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">— Select category —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.nameEn}</option>
            ))}
          </select>
          <input type="number" name="percentage" placeholder="Rate %" min="0" max="100" step="0.01" required className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <button type="submit" className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors">
            Add
          </button>
        </form>

        {categoryOverrides.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No category overrides yet</p>
        ) : (
          <div className="space-y-2">
            {categoryOverrides.map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                <span className="text-sm font-medium text-gray-900">{categoryMap.get(s.referenceId ?? "") ?? "Unknown"}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-900">{Number(s.percentage)}%</span>
                  <form action={async () => { "use server"; await deleteCommissionOverride(s.id) }}>
                    <button type="submit" className="text-xs text-red-500 hover:underline">Remove</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
