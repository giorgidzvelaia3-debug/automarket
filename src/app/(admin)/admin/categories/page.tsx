import Link from "next/link"
import { prisma } from "@/lib/prisma"
import DeleteCategoryButton from "./DeleteCategoryButton"

type CategoryRow = {
  id: string
  name: string
  nameEn: string
  slug: string
  parentId: string | null
  _count: { products: number; children: number }
  children: {
    id: string
    name: string
    nameEn: string
    slug: string
    _count: { products: number }
  }[]
}

function CategoryRow({ cat, isChild }: { cat: CategoryRow | CategoryRow["children"][number]; isChild?: boolean }) {
  const productCount = "_count" in cat ? cat._count.products : 0
  const childCount = "children" in cat ? (cat as CategoryRow)._count.children : 0
  const totalProducts = "children" in cat
    ? productCount + ((cat as CategoryRow).children?.reduce((s, c) => s + c._count.products, 0) ?? 0)
    : productCount

  return (
    <tr className={`hover:bg-gray-50 transition-colors ${isChild ? "bg-gray-50/50" : ""}`}>
      <td className={`px-6 py-3 font-medium ${isChild ? "pl-12 text-gray-700" : "text-gray-900"}`}>
        {isChild && <span className="text-gray-300 mr-1.5">└</span>}
        {cat.name}
      </td>
      <td className="px-6 py-3 text-gray-600">{cat.nameEn}</td>
      <td className="px-6 py-3">
        <code className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
          {cat.slug}
        </code>
      </td>
      <td className="px-6 py-3 text-right text-gray-600">
        {isChild ? (
          productCount
        ) : childCount > 0 ? (
          <span title={`${productCount} direct + ${totalProducts - productCount} in subcategories`}>
            {totalProducts} <span className="text-gray-400 text-xs">({productCount}+{totalProducts - productCount})</span>
          </span>
        ) : (
          productCount
        )}
      </td>
      <td className="px-6 py-3">
        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/admin/categories/${cat.id}/edit`}
            className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
          >
            Edit
          </Link>
          <DeleteCategoryButton
            id={cat.id}
            nameEn={cat.nameEn}
            childCount={"children" in cat ? (cat as CategoryRow)._count.children : 0}
            productCount={productCount}
          />
        </div>
      </td>
    </tr>
  )
}

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { nameEn: "asc" },
    include: {
      _count: { select: { products: true, children: true } },
      children: {
        orderBy: { nameEn: "asc" },
        include: { _count: { select: { products: true } } },
      },
    },
  }) as CategoryRow[]

  const totalCount = categories.reduce((s, c) => s + 1 + c.children.length, 0)

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Categories</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {categories.length} parent &middot; {totalCount - categories.length} subcategories
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
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Products
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.flatMap((cat) => [
                <CategoryRow key={cat.id} cat={cat} />,
                ...cat.children.map((child) => (
                  <CategoryRow key={child.id} cat={child} isChild />
                )),
              ])}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
