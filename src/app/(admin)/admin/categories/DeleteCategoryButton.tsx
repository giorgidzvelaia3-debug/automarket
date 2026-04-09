"use client"

import { deleteCategory } from "@/lib/actions/categories"

export default function DeleteCategoryButton({
  id,
  nameEn,
}: {
  id: string
  nameEn: string
}) {
  const deleteWithId = deleteCategory.bind(null, id)

  return (
    <form action={deleteWithId}>
      <button
        type="submit"
        className="text-xs text-red-500 hover:text-red-700 transition-colors"
        onClick={(e) => {
          if (!confirm(`Delete "${nameEn}"? This cannot be undone.`)) {
            e.preventDefault()
          }
        }}
      >
        Delete
      </button>
    </form>
  )
}
