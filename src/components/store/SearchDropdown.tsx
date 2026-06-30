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

type AggregatedSuggestion = {
  slug: string
  name: string
  nameEn: string
  image: string | null
  priceFrom: number
  offerCount: number
}

export { type ProductSuggestion, type CategorySuggestion, type AggregatedSuggestion }

type Offsets = { categories: number; products: number; aggregated: number; footer: number }

const POPULAR_SEARCHES = [
  "ფილტრი", "ზეთი", "სამუხრუჭე", "ამორტიზატორი", "აკუმულატორი",
  "სანთლები", "რადიატორი", "ქამარი",
]

function fmtPrice(n: number): string {
  return n % 1 === 0 ? `₾${n.toFixed(0)}` : `₾${n.toFixed(2)}`
}

/* Highlight the matched substring of `text` against `query`. */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  if (!q) return <>{text}</>
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-transparent text-blue-600 font-semibold">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  )
}

const PlaceholderIcon = () => (
  <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
  </svg>
)

export default function SearchDropdown({
  query,
  hasQuery,
  products,
  categories,
  aggregated,
  activeIndex,
  offsets,
  loading,
  locale,
  history,
  onSearch,
  onNavigate,
  onHover,
  onClose,
  t,
}: {
  query: string
  hasQuery: boolean
  products: ProductSuggestion[]
  categories: CategorySuggestion[]
  aggregated: AggregatedSuggestion[]
  activeIndex: number
  offsets: Offsets
  loading: boolean
  locale: string
  history: ReturnType<typeof useSearchHistory>
  onSearch: (term: string) => void
  onNavigate: (href: string) => void
  onHover: (index: number) => void
  onClose: () => void
  t: ReturnType<typeof useTranslations<"Home">>
}) {
  const hasResults = products.length > 0 || categories.length > 0 || aggregated.length > 0

  /* ─── Empty state: recent + popular ─── */
  if (!hasQuery) {
    return (
      <div className="py-2">
        {history.items.length > 0 && (
          <div className="px-4 pt-2 pb-3">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t("recentSearches")}</span>
              <button type="button" onClick={history.clear} className="text-[11px] text-blue-600 hover:text-blue-700 font-medium">
                {t("clearHistory")}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {history.items.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => onSearch(term)}
                  className="group inline-flex items-center gap-1.5 rounded-full bg-gray-100 hover:bg-blue-50 px-3 py-1.5 text-xs text-gray-700 hover:text-blue-700 transition-colors"
                >
                  <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {term}
                  <span onClick={(e) => { e.stopPropagation(); history.remove(term) }} className="ml-0.5 text-gray-400 hover:text-red-500 cursor-pointer">×</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={`px-4 pb-3 ${history.items.length > 0 ? "pt-1 border-t border-gray-100" : "pt-2"}`}>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2.5">{t("popularSearches")}</span>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => onSearch(term)}
                className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 hover:bg-blue-50 px-3 py-1.5 text-xs text-gray-700 hover:text-blue-700 transition-colors"
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

  /* ─── No results ─── */
  if (!hasResults && !loading) {
    return (
      <div>
        <div className="px-4 py-8 text-center">
          <div className="mx-auto mb-2 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
            <PlaceholderIcon />
          </div>
          <p className="text-sm text-gray-500">{t("noResults")}</p>
        </div>
        <SearchForFooter query={query} active={activeIndex === offsets.footer} onSearch={onSearch} onHover={() => onHover(offsets.footer)} t={t} />
        <KeyboardHints />
      </div>
    )
  }

  /* ─── Results ─── */
  return (
    <div className="max-h-[72vh] overflow-y-auto">
      {/* Categories */}
      {categories.length > 0 && (
        <div className="px-4 pt-3 pb-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t("categories")}</span>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {categories.map((c, i) => {
              const gi = offsets.categories + i
              return (
                <Link
                  key={c.slug}
                  href={`/categories/${c.slug}`}
                  onClick={onClose}
                  onMouseEnter={() => onHover(gi)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    gi === activeIndex ? "bg-blue-100 border-blue-200 text-blue-800" : "bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100"
                  }`}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
                  </svg>
                  <Highlight text={localized(locale, c.name, c.nameEn)} query={query} />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Products */}
      {products.length > 0 && (
        <div className={categories.length > 0 ? "border-t border-gray-100 pt-1" : ""}>
          <div className="px-4 pt-2.5 pb-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t("products")}</span>
          </div>
          {products.map((s, i) => {
            const gi = offsets.products + i
            return (
              <button
                key={s.slug}
                type="button"
                onClick={() => onNavigate(`/products/${s.slug}`)}
                onMouseEnter={() => onHover(gi)}
                className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors ${gi === activeIndex ? "bg-blue-50" : "hover:bg-gray-50"}`}
              >
                <div className="w-11 h-11 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                  {s.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={optimizeImageUrl(s.image, 64)} alt="" className="w-full h-full object-cover" />
                  ) : <PlaceholderIcon />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate"><Highlight text={localized(locale, s.name, s.nameEn)} query={query} /></p>
                  <p className="text-[11px] text-gray-400 truncate">{s.vendorName}</p>
                </div>
                <span className="text-sm font-bold text-gray-900 shrink-0">{fmtPrice(s.price)}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Aggregated — price comparison */}
      {aggregated.length > 0 && (
        <div className="border-t border-gray-100 pt-1">
          <div className="px-4 pt-2.5 pb-1 flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t("priceCompare")}</span>
          </div>
          {aggregated.map((a, i) => {
            const gi = offsets.aggregated + i
            return (
              <button
                key={a.slug}
                type="button"
                onClick={() => onNavigate(`/products/${a.slug}`)}
                onMouseEnter={() => onHover(gi)}
                className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors ${gi === activeIndex ? "bg-blue-50" : "hover:bg-gray-50"}`}
              >
                <div className="w-11 h-11 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                  {a.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.image} alt="" className="w-full h-full object-cover" />
                  ) : <PlaceholderIcon />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate"><Highlight text={localized(locale, a.name, a.nameEn)} query={query} /></p>
                  <p className="text-[11px] text-gray-400 truncate">{t("availableAt", { count: a.offerCount })}</p>
                </div>
                <span className="text-sm font-bold text-gray-900 shrink-0">
                  <span className="text-[10px] font-normal text-gray-400 mr-0.5">{t("from")}</span>{fmtPrice(a.priceFrom)}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <SearchForFooter query={query} active={activeIndex === offsets.footer} onSearch={onSearch} onHover={() => onHover(offsets.footer)} t={t} />
      <KeyboardHints />
    </div>
  )
}

function SearchForFooter({
  query,
  active,
  onSearch,
  onHover,
  t,
}: {
  query: string
  active: boolean
  onSearch: (q: string) => void
  onHover: () => void
  t: ReturnType<typeof useTranslations<"Home">>
}) {
  return (
    <button
      type="button"
      onClick={() => onSearch(query)}
      onMouseEnter={onHover}
      className={`flex items-center gap-2.5 w-full px-4 py-3 text-sm border-t border-gray-100 transition-colors ${active ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}
    >
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
      <span className="truncate">{t("searchFor")} <span className="font-semibold">&ldquo;{query.trim()}&rdquo;</span></span>
    </button>
  )
}

function KeyboardHints() {
  return (
    <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-gray-50/70 border-t border-gray-100 text-[11px] text-gray-400">
      <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
      <span className="flex items-center gap-1"><Kbd>↵</Kbd> select</span>
      <span className="flex items-center gap-1"><Kbd>esc</Kbd> close</span>
    </div>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded border border-gray-200 bg-white text-[10px] font-sans text-gray-500">
      {children}
    </kbd>
  )
}
