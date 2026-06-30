"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useSearchHistory } from "@/lib/useSearchHistory"
import SearchDropdown, {
  type ProductSuggestion,
  type CategorySuggestion,
  type AggregatedSuggestion,
} from "./SearchDropdown"

export default function SearchBar({
  defaultValue = "",
  placeholder,
  className = "",
}: {
  defaultValue?: string
  placeholder?: string
  className?: string
}) {
  const locale = useLocale()
  const t = useTranslations("Home")
  const router = useRouter()
  const history = useSearchHistory()

  const [query, setQuery] = useState(defaultValue)
  const [focused, setFocused] = useState(false)
  const [products, setProducts] = useState<ProductSuggestion[]>([])
  const [categories, setCategories] = useState<CategorySuggestion[]>([])
  const [aggregated, setAggregated] = useState<AggregatedSuggestion[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [loading, setLoading] = useState(false)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const hasQuery = query.trim().length >= 2

  const doSearch = useCallback((term: string) => {
    const trimmed = term.trim()
    if (!trimmed) return
    history.add(trimmed)
    setQuery(trimmed)
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    setFocused(false)
    inputRef.current?.blur()
  }, [history, router])

  const navigateTo = useCallback((href: string) => {
    history.add(query.trim())
    router.push(href)
    setFocused(false)
    inputRef.current?.blur()
  }, [history, query, router])

  // Flat, ordered list of keyboard-navigable items: categories → products →
  // aggregated → "search for X". Each carries the action to run on Enter/click.
  const navItems = useMemo(() => {
    if (!hasQuery) return [] as { href?: string; run?: () => void }[]
    const items: { href?: string; run?: () => void }[] = []
    for (const c of categories) items.push({ href: `/categories/${c.slug}` })
    for (const p of products) items.push({ href: `/products/${p.slug}` })
    for (const a of aggregated) items.push({ href: `/products/${a.slug}` })
    items.push({ run: () => doSearch(query) }) // footer
    return items
  }, [hasQuery, categories, products, aggregated, query, doSearch])

  // Section offsets so the dropdown can map each row to its global index.
  const offsets = useMemo(() => ({
    categories: 0,
    products: categories.length,
    aggregated: categories.length + products.length,
    footer: categories.length + products.length + aggregated.length,
  }), [categories.length, products.length, aggregated.length])

  // Fetch suggestions (debounced)
  useEffect(() => {
    if (!hasQuery) {
      setProducts([])
      setCategories([])
      setAggregated([])
      return
    }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query.trim())}`)
        const data = await res.json()
        setProducts(data.products ?? [])
        setCategories(data.categories ?? [])
        setAggregated(data.aggregated ?? [])
        setActiveIndex(-1)
      } catch {
        setProducts([])
        setCategories([])
        setAggregated([])
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(timerRef.current)
  }, [query, hasQuery])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const item = activeIndex >= 0 ? navItems[activeIndex] : undefined
    if (item?.href) navigateTo(item.href)
    else if (item?.run) item.run()
    else doSearch(query)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setFocused(false)
      inputRef.current?.blur()
      return
    }
    if (!hasQuery || !focused || navItems.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % navItems.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => (i <= 0 ? navItems.length - 1 : i - 1))
    }
  }

  function clearQuery() {
    setQuery("")
    setProducts([])
    setCategories([])
    setAggregated([])
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {/* Backdrop */}
      {focused && (
        <div className="fixed inset-0 bg-gray-900/10 backdrop-blur-[1px] z-40" onClick={() => setFocused(false)} />
      )}

      <form onSubmit={handleSubmit} className="relative z-50">
        <div className={`relative flex items-center rounded-xl border transition-all duration-200 ${
          focused
            ? "border-blue-400 ring-4 ring-blue-500/15 bg-white shadow-xl"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}>
          <div className="pl-4 pr-2 text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? t("searchPlaceholder")}
            className="flex-1 py-3 pr-2 text-base sm:text-sm text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none"
            autoComplete="off"
            role="combobox"
            aria-expanded={focused}
            aria-controls="search-listbox"
          />

          {query && (
            <button
              type="button"
              onClick={clearQuery}
              className="p-1.5 mr-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Clear"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {loading && (
            <div className="pr-2">
              <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}

          <button
            type="submit"
            className="rounded-r-xl bg-blue-600 text-white font-semibold px-5 py-3 text-sm hover:bg-blue-700 transition-colors shrink-0"
          >
            {t("search")}
          </button>
        </div>

        {focused && (
          <div
            id="search-listbox"
            role="listbox"
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden z-50"
          >
            <SearchDropdown
              query={query}
              hasQuery={hasQuery}
              products={products}
              categories={categories}
              aggregated={aggregated}
              activeIndex={activeIndex}
              offsets={offsets}
              loading={loading}
              locale={locale}
              history={history}
              onSearch={doSearch}
              onNavigate={navigateTo}
              onHover={setActiveIndex}
              onClose={() => setFocused(false)}
              t={t}
            />
          </div>
        )}
      </form>
    </div>
  )
}
