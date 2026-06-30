import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { prisma } from "@/lib/prisma"
import ProductGrid from "@/components/store/ProductGrid"
import { toAggregatedCardProps } from "@/lib/productCard"
import AggregatorFilters, { type Facet } from "./AggregatorFilters"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Aggregator")
  return { title: `${t("title")} | AutoMarket`, description: t("subtitle") }
}

type SearchParams = {
  brand?: string
  viscosity?: string
  volume?: string
  source?: string
  minPrice?: string
  maxPrice?: string
  sort?: string
  compare?: string
}

const list = (v?: string) => (v ?? "").split(",").filter(Boolean)

// Viscosity sort: 0W20, 5W30, 10W40 ... (numeric by the two grades).
function viscOrder(v: string): number {
  const m = v.match(/(\d+)W(\d+)/)
  if (!m) return 9999
  return parseInt(m[1]) * 100 + parseInt(m[2])
}
function volumeOrder(v: string): number {
  const m = v.match(/([\d.]+)/)
  return m ? parseFloat(m[1]) : 9999
}

export default async function AggregatorPage(props: {
  searchParams: Promise<SearchParams>
}) {
  const params = await props.searchParams
  const t = await getTranslations("Aggregator")
  const sort = params.sort ?? "price_asc"

  const brandSel = list(params.brand)
  const viscSel = list(params.viscosity)
  const volSel = list(params.volume)
  const sourceSel = list(params.source)
  const minPrice = params.minPrice ? parseFloat(params.minPrice) : undefined
  const maxPrice = params.maxPrice ? parseFloat(params.maxPrice) : undefined
  const compareOnly = params.compare === "1"

  // ── Facets (global counts over all active aggregated products) ──
  const [brandFacets, viscFacets, volFacets, sources] = await Promise.all([
    prisma.aggregatedProduct.groupBy({ by: ["brand"], where: { status: "ACTIVE" }, _count: true }),
    prisma.aggregatedProduct.groupBy({ by: ["viscosity"], where: { status: "ACTIVE" }, _count: true }),
    prisma.aggregatedProduct.groupBy({ by: ["volume"], where: { status: "ACTIVE" }, _count: true }),
    prisma.source.findMany({ where: { enabled: true }, select: { slug: true, name: true }, orderBy: { name: "asc" } }),
  ])

  const brands: Facet[] = brandFacets
    .filter((b) => b.brand)
    .map((b) => ({ value: b.brand as string, count: b._count }))
    .sort((a, b) => b.count - a.count)
  const viscosities: Facet[] = viscFacets
    .filter((v) => v.viscosity)
    .map((v) => ({ value: v.viscosity as string, count: v._count }))
    .sort((a, b) => viscOrder(a.value) - viscOrder(b.value))
  const volumes: Facet[] = volFacets
    .filter((v) => v.volume)
    .map((v) => ({ value: v.volume as string, count: v._count }))
    .sort((a, b) => volumeOrder(a.value) - volumeOrder(b.value))
  const sourceFacets: Facet[] = sources.map((s) => ({ value: s.slug, count: 0, label: s.name }))

  // ── Filtered products ──
  const where: Record<string, unknown> = { status: "ACTIVE" }
  if (brandSel.length) where.brand = { in: brandSel }
  if (viscSel.length) where.viscosity = { in: viscSel }
  if (volSel.length) where.volume = { in: volSel }
  if (sourceSel.length) {
    where.offers = { some: { active: true, source: { slug: { in: sourceSel } } } }
  }

  const products = await prisma.aggregatedProduct.findMany({
    where: where as never,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      nameEn: true,
      imageUrl: true,
      offers: {
        where: { active: true },
        select: { price: true, sourceId: true, source: { select: { name: true, logo: true } } },
      },
    },
  })

  // Price bounds across all active offers (for placeholders).
  const priceAgg = await prisma.productOffer.aggregate({
    where: { active: true },
    _min: { price: true },
    _max: { price: true },
  })
  const priceRange = {
    min: Math.floor(Number(priceAgg._min.price ?? 0)),
    max: Math.ceil(Number(priceAgg._max.price ?? 1000)),
  }

  let matching = products.filter((p) => p.offers.length > 0)
  // "Compare only": keep products available in more than one distinct store.
  if (compareOnly) {
    matching = matching.filter((p) => new Set(p.offers.map((o) => o.sourceId)).size > 1)
  }
  let cards = matching.map((p) => toAggregatedCardProps(p))

  if (minPrice !== undefined) cards = cards.filter((c) => c.price >= minPrice)
  if (maxPrice !== undefined) cards = cards.filter((c) => c.price <= maxPrice)

  if (sort === "price_asc") cards.sort((a, b) => a.price - b.price)
  else if (sort === "price_desc") cards.sort((a, b) => b.price - a.price)

  const filterProps = {
    brands,
    viscosities,
    volumes,
    sources: sourceFacets,
    params,
    priceRange,
    compareOnly,
    labels: {
      filters: t("filters"),
      brand: t("brand"),
      viscosity: t("viscosity"),
      volume: t("volume"),
      store: t("store"),
      price: t("price"),
      clearAll: t("clearAll"),
      apply: t("apply"),
      min: t("min"),
      max: t("max"),
      compareOnly: t("compareOnly"),
      compareOnlyHint: t("compareOnlyHint"),
      showResults: t("showResults"),
    },
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar filters (desktop) */}
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="sticky top-24 bg-white rounded-2xl border border-gray-200 p-5">
            <AggregatorFilters {...filterProps} />
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Mobile filter button */}
          <div className="lg:hidden mb-4">
            <AggregatorFilters {...filterProps} mobile />
          </div>

          {/* Top bar: result count + sort */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-gray-500">{t("results", { count: cards.length })}</p>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs text-gray-400">{t("sortBy")}</span>
              <SortLinks params={params} labels={{ priceAsc: t("priceLowHigh"), priceDesc: t("priceHighLow"), newest: t("newest") }} current={sort} />
            </div>
          </div>

          <ProductGrid
            products={cards}
            emptyMessage={compareOnly ? t("compareEmpty") : t("noProducts")}
          />
        </div>
      </div>
    </div>
  )
}

function SortLinks({
  params,
  current,
  labels,
}: {
  params: SearchParams
  current: string
  labels: { priceAsc: string; priceDesc: string; newest: string }
}) {
  const options = [
    { key: "price_asc", label: labels.priceAsc },
    { key: "price_desc", label: labels.priceDesc },
    { key: "newest", label: labels.newest },
  ]
  const build = (sortKey: string) => {
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries({ ...params, sort: sortKey })) if (v) sp.set(k, v as string)
    return `/aggregator?${sp.toString()}`
  }
  return (
    <div className="flex items-center gap-1">
      {options.map((o) => (
        <a
          key={o.key}
          href={build(o.key)}
          className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
            current === o.key ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {o.label}
        </a>
      ))}
    </div>
  )
}
