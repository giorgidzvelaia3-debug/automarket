"use client"

import { updateProductStatus } from "@/lib/actions/products"

type Status = "DRAFT" | "ACTIVE" | "INACTIVE"

export default function ProductStatusButton({
  id,
  status,
}: {
  id: string
  status: Status
}) {
  if (status === "ACTIVE") {
    const action = updateProductStatus.bind(null, id, "INACTIVE")
    return (
      <form action={action}>
        <button
          type="submit"
          className="text-xs text-amber-600 hover:text-amber-800 transition-colors"
        >
          Unpublish
        </button>
      </form>
    )
  }

  if (status === "INACTIVE" || status === "DRAFT") {
    const action = updateProductStatus.bind(null, id, "ACTIVE")
    return (
      <form action={action}>
        <button
          type="submit"
          className="text-xs text-green-600 hover:text-green-800 transition-colors"
        >
          Publish
        </button>
      </form>
    )
  }

  return null
}
