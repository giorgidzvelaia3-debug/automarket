import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"
import { localized } from "@/lib/localeName"
import ImageGallery from "./ImageGallery"
import OfferComparisonTable, { type ComparisonOffer } from "./OfferComparisonTable"
import OfferComparisonPanel from "./OfferComparisonPanel"

export type AggregatedView = {
  id: string
  name: string
  nameEn: string
  description: string | null
  descriptionEn: string | null
  imageUrl: string | null
  category: { name: string; nameEn: string; slug: string }
  specs: Record<string, string> | null
  offers: ComparisonOffer[]
}

export default async function AggregatedProductView({ product }: { product: AggregatedView }) {
  const locale = await getLocale()
  const t = await getTranslations("Aggregator")
  const specsHeading = t("characteristics")
  const displayName = localized(locale, product.name, product.nameEn)
  const description = localized(locale, product.description ?? "", product.descriptionEn ?? "")

  const sorted = [...product.offers].sort((a, b) => a.price - b.price)
  const priceFrom = sorted[0]?.price ?? 0
  const cheapestUrl = sorted[0]?.sourceUrl ?? null

  const galleryImages = product.imageUrl
    ? [{ id: product.id, url: product.imageUrl, variantId: null }]
    : []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb — single line, horizontal scroll if it overflows */}
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap overflow-x-auto scrollbar-none">
        <Link href="/" className="shrink-0 hover:text-gray-600 transition-colors">Home</Link>
        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
        <Link href={`/categories/${product.category.slug}`} className="shrink-0 hover:text-gray-600 transition-colors">{localized(locale, product.category.name, product.category.nameEn)}</Link>
        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
        <span className="shrink-0 text-gray-600">{displayName}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 lg:gap-10 lg:items-start">
        {/* LEFT */}
        <div className="space-y-6 sm:space-y-8 min-w-0">
          {galleryImages.length > 0 ? (
            <ImageGallery images={galleryImages} altBase={product.nameEn} />
          ) : (
            <div className="aspect-[4/3] rounded-2xl bg-gray-50 flex items-center justify-center">
              <svg className="w-16 h-16 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" /></svg>
            </div>
          )}

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{displayName}</h1>
          </div>

          {/* Comparison table */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-gray-900">{t("availableAt", { count: product.offers.length })}</h2>
            <OfferComparisonTable offers={product.offers} />
          </div>

          {/* Mobile: comparison summary panel right after the table */}
          <div className="lg:hidden">
            <OfferComparisonPanel priceFrom={priceFrom} offerCount={product.offers.length} cheapestUrl={cheapestUrl} />
          </div>

          {/* Characteristics */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-gray-900">{specsHeading}</h2>
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100">
                    {Object.entries(product.specs).map(([key, value]) => (
                      <tr key={key}>
                        <td className="px-4 py-3 text-gray-500 w-1/2">{key}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {description.trim() && (
            <div className="prose prose-sm max-w-none text-gray-600">
              <p className="whitespace-pre-line">{description}</p>
            </div>
          )}
        </div>

        {/* RIGHT — sticky panel (desktop only; mobile shows it after the table) */}
        <div className="hidden lg:block lg:sticky lg:top-24">
          <OfferComparisonPanel
            priceFrom={priceFrom}
            offerCount={product.offers.length}
            cheapestUrl={cheapestUrl}
          />
        </div>
      </div>
    </div>
  )
}
