"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { localized } from "@/lib/localeName"
import { optimizeImageUrl } from "@/lib/imageUtils"
import { useSearchHistory } from "@/lib/useSearchHistory"

type ProductSuggestion = {
  slug: string
  name: string
  nameEn: string
  price: number
  image: string | null
  vendorName: string
}

type CategorySuggestion = {
  slug: string
  name: string
  nameEn: string
}

const POPULAR_SEARCHES = [
  "ფილტრი", "ზეთი", "სამუხრუჭე", "ამორტიზატორი", "აკუმულატორი",
  "სანთლები", "რადიატორი", "ქამარი",
]

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
  const [activeIndex, setActiveIndex] = useState(-1)
  const [loading, setLoading] = useState(false)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const hasQuery = query.trim().length >= 2
  const hasResults = products.length > 0 || categories.length > 0
  const showDropdown = focused

  // Total navigable items for keyboard
  const totalItems = hasQuery ? products.length + 1 : 0 // +1 for "search for X"

  // Fetch suggestions
  useEffect(() => {
    if (!hasQuery) {
      setProducts([])
      setCategories([])
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
        setActiveIndex(-1)
      } catch {
        setProducts([])
        setCategories([])
      } finally {
        setLoading(false)
      }
    }, 300)

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

  const doSearch = useCallback((term: string) => {
    const trimmed = term.trim()
    if (!trimmed) return
    history.add(trimmed)
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    setFocused(false)
    inputRef.current?.blur()
  }, [history, router])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (activeIndex >= 0 && activeIndex < products.length) {
      history.add(query.trim())
      router.push(`/products/${products[activeIndex].slug}`)
      setFocused(false)
    } else {
      doSearch(query)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setFocused(false)
      inputRef.current?.blur()
      return
    }
    if (!hasQuery || !showDropdown) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, totalItems - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    }
  }

  function clearQuery() {
    setQuery("")
    setProducts([])
    setCategories([])
    inputRef.current?.focus()
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {/* Backdrop overlay when focused */}
      {focused && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setFocused(false)} />
      )}

      <form onSubmit={handleSubmit} className="relative z-50">
        <div className={`relative flex items-center rounded-xl border transition-all duration-200 ${
          focused
            ? "border-blue-400 ring-4 ring-blue-500/20 bg-white shadow-lg"
            : "border-gray-200 bg-white"
        }`}>
          {/* Search icon */}
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
          />

          {/* Clear button */}
          {query && (
            <button
              type="button"
              onClick={clearQuery}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Loading spinner */}
          {loading && (
            <div className="pr-3">
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

        {/* ─── Dropdown ─────────────────────────────── */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
            {!hasQuery ? (
              /* ─── Empty state: history + popular ─── */
              <div>
                {/* Recent searches */}
                {history.items.length > 0 && (
                  <div className="p-4 pb-2">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t("recentSearches")}</span>
                      <button
                        type="button"
                        onClick={history.clear}
                        className="text-[11px] text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {t("clearHistory")}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {history.items.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => { setQuery(term); doSearch(term) }}
                          className="group inline-flex items-center gap-1 rounded-full bg-gray-100 hover:bg-blue-50 px-3 py-1.5 text-xs text-gray-700 hover:text-blue-700 transition-colors"
                        >
                          <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {term}
                          <span
                            onClick={(e) => { e.stopPropagation(); history.remove(term) }}
                            className="ml-0.5 text-gray-400 hover:text-red-500 cursor-pointer"
                          >
                            ×
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular searches */}
                <div className={`p-4 ${history.items.length > 0 ? "pt-2 border-t border-gray-100" : ""}`}>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2.5">{t("popularSearches")}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_SEARCHES.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => { setQuery(term); doSearch(term) }}
                        className="inline-flex items-center gap-1 rounded-full bg-gray-100 hover:bg-blue-50 px-3 py-1.5 text-xs text-gray-700 hover:text-blue-700 transition-colors"
                      >
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                        </svg>
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : hasResults || loading ? (
              /* ─── Results state ─── */
              <div>
                {/* Category matches */}
                {categories.length > 0 && (
                  <div className="px-4 pt-3 pb-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t("categories")}</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {categories.map((c) => (
                        <Link
                          key={c.slug}
                          href={`/categories/${c.slug}`}
                          onClick={() => setFocused(false)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
                          </svg>
                          {localized(locale, c.name, c.nameEn)}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product suggestions */}
                {products.length > 0 && (
                  <div className={categories.length > 0 ? "border-t border-gray-100" : ""}>
                    <div className="px-4 pt-2.5 pb-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t("products")}</span>
                    </div>
                    {products.map((s, i) => (
                      <Link
                        key={s.slug}
                        href={`/products/${s.slug}`}
                        onClick={() => { history.add(query.trim()); setFocused(false) }}
                        className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                          i === activeIndex ? "bg-blue-50" : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                          {s.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={optimizeImageUrl(s.image, 64)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-gray-300 text-sm">□</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">{localized(locale, s.name, s.nameEn)}</p>
                          <p className="text-[11px] text-gray-400 truncate">{s.vendorName}</p>
                        </div>
                        <span className="text-sm font-bold text-gray-900 shrink-0">
                          ₾{s.price.toFixed(2)}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}

                {/* "Search for X" footer */}
                <button
                  type="button"
                  onClick={() => doSearch(query)}
                  className={`flex items-center gap-2 w-full px-4 py-3 text-sm border-t border-gray-100 transition-colors ${
                    activeIndex === products.length ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  {t("searchFor")} <span className="font-semibold">&ldquo;{query.trim()}&rdquo;</span>
                </button>
              </div>
            ) : (
              /* ─── No results ─── */
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-gray-500">{t("noResults")}</p>
                <button
                  type="button"
                  onClick={() => doSearch(query)}
                  className="mt-2 text-sm text-blue-600 hover:underline font-medium"
                >
                  {t("searchFor")} &ldquo;{query.trim()}&rdquo;
                </button>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  )
}
