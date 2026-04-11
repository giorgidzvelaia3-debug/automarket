"use client"

import Link from "next/link"
import { localized } from "@/lib/localeName"
import { optimizeImageUrl } from "@/lib/imageUtils"
import type { useTranslations } from "next-intl"
import type { useSearchHistory } from "@/lib/useSearchHistory"

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

export { type ProductSuggestion, type CategorySuggestion }

const POPULAR_SEARCHES = [
  "ფილტრი", "ზეთი", "სამუხრუჭე", "ამორტიზატორი", "აკუმულატორი",
  "სანთლები", "რადიატორი", "ქამარი",
]

export default function SearchDropdown({
  query,
  hasQuery,
  products,
  categories,
  activeIndex,
  loading,
  locale,
  history,
  onSearch,
  onClose,
  t,
}: {
  query: string
  hasQuery: boolean
  products: ProductSuggestion[]
  categories: CategorySuggestion[]
  activeIndex: number
  loading: boolean
  locale: string
  history: ReturnType<typeof useSearchHistory>
  onSearch: (term: string) => void
  onClose: () => void
  t: ReturnType<typeof useTranslations<"Home">>
}) {
  const hasResults = products.length > 0 || categories.length > 0

  if (!hasQuery) {
    /* ─── Empty state: history + popular ─── */
    return (
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
                  onClick={() => onSearch(term)}
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
                onClick={() => onSearch(term)}
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
    )
  }

  if (hasResults || loading) {
    /* ─── Results state ─── */
    return (
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
                  onClick={onClose}
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
                onClick={() => { history.add(query.trim()); onClose() }}
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
          onClick={() => onSearch(query)}
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
    )
  }

  /* ─── No results ─── */
  return (
    <div className="px-4 py-6 text-center">
      <p className="text-sm text-gray-500">{t("noResults")}</p>
      <button
        type="button"
        onClick={() => onSearch(query)}
        className="mt-2 text-sm text-blue-600 hover:underline font-medium"
      >
        {t("searchFor")} &ldquo;{query.trim()}&rdquo;
      </button>
    </div>
  )
}
