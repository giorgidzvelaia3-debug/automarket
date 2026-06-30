import { getTranslations } from "next-intl/server"

function fmt(n: number): string {
  return n % 1 === 0 ? `₾${n.toFixed(0)}` : `₾${n.toFixed(2)}`
}

export default async function OfferComparisonPanel({
  priceFrom,
  offerCount,
  cheapestUrl,
}: {
  priceFrom: number
  offerCount: number
  cheapestUrl: string | null
}) {
  const t = await getTranslations("Aggregator")

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
      <div>
        <p className="text-xs text-gray-400">{t("comparePricesHeading")}</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">{t("fromPrice", { price: fmt(priceFrom).replace("₾", "") })}</p>
        <p className="mt-1 text-sm text-gray-500">{t("availableAt", { count: offerCount })}</p>
      </div>

      {cheapestUrl && (
        <a
          href={cheapestUrl}
          target="_blank"
          rel="nofollow noopener sponsored"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          {t("goToCheapest")}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      )}

      <p className="text-xs text-gray-400 leading-relaxed">{t("viewOnSiteNote")}</p>
    </div>
  )
}
