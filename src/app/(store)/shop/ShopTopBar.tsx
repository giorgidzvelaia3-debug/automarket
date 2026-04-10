"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

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
  perPage?: string
}

type ActiveFilter = { label: string; key: string; value?: string }

export default function ShopTopBar({
  totalCount,
  currentParams,
  categoryNames,
  vendorNames,
  perPage,
}: {
  totalCount: number
  currentParams: Params
  categoryNames: Record<string, string>
  vendorNames: Record<string, string>
  perPage: number
}) {
  const router = useRouter()
  const sort = currentParams.sort ?? "newest"
  const view = currentParams.view ?? "grid"

  function buildUrl(overrides: Record<string, string | undefined>) {
    const merged = { ...currentParams, ...overrides }
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined && v !== "" && v !== "false") sp.set(k, v)
    }
    return `/shop?${sp.toString()}`
  }

  function removeFilter(key: string, value?: string) {
    if (key === "category" && value) {
      const cats = (currentParams.category ?? "").split(",").filter((s) => s !== value)
      router.push(buildUrl({ category: cats.length > 0 ? cats.join(",") : undefined, page: undefined }))
    } else if (key === "vendor" && value) {
      const vs = (currentParams.vendor ?? "").split(",").filter((s) => s !== value)
      router.push(buildUrl({ vendor: vs.length > 0 ? vs.join(",") : undefined, page: undefined }))
    } else {
      router.push(buildUrl({ [key]: undefined, page: undefined }))
    }
  }

  // Build active filter pills
  const pills: ActiveFilter[] = []
  if (currentParams.category) {
    for (const slug of currentParams.category.split(",")) {
      pills.push({ label: categoryNames[slug] ?? slug, key: "category", value: slug })
    }
  }
  if (currentParams.vendor) {
    for (const slug of currentParams.vendor.split(",")) {
      pills.push({ label: vendorNames[slug] ?? slug, key: "vendor", value: slug })
    }
  }
  if (currentParams.minPrice) pills.push({ label: `Min ₾${currentParams.minPrice}`, key: "minPrice" })
  if (currentParams.maxPrice) pills.push({ label: `Max ₾${currentParams.maxPrice}`, key: "maxPrice" })
  if (currentParams.rating) pills.push({ label: `${currentParams.rating}★+`, key: "rating" })
  if (currentParams.inStock === "true") pills.push({ label: "In stock", key: "inStock" })

  const sortOptions = [
    { value: "newest", label: "Newest" },
    { value: "price_asc", label: "Price ↑" },
    { value: "price_desc", label: "Price ↓" },
    { value: "rating", label: "Top Rated" },
    { value: "popular", label: "Popular" },
  ]

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        {/* Count */}
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{totalCount}</span> product{totalCount !== 1 ? "s" : ""} found
        </p>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Per page */}
          <select
            value={perPage}
            onChange={(e) => router.push(buildUrl({ perPage: e.target.value === "12" ? undefined : e.target.value, page: undefined }))}
            className="w-auto rounded-lg border border-gray-300 px-2 sm:px-3 py-2.5 sm:py-1.5 text-base sm:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] sm:min-h-0"
          >
            {[12, 24, 48, 96].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => router.push(buildUrl({ sort: e.target.value === "newest" ? undefined : e.target.value, page: undefined }))}
            className="w-full sm:w-auto rounded-lg border border-gray-300 px-3 py-2.5 sm:py-1.5 text-base sm:text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px] sm:min-h-0"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* View toggle */}
          <div className="hidden sm:flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => router.push(buildUrl({ view: undefined }))}
              className={`p-1.5 transition-colors ${view === "grid" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
              aria-label="Grid view"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => router.push(buildUrl({ view: "list" }))}
              className={`p-1.5 transition-colors ${view === "list" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
              aria-label="List view"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Active filter pills */}
      {pills.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {pills.map((pill, i) => (
            <button
              key={`${pill.key}-${pill.value ?? i}`}
              type="button"
              onClick={() => removeFilter(pill.key, pill.value)}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
            >
              {pill.label}
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ))}
          <Link
            href="/shop"
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors ml-1"
          >
            Clear all
          </Link>
        </div>
      )}
    </div>
  )
}
