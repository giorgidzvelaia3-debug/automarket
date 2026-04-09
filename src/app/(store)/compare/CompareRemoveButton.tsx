"use client"

import { useRouter } from "next/navigation"
import { useCompare } from "@/lib/compareContext"

export default function CompareRemoveButton({
  productId,
  ids,
}: {
  productId: string
  ids: string[]
}) {
  const router = useRouter()
  const { removeFromCompare } = useCompare()

  function handleRemove() {
    removeFromCompare(productId)
    const remaining = ids.filter((id) => id !== productId)
    if (remaining.length === 0) {
      router.push("/vendors")
    } else {
      router.push(`/compare?ids=${remaining.join(",")}`)
    }
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
    >
      Remove
    </button>
  )
}
