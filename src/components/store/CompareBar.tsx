"use client"

import Link from "next/link"
import { useCompare } from "@/lib/compareContext"
import { optimizeImageUrl } from "@/lib/imageUtils"

export default function CompareBar() {
  const { items, removeFromCompare, clearCompare } = useCompare()

  if (items.length === 0) return null

  const compareUrl = `/compare?ids=${items.map((p) => p.id).join(",")}`

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-4">
          {/* Product thumbnails */}
          <div className="flex items-center gap-3 flex-1 min-w-0 overflow-x-auto">
            {items.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-2 bg-gray-50 rounded-lg border border-gray-200 pl-1 pr-2 py-1 shrink-0"
              >
                <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={optimizeImageUrl(product.image, 64)}
                      alt={product.nameEn}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-300 text-sm">□</span>
                  )}
                </div>
                <span className="text-xs text-gray-700 truncate max-w-[100px]">
                  {product.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFromCompare(product.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                  aria-label="Remove"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {items.length < 3 && (
              <span className="text-xs text-gray-400 shrink-0">
                Add {3 - items.length} more to compare
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={clearCompare}
              className="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
            <Link
              href={compareUrl}
              className={`rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors ${
                items.length >= 2
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-300 pointer-events-none"
              }`}
            >
              Compare ({items.length})
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
