"use client"

import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { useLocale } from "next-intl"
import { localized } from "@/lib/localeName"

type Category = { slug: string; nameEn: string; name: string; count: number }
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
  perPage?: string
}

/* ─── Collapsible Section ─── */
function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-100 last:border-b-0 pb-5 last:pb-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full py-1 group"
      >
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide group-hover:text-gray-700 transition-colors">
          {title}
        </h3>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          open ? "mt-3 max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {children}
      </div>
    </div>
  )
}


/* ─── Star Rating Button ─── */
function StarRatingButton({
  stars,
  selected,
  onClick,
}: {
  stars: number
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-sm transition-all ${
        selected
          ? "bg-blue-50 border-blue-300 text-blue-700"
          : "border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300"
      }`}
    >
      <span className="flex">
        {Array.from({ length: 5 }, (_, i) => (
          <svg
            key={i}
            className={`w-3.5 h-3.5 ${i < stars ? "text-amber-400" : "text-gray-200"}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </span>
      <span className="text-[11px] text-gray-400">&amp; up</span>
    </button>
  )
}

/* ─── Main Component ─── */
export default function ShopFilters({
  categories,
  vendors,
  currentParams,
  mobile = false,
  priceRange,
}: {
  categories: Category[]
  vendors: Vendor[]
  currentParams: Params
  mobile?: boolean
  priceRange?: { min: number; max: number }
}) {
  const locale = useLocale()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [vendorSearch, setVendorSearch] = useState("")
  const [showAllCats, setShowAllCats] = useState(false)

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

  const activeFilterCount = selectedCats.length + selectedVendors.length
    + (currentParams.minPrice ? 1 : 0) + (currentParams.maxPrice ? 1 : 0)
    + (rating ? 1 : 0) + (inStock ? 1 : 0)

  const visibleCats = showAllCats ? categories : categories.slice(0, 6)
  const filteredVendors = vendorSearch
    ? vendors.filter((v) => v.name.toLowerCase().includes(vendorSearch.toLowerCase()))
    : vendors

  const filterContent = (
    <div className="space-y-5">
      {/* Categories */}
      <FilterSection title="Categories">
        <div className="space-y-1">
          {visibleCats.map((cat) => {
            const checked = selectedCats.includes(cat.slug)
            return (
              <label
                key={cat.slug}
                className={`flex items-center gap-2.5 cursor-pointer group rounded-lg px-2 py-1.5 transition-colors ${
                  checked ? "bg-blue-50" : "hover:bg-gray-50"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                    checked
                      ? "bg-blue-600 border-blue-600"
                      : "border-gray-300 group-hover:border-gray-400"
                  }`}
                >
                  {checked && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCategory(cat.slug)}
                  className="sr-only"
                />
                <span className={`text-sm flex-1 transition-colors ${checked ? "text-blue-700 font-medium" : "text-gray-700 group-hover:text-gray-900"}`}>
                  {localized(locale, cat.name, cat.nameEn)}
                </span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${checked ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}>
                  {cat.count}
                </span>
              </label>
            )
          })}
        </div>
        {categories.length > 6 && (
          <button
            type="button"
            onClick={() => setShowAllCats((v) => !v)}
            className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            {showAllCats ? "Show less" : `Show all (${categories.length})`}
          </button>
        )}
      </FilterSection>

      {/* Price range */}
      <FilterSection title="Price (₾)">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            step="1"
            placeholder="Min"
            defaultValue={currentParams.minPrice ?? ""}
            onBlur={(e) => update({ minPrice: e.target.value || undefined })}
            onKeyDown={(e) => e.key === "Enter" && update({ minPrice: (e.target as HTMLInputElement).value || undefined })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-gray-300 text-xs shrink-0">—</span>
          <input
            type="number"
            min={0}
            step="1"
            placeholder="Max"
            defaultValue={currentParams.maxPrice ?? ""}
            onBlur={(e) => update({ maxPrice: e.target.value || undefined })}
            onKeyDown={(e) => e.key === "Enter" && update({ maxPrice: (e.target as HTMLInputElement).value || undefined })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </FilterSection>

      {/* Rating */}
      <FilterSection title="Min Rating">
        <div className="flex flex-col gap-1.5">
          {[4, 3, 2, 1].map((star) => (
            <StarRatingButton
              key={star}
              stars={star}
              selected={parseInt(rating) === star}
              onClick={() => update({ rating: rating === String(star) ? undefined : String(star) })}
            />
          ))}
        </div>
      </FilterSection>

      {/* In Stock — Toggle Switch */}
      <FilterSection title="Availability">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-gray-700">In stock only</span>
          <button
            type="button"
            role="switch"
            aria-checked={inStock}
            onClick={() => update({ inStock: inStock ? undefined : "true" })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
              inStock ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                inStock ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </label>
      </FilterSection>

      {/* Vendors */}
      {vendors.length > 0 && (
        <FilterSection title="Vendors">
          {vendors.length > 8 && (
            <div className="mb-2">
              <input
                type="text"
                placeholder="Search vendors..."
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-300"
              />
            </div>
          )}
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {filteredVendors.map((v) => {
              const checked = selectedVendors.includes(v.slug)
              return (
                <label
                  key={v.slug}
                  className={`flex items-center gap-2.5 cursor-pointer group rounded-lg px-2 py-1.5 transition-colors ${
                    checked ? "bg-blue-50" : "hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                      checked
                        ? "bg-blue-600 border-blue-600"
                        : "border-gray-300 group-hover:border-gray-400"
                    }`}
                  >
                    {checked && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleVendor(v.slug)}
                    className="sr-only"
                  />
                  <span className={`text-sm flex-1 truncate transition-colors ${checked ? "text-blue-700 font-medium" : "text-gray-700 group-hover:text-gray-900"}`}>
                    {v.name}
                  </span>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full shrink-0 ${checked ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}>
                    {v.count}
                  </span>
                </label>
              )
            })}
          </div>
        </FilterSection>
      )}
    </div>
  )

  /* ─── Mobile: Full-screen drawer ─── */
  if (mobile) {
    return (
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors w-full justify-center"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Backdrop + Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <div className="relative ml-auto w-full max-w-sm bg-white h-full flex flex-col animate-slide-in-right">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Content */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {filterContent}
              </div>
              {/* Footer */}
              <div className="px-5 py-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Show Results
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ─── Desktop sidebar ─── */
  return (
    <aside className="hidden lg:block w-60 shrink-0">
      <div className="sticky top-24 bg-white border border-gray-200 rounded-2xl p-5 space-y-0">
        {filterContent}
      </div>
    </aside>
  )
}
