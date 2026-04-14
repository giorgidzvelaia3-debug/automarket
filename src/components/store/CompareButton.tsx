"use client"

import { useCompare, type CompareProduct } from "@/lib/compareContext"

export default function CompareButton({
  product,
  iconOnly = false,
}: {
  product: CompareProduct
  iconOnly?: boolean
}) {
  const { addToCompare, removeFromCompare, isInCompare, isFull } = useCompare()
  const inCompare = isInCompare(product.id)

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (inCompare) {
      removeFromCompare(product.id)
    } else if (!isFull) {
      addToCompare(product)
    }
  }

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={!inCompare && isFull}
        className={`w-8 h-8 flex items-center justify-center rounded-lg backdrop-blur-sm border shadow-sm transition-all disabled:opacity-40 ${
          inCompare
            ? "bg-blue-50 text-blue-600 border-blue-200"
            : "bg-white/90 text-gray-400 border-gray-200/60 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200"
        }`}
        title={isFull && !inCompare ? "Max 3 products" : inCompare ? "Remove from compare" : "Compare"}
        aria-label="Compare"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!inCompare && isFull}
      className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-colors ${
        inCompare
          ? "bg-blue-600 text-white hover:bg-blue-700"
          : isFull
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white/90 text-gray-600 border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
      } backdrop-blur-sm shadow-sm`}
      title={isFull && !inCompare ? "Max 3 products to compare" : undefined}
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
      {inCompare ? "Added" : "Compare"}
    </button>
  )
}
