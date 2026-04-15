"use client"

import { deleteCategory } from "@/lib/actions/categories"

export default function DeleteCategoryButton({
  id,
  nameEn,
  childCount,
  productCount,
}: {
  id: string
  nameEn: string
  childCount: number
  productCount: number
}) {
  const deleteWithId = deleteCategory.bind(null, id)

  let message = `Delete "${nameEn}"?`
  if (childCount > 0 && productCount > 0) {
    message += `\n\nThis category has ${childCount} subcategories and ${productCount} products. Subcategories will be promoted and products reassigned.`
  } else if (childCount > 0) {
    message += `\n\nThis category has ${childCount} subcategories that will be promoted to top-level.`
  } else if (productCount > 0) {
    message += `\n\nThis category has ${productCount} products that will be reassigned to the parent category.`
  }

  return (
    <form action={deleteWithId}>
      <button
        type="submit"
        className="text-xs text-red-500 hover:text-red-700 transition-colors"
        onClick={(e) => {
          if (!confirm(message)) {
            e.preventDefault()
          }
        }}
      >
        Delete
      </button>
    </form>
  )
}
