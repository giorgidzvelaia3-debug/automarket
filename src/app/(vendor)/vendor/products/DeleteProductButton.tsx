"use client"

import { deleteProduct } from "@/lib/actions/products"

export default function DeleteProductButton({ id }: { id: string }) {
  const deleteWithId = deleteProduct.bind(null, id)

  return (
    <form action={deleteWithId}>
      <button
        type="submit"
        className="text-xs text-red-500 hover:text-red-700 transition-colors"
        onClick={(e) => {
          if (!confirm("Delete this product? This cannot be undone.")) {
            e.preventDefault()
          }
        }}
      >
        Delete
      </button>
    </form>
  )
}
