import Link from "next/link"
import { prisma } from "@/lib/prisma"
import DeleteCategoryButton from "./DeleteCategoryButton"

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      parent: { select: { nameEn: true } },
      _count: { select: { products: true } },
    },
  })

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Categories</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {categories.length} {categories.length === 1 ? "category" : "categories"}
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          <span aria-hidden>+</span>
          Add Category
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {categories.length === 0 ? (
          <p className="px-6 py-12 text-sm text-gray-400 text-center">
            No categories yet.{" "}
            <Link href="/admin/categories/new" className="text-blue-600 hover:underline">
              Add one.
            </Link>
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Name (KA)
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Name (EN)
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Parent
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Products
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {cat.name}
                    </td>
                    <td className="px-6 py-3 text-gray-600">{cat.nameEn}</td>
                    <td className="px-6 py-3">
                      <code className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        {cat.slug}
                      </code>
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {cat.parent?.nameEn ?? (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right text-gray-600">
                      {cat._count.products}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <DeleteCategoryButton id={cat.id} nameEn={cat.nameEn} />
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
