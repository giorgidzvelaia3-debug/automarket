import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { setAggregatedStatus, mergeCanonicals } from "@/lib/actions/aggregator"

export default async function AggregatedProductsPage() {
  const products = await prisma.aggregatedProduct.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { offers: true } },
      offers: { where: { active: true }, orderBy: { price: "asc" }, select: { price: true } },
      category: { select: { nameEn: true } },
    },
  })

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Aggregated Products</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {products.length} canonical product{products.length === 1 ? "" : "s"}. Each groups one or
          more source offers.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <th className="px-6 py-3">Product</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Match key</th>
              <th className="px-6 py-3 text-right">Offers</th>
              <th className="px-6 py-3 text-right">From</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3">
                  <Link
                    href={`/products/${p.slug}`}
                    className="font-medium text-gray-900 hover:text-blue-600"
                  >
                    {p.name}
                  </Link>
                </td>
                <td className="px-6 py-3 text-gray-600">{p.category.nameEn}</td>
                <td className="px-6 py-3">
                  <code className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                    {p.matchKey ?? "—"}
                  </code>
                </td>
                <td className="px-6 py-3 text-right text-gray-600">{p._count.offers}</td>
                <td className="px-6 py-3 text-right text-gray-700">
                  {p.offers[0] ? `${p.offers[0].price.toString()} ₾` : "—"}
                </td>
                <td className="px-6 py-3">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      p.status === "ACTIVE"
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  <form action={setAggregatedStatus}>
                    <input type="hidden" name="id" value={p.id} />
                    <input
                      type="hidden"
                      name="status"
                      value={p.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"}
                    />
                    <button
                      type="submit"
                      className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
                    >
                      {p.status === "ACTIVE" ? "Unpublish" : "Publish"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                  No aggregated products yet. Run a source sync.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Manual merge of two canonicals */}
      {products.length >= 2 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Merge two canonicals</h2>
          <p className="text-xs text-gray-500 mb-3">
            Move all offers from the source product into the target, then delete the source. Use when
            the same product was created twice.
          </p>
          <form action={mergeCanonicals} className="flex flex-wrap items-end gap-3">
            <label className="text-xs text-gray-600">
              Source (will be deleted)
              <select
                name="sourceCanonicalId"
                required
                className="mt-1 block rounded-lg border border-gray-200 px-2 py-1.5 text-sm max-w-xs"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-gray-600">
              Target (kept)
              <select
                name="targetCanonicalId"
                required
                className="mt-1 block rounded-lg border border-gray-200 px-2 py-1.5 text-sm max-w-xs"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Merge
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
