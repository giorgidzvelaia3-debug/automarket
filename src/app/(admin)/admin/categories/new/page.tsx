import Link from "next/link"
import { prisma } from "@/lib/prisma"
import CategoryForm from "./CategoryForm"

export default async function NewCategoryPage(props: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await props.searchParams

  const parentCategories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { nameEn: "asc" },
    select: { id: true, nameEn: true },
  })

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link
          href="/admin/categories"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Categories
        </Link>
        <h1 className="mt-2 text-xl font-bold text-gray-900">New Category</h1>
      </div>

      <CategoryForm parentCategories={parentCategories} error={error} />
    </div>
  )
}
