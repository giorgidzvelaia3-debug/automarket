"use client"

import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"

type Category = { slug: string; nameEn: string; count: number }
type Vendor = { slug: string; name: string; count: number }

type Params = {
  category?: string
  vendor?: string
  minPrice?: string
  maxPrice?: string
  rating?: string
  inStock?: string
  sort?: string
  page?: string
  view?: string
}

export default function ShopFilters({
  categories,
  vendors,
  currentParams,
  mobile = false,
}: {
  categories: Category[]
  vendors: Vendor[]
  currentParams: Params
  mobile?: boolean
}) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const selectedCats = (currentParams.category ?? "").split(",").filter(Boolean)
  const selectedVendors = (currentParams.vendor ?? "").split(",").filter(Boolean)
  const rating = currentParams.rating ?? ""
  const inStock = currentParams.inStock === "true"

  const buildUrl = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const merged = { ...currentParams, ...overrides, page: undefined }
      const sp = new URLSearchParams()
      for (const [k, v] of Object.entries(merged)) {
        if (v !== undefined && v !== "" && v !== "false") sp.set(k, v)
      }
      return `/shop?${sp.toString()}`
    },
    [currentParams]
  )

  function update(overrides: Record<string, string | undefined>) {
    router.push(buildUrl(overrides))
  }

  function toggleCategory(slug: string) {
    const next = selectedCats.includes(slug)
      ? selectedCats.filter((s) => s !== slug)
      : [...selectedCats, slug]
    update({ category: next.length > 0 ? next.join(",") : undefined })
  }

  function toggleVendor(slug: string) {
    const next = selectedVendors.includes(slug)
      ? selectedVendors.filter((s) => s !== slug)
      : [...selectedVendors, slug]
    update({ vendor: next.length > 0 ? next.join(",") : undefined })
  }

  const filterContent = (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Categories</h3>
        <div className="space-y-1.5 max-h-52 overflow-y-auto">
          {categories.map((cat) => (
            <label key={cat.slug} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedCats.includes(cat.slug)}
                onChange={() => toggleCategory(cat.slug)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1">{cat.nameEn}</span>
              <span className="text-xs text-gray-400">{cat.count}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Price (₾)</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            step="1"
            placeholder="Min"
            defaultValue={currentParams.minPrice ?? ""}
            onBlur={(e) => update({ minPrice: e.target.value || undefined })}
            onKeyDown={(e) => e.key === "Enter" && update({ minPrice: (e.target as HTMLInputElement).value || undefined })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base sm:text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-gray-400 text-xs shrink-0">—</span>
          <input
            type="number"
            min={0}
            step="1"
            placeholder="Max"
            defaultValue={currentParams.maxPrice ?? ""}
            onBlur={(e) => update({ maxPrice: e.target.value || undefined })}
            onKeyDown={(e) => e.key === "Enter" && update({ maxPrice: (e.target as HTMLInputElement).value || undefined })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base sm:text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Min Rating</h3>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => update({ rating: rating === String(star) ? undefined : String(star) })}
              className={`w-9 h-9 rounded-lg border text-sm font-medium transition-colors ${
                parseInt(rating) === star
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

      {/* Vendors */}
      {vendors.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Vendors</h3>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {vendors.map((v) => (
              <label key={v.slug} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedVendors.includes(v.slug)}
                  onChange={() => toggleVendor(v.slug)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1 truncate">{v.name}</span>
                <span className="text-xs text-gray-400">{v.count}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  if (mobile) {
    return (
      <div className="lg:hidden mb-4">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors w-full justify-center"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          Filters
          <svg className={`w-3.5 h-3.5 transition-transform ${mobileOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>
        {mobileOpen && (
          <div className="mt-3 bg-white border border-gray-200 rounded-xl p-4">
            {filterContent}
          </div>
        )}
      </div>
    )
  }

  return (
    <aside className="hidden lg:block w-60 shrink-0">
      <div className="sticky top-24 bg-white border border-gray-200 rounded-xl p-5">
        {filterContent}
      </div>
    </aside>
  )
}
