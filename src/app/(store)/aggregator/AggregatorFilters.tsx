"use client"

import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"

export type Facet = { value: string; count: number; label?: string }

export type AggregatorParams = {
  brand?: string
  viscosity?: string
  volume?: string
  source?: string
  minPrice?: string
  maxPrice?: string
  sort?: string
  compare?: string
}

type Props = {
  brands: Facet[]
  viscosities: Facet[]
  volumes: Facet[]
  sources: Facet[]
  params: AggregatorParams
  priceRange: { min: number; max: number }
  compareOnly: boolean
  mobile?: boolean
  labels: {
    filters: string
    brand: string
    viscosity: string
    volume: string
    store: string
    price: string
    clearAll: string
    apply: string
    min: string
    max: string
    compareOnly: string
    compareOnlyHint: string
    showResults: string
  }
}

function FilterSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
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
      <div className={`overflow-hidden transition-all duration-200 ${open ? "mt-3" : "max-h-0 opacity-0"}`}>
        {children}
      </div>
    </div>
  )
}

function CheckList({
  items,
  selected,
  onToggle,
  scroll,
}: {
  items: Facet[]
  selected: string[]
  onToggle: (value: string) => void
  scroll?: boolean
}) {
  return (
    <div className={`space-y-1.5 ${scroll ? "max-h-56 overflow-y-auto pr-1" : ""}`}>
      {items.map((f) => (
        <label key={f.value} className="flex items-center gap-2 cursor-pointer group/item text-sm">
          <input
            type="checkbox"
            checked={selected.includes(f.value)}
            onChange={() => onToggle(f.value)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="flex-1 text-gray-700 group-hover/item:text-gray-900 transition-colors">
            {f.label ?? f.value}
          </span>
          <span className="text-xs text-gray-400">{f.count}</span>
        </label>
      ))}
    </div>
  )
}

export default function AggregatorFilters({
  brands,
  viscosities,
  volumes,
  sources,
  params,
  priceRange,
  compareOnly,
  mobile = false,
  labels,
}: Props) {
  const router = useRouter()
  const [minPrice, setMinPrice] = useState(params.minPrice ?? "")
  const [maxPrice, setMaxPrice] = useState(params.maxPrice ?? "")
  const [mobileOpen, setMobileOpen] = useState(false)

  const buildUrl = useCallback((next: AggregatorParams) => {
    const sp = new URLSearchParams()
    const merged = { ...params, ...next }
    for (const [k, v] of Object.entries(merged)) {
      if (v) sp.set(k, v)
    }
    const qs = sp.toString()
    return qs ? `/aggregator?${qs}` : "/aggregator"
  }, [params])

  // Toggle a value inside a comma-separated multi-select param.
  const toggle = useCallback((key: keyof AggregatorParams, value: string) => {
    const current = (params[key] ?? "").split(",").filter(Boolean)
    const exists = current.includes(value)
    const updated = exists ? current.filter((v) => v !== value) : [...current, value]
    router.push(buildUrl({ [key]: updated.join(",") } as AggregatorParams))
  }, [params, router, buildUrl])

  const selected = (key: keyof AggregatorParams) => (params[key] ?? "").split(",").filter(Boolean)

  const applyPrice = useCallback(() => {
    router.push(buildUrl({ minPrice: minPrice || undefined, maxPrice: maxPrice || undefined }))
  }, [router, buildUrl, minPrice, maxPrice])

  const hasActiveFilters =
    Boolean(params.brand || params.viscosity || params.volume || params.source || params.minPrice || params.maxPrice || params.compare)

  const activeFilterCount =
    selected("brand").length +
    selected("viscosity").length +
    selected("volume").length +
    selected("source").length +
    (params.minPrice || params.maxPrice ? 1 : 0) +
    (params.compare ? 1 : 0)

  const filterContent = (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">{labels.filters}</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => router.push("/aggregator")}
            className="text-xs text-blue-600 hover:underline"
          >
            {labels.clearAll}
          </button>
        )}
      </div>

      {/* Compare-only toggle: products available in more than one store */}
      <button
        type="button"
        onClick={() => router.push(buildUrl({ compare: compareOnly ? undefined : "1" }))}
        className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
          compareOnly ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <span
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
            compareOnly ? "bg-blue-600" : "bg-gray-300"
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${compareOnly ? "translate-x-4" : "translate-x-0.5"}`} />
        </span>
        <span className={`text-sm font-semibold ${compareOnly ? "text-blue-800" : "text-gray-800"}`}>
          {labels.compareOnly}
        </span>
      </button>

      <FilterSection title={labels.brand}>
        <CheckList items={brands} selected={selected("brand")} onToggle={(v) => toggle("brand", v)} scroll />
      </FilterSection>

      <FilterSection title={labels.viscosity}>
        <CheckList items={viscosities} selected={selected("viscosity")} onToggle={(v) => toggle("viscosity", v)} />
      </FilterSection>

      <FilterSection title={labels.volume}>
        <CheckList items={volumes} selected={selected("volume")} onToggle={(v) => toggle("volume", v)} />
      </FilterSection>

      {sources.length > 1 && (
        <FilterSection title={labels.store}>
          <CheckList items={sources} selected={selected("source")} onToggle={(v) => toggle("source", v)} />
        </FilterSection>
      )}

      <FilterSection title={labels.price}>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder={`${labels.min} ${priceRange.min}`}
            className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
          <span className="text-gray-300">–</span>
          <input
            type="number"
            inputMode="numeric"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder={`${labels.max} ${priceRange.max}`}
            className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <button
          type="button"
          onClick={applyPrice}
          className="mt-2 w-full rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 transition-colors"
        >
          {labels.apply}
        </button>
      </FilterSection>
    </div>
  )

  /* ─── Mobile: button + slide-over drawer ─── */
  if (mobile) {
    return (
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          {labels.filters}
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <div className="relative ml-auto flex h-full w-full max-w-sm flex-col bg-white">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <h2 className="text-lg font-semibold text-gray-900">{labels.filters}</h2>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4">{filterContent}</div>
              <div className="border-t border-gray-100 px-5 py-4">
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  {labels.showResults}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ─── Desktop sidebar ─── */
  return filterContent
}
