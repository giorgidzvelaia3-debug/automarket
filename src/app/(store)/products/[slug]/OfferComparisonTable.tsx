import { getTranslations } from "next-intl/server"

export type ComparisonOffer = {
  id: string
  sourceName: string
  price: number
  originalPrice: number | null
  discountPercent: number | null
  availability: "IN_STOCK" | "OUT_OF_STOCK" | "UNKNOWN"
  sourceUrl: string
  lastCheckedAt: Date
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${Math.max(mins, 1)}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

function fmt(n: number): string {
  return n % 1 === 0 ? `₾${n.toFixed(0)}` : `₾${n.toFixed(2)}`
}

export default async function OfferComparisonTable({ offers }: { offers: ComparisonOffer[] }) {
  const t = await getTranslations("Aggregator")
  const sorted = [...offers].sort((a, b) => a.price - b.price)

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100">
      {sorted.map((o, i) => (
        <div key={o.id} className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3.5 ${i === 0 ? "bg-green-50/40" : ""}`}>
          {/* Source */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-gray-900 truncate">{o.sourceName}</span>
              {i === 0 && (
                <span className="rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-bold text-white shrink-0">
                  {t("bestPrice")}
                </span>
              )}
            </div>
            <span className="block text-[11px] text-gray-400">
              {t("lastChecked", { time: timeAgo(o.lastCheckedAt) })}
            </span>
          </div>

          {/* Price */}
          <div className="text-right shrink-0">
            <div className="flex items-baseline justify-end gap-1">
              <span className={`text-sm sm:text-base font-bold ${i === 0 ? "text-green-700" : "text-gray-900"}`}>
                {fmt(o.price)}
              </span>
              {o.originalPrice && o.originalPrice > o.price && (
                <span className="hidden sm:inline text-xs text-gray-400 line-through">{fmt(o.originalPrice)}</span>
              )}
            </div>
            {o.discountPercent ? (
              <span className="text-[11px] font-medium text-red-500">-{o.discountPercent}%</span>
            ) : null}
          </div>

          {/* Outbound button: text on sm+, icon-only on mobile */}
          <a
            href={o.sourceUrl}
            target="_blank"
            rel="nofollow noopener sponsored"
            aria-label={t("goToStore")}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-2.5 sm:px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shrink-0"
          >
            <span className="hidden sm:inline">{t("goToStore")}</span>
            <svg className="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        </div>
      ))}
    </div>
  )
}
