"use client"

import { useRouter } from "next/navigation"
import { useCallback } from "react"

type Category = { id: string; slug: string; nameEn: string; name: string }

type Params = {
  q?: string
  minPrice?: string
  maxPrice?: string
  rating?: string
  inStock?: string
  sort?: string
  category?: string
}

export default function SearchFilters({
  categories,
  currentParams,
}: {
  categories: Category[]
  currentParams: Params
}) {
  const router = useRouter()

  const buildUrl = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const merged = { ...currentParams, ...overrides }
      const sp = new URLSearchParams()
      for (const [k, v] of Object.entries(merged)) {
        if (v !== undefined && v !== "" && v !== "false") sp.set(k, v)
      }
      return `/search?${sp.toString()}`
    },
    [currentParams]
  )

  function update(overrides: Record<string, string | undefined>) {
    router.push(buildUrl(overrides))
  }

  const sort = currentParams.sort ?? "newest"
  const inStock = currentParams.inStock === "true"
  const rating = currentParams.rating ?? ""
  const category = currentParams.category ?? ""

  const hasFilters =
    currentParams.minPrice ||
    currentParams.maxPrice ||
    currentParams.rating ||
    currentParams.inStock === "true" ||
    currentParams.category ||
    (currentParams.sort && currentParams.sort !== "newest")

  return (
    <div className="space-y-6">
      {/* Sort */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Sort by
        </label>
        <select
          value={sort}
          onChange={(e) => update({ sort: e.target.value === "newest" ? undefined : e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Category
        </label>
        <select
          value={category}
          onChange={(e) => update({ category: e.target.value || undefined })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.nameEn}
            </option>
          ))}
        </select>
      </div>

      {/* Price range */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Price Range (₾)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            step="0.01"
            placeholder="Min"
            defaultValue={currentParams.minPrice ?? ""}
            onBlur={(e) => update({ minPrice: e.target.value || undefined })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                update({ minPrice: (e.target as HTMLInputElement).value || undefined })
              }
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-gray-400 text-xs">–</span>
          <input
            type="number"
            min={0}
            step="0.01"
            placeholder="Max"
            defaultValue={currentParams.maxPrice ?? ""}
            onBlur={(e) => update({ maxPrice: e.target.value || undefined })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                update({ maxPrice: (e.target as HTMLInputElement).value || undefined })
              }
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Minimum Rating
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => update({ rating: rating === String(star) ? undefined : String(star) })}
              className={`w-9 h-9 rounded-lg border text-sm font-medium transition-colors ${
                rating && parseInt(rating) === star
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {star}★
            </button>
          ))}
        </div>
      </div>

      {/* In Stock */}
      <div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => update({ inStock: e.target.checked ? "true" : undefined })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
          />
          <span className="text-sm text-gray-700">In stock only</span>
        </label>
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <button
          type="button"
          onClick={() =>
            router.push(
              currentParams.q ? `/search?q=${encodeURIComponent(currentParams.q)}` : "/search"
            )
          }
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}
