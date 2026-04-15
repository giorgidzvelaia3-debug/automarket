import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import EditCategoryForm from "./EditCategoryForm"

export default async function EditCategoryPage(props: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const [{ id }, { error }] = await Promise.all([props.params, props.searchParams])

  const category = await prisma.category.findUnique({
    where: { id },
    select: { id: true, name: true, nameEn: true, slug: true, parentId: true },
  })

  if (!category) notFound()

  // Get children IDs to prevent circular reference in parent selector
  const childIds = (
    await prisma.category.findMany({
      where: { parentId: id },
      select: { id: true },
    })
  ).map((c) => c.id)

  const excludeIds = [id, ...childIds]

  const parentCategories = await prisma.category.findMany({
    where: { parentId: null, id: { notIn: excludeIds } },
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
        <h1 className="mt-2 text-xl font-bold text-gray-900">Edit Category</h1>
      </div>

      <EditCategoryForm
        category={category}
        parentCategories={parentCategories}
        error={error}
      />
    </div>
  )
}
