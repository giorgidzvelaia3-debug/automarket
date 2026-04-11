"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useSearchHistory } from "@/lib/useSearchHistory"
import SearchDropdown, { type ProductSuggestion, type CategorySuggestion } from "./SearchDropdown"

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
    setQuery(trimmed)
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
    if (!hasQuery || !focused) return
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
        {focused && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
            <SearchDropdown
              query={query}
              hasQuery={hasQuery}
              products={products}
              categories={categories}
              activeIndex={activeIndex}
              loading={loading}
              locale={locale}
              history={history}
              onSearch={doSearch}
              onClose={() => setFocused(false)}
              t={t}
            />
          </div>
        )}
      </form>
    </div>
  )
}
