import Link from "next/link"
import { getLocale, getTranslations } from "next-intl/server"
import { localized } from "@/lib/localeName"
import { prisma } from "@/lib/prisma"
import SearchBar from "@/components/store/SearchBar"
import { StarDisplay } from "@/components/store/StarRating"
import CountdownTimer from "@/components/store/CountdownTimer"
import LazyProductCarousel from "@/components/store/LazyProductCarousel"
import HeroBannerCarousel from "@/components/store/HeroBannerCarousel"
import SideBanner from "@/components/store/SideBanner"
import { getFlashSalesForProducts } from "@/lib/actions/flashSales"
import { getBanners } from "@/lib/actions/banners"

export default async function HomePage() {
  const now = new Date()
  const [categories, vendors, featuredProducts, flashSales, t, locale, allBanners] = await Promise.all([
    prisma.category.findMany({
      orderBy: { nameEn: "asc" },
      select: { id: true, slug: true, nameEn: true, name: true },
    }),
    prisma.vendor.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        _count: { select: { products: { where: { status: "ACTIVE" } } } },
        products: {
          where: { status: "ACTIVE" },
          select: { reviews: { select: { rating: true } } },
        },
      },
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        slug: true,
        name: true,
        nameEn: true,
        price: true,
        stock: true,
        createdAt: true,
        vendorId: true,
        images: { take: 1, orderBy: { order: "asc" }, where: { variantId: null }, select: { url: true } },
        category: { select: { nameEn: true } },
        vendor: { select: { name: true, slug: true } },
        reviews: { select: { rating: true } },
        variants: { orderBy: { order: "asc" }, select: { id: true, name: true, nameEn: true, price: true, stock: true } },
      },
    }),
    prisma.flashSale.findMany({
      where: { status: "ACTIVE", featured: true, startTime: { lte: now }, endTime: { gte: now } },
      orderBy: { endTime: "asc" },
      take: 2,
      include: {
        vendor: { select: { name: true } },
        items: {
          take: 6,
          include: {
            product: {
              select: { slug: true, name: true, nameEn: true, images: { take: 1, orderBy: { order: "asc" }, where: { variantId: null }, select: { url: true } } },
            },
          },
        },
      },
    }),
    getTranslations("Home"),
    getLocale(),
    getBanners(),
  ])

  const flashSaleMap = await getFlashSalesForProducts(featuredProducts.map((p) => p.id))

  const heroBanners = allBanners.filter((b) => b.position === "HERO")
  const sideTopBanners = allBanners.filter((b) => b.position === "SIDE_TOP")
  const sideBottomBanners = allBanners.filter((b) => b.position === "SIDE_BOTTOM")

  return (
    <>
      {/* Hero — Banner layout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        {/* Search bar - prominent on top */}
        <div className="max-w-2xl mx-auto mb-6 lg:hidden">
          <SearchBar placeholder={t("searchPlaceholder")} />
        </div>

        {heroBanners.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
            {/* Main carousel */}
            <HeroBannerCarousel banners={heroBanners} />

            {/* Side banners - desktop only */}
            <div className="hidden lg:flex flex-col gap-4">
              {sideTopBanners[0] && <SideBanner banner={sideTopBanners[0]} />}
              {sideBottomBanners[0] ? (
                <SideBanner banner={sideBottomBanners[0]} />
              ) : sideTopBanners[1] ? (
                <SideBanner banner={sideTopBanners[1]} />
              ) : (
                /* Fallback: quick links card */
                <div className="flex-1 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-5 flex flex-col justify-center text-white">
                  <p className="text-xs font-semibold tracking-widest uppercase text-blue-200 mb-2">AutoMarket</p>
                  <p className="text-lg font-bold leading-snug">{t("heroTitle")}</p>
                  <p className="text-sm text-blue-100/70 mt-1.5">{t("heroSubtitle")}</p>
                  <div className="mt-4 flex items-center gap-3 text-[11px] text-blue-200/70">
                    <span>{vendors.length} vendors</span>
                    <span className="w-1 h-1 rounded-full bg-blue-300/40" />
                    <span>{featuredProducts.length}+ products</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Fallback hero when no banners */
          <div className="relative rounded-2xl bg-gradient-to-br from-gray-900 via-blue-900 to-blue-800 text-white overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
            </div>
            <div className="relative text-center py-16 sm:py-24 px-4">
              <p className="text-blue-300 text-sm font-semibold tracking-widest uppercase mb-4">
                Georgia&apos;s #1 Auto Parts Marketplace
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                {t("heroTitle")}
              </h1>
              <p className="mt-5 text-lg sm:text-xl text-blue-100/80 max-w-2xl mx-auto">
                {t("heroSubtitle")}
              </p>
              <div className="mt-8 max-w-xl mx-auto hidden lg:block">
                <SearchBar placeholder={t("searchPlaceholder")} />
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Categories — icon grid, scrollable on mobile */}
        {categories.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t("browseCategories")}</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 sm:overflow-visible">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-5 text-center hover:border-blue-300 hover:shadow-md transition-all shrink-0 w-32 sm:w-auto"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-gray-800 leading-snug">{localized(locale, cat.name, cat.nameEn)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Flash Sales */}
        {flashSales.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <h2 className="text-lg font-bold text-gray-900">Flash Sales</h2>
              </div>
              <Link href="/flash-sales" className="text-sm text-red-600 hover:underline font-medium">
                View All →
              </Link>
            </div>
            <div className="space-y-4">
              {flashSales.map((sale) => (
                <div key={sale.id} className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{sale.titleEn}</p>
                      <p className="text-xs text-gray-500">by {sale.vendor.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Ends in</span>
                      <CountdownTimer endTime={sale.endTime.toISOString()} size="sm" />
                    </div>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-1 snap-x">
                    {sale.items.map((item) => (
                      <Link
                        key={item.id}
                        href={`/products/${item.product.slug}`}
                        className="shrink-0 w-32 rounded-lg border border-white bg-white p-2 hover:shadow-sm transition-all snap-start"
                      >
                        <div className="relative aspect-square bg-gray-100 rounded-md overflow-hidden mb-1.5">
                          {item.product.images[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                          )}
                          <span className="absolute top-1 left-1 rounded bg-red-600 px-1 py-0.5 text-[9px] font-bold text-white">
                            -{item.discountType === "PERCENTAGE" ? `${Number(item.discountValue)}%` : `₾${Number(item.discountValue)}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-900 font-medium line-clamp-1">{item.product.name}</p>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-xs font-bold text-red-600">₾{Number(item.salePrice).toFixed(0)}</span>
                          <span className="text-[10px] text-gray-400 line-through">₾{Number(item.originalPrice).toFixed(0)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Featured Products — horizontal scroll with lazy loading */}
        {featuredProducts.length > 0 && (
          <section className="mt-14">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">New Arrivals</h2>
              <Link href="/search?sort=newest" className="text-sm text-blue-600 hover:underline">
                {t("viewAll")} →
              </Link>
            </div>
            <LazyProductCarousel
              products={featuredProducts.map((p) => {
                const rc = p.reviews.length
                const avg = rc > 0 ? p.reviews.reduce((s, r) => s + r.rating, 0) / rc : undefined
                return {
                  productId: p.id,
                  slug: p.slug,
                  name: p.name,
                  nameEn: p.nameEn,
                  price: Number(p.price),
                  stock: p.stock,
                  imageUrl: p.images[0]?.url,
                  categoryName: p.category.nameEn,
                  vendorName: p.vendor.name,
                  vendorSlug: p.vendor.slug,
                  vendorId: p.vendorId,
                  avgRating: avg,
                  reviewCount: rc > 0 ? rc : undefined,
                  createdAt: p.createdAt.toISOString(),
                  variants: p.variants?.map((v) => ({ id: v.id, name: v.name, nameEn: v.nameEn, price: Number(v.price), stock: v.stock })),
                  flashSale: flashSaleMap.get(p.id) ?? null,
                }
              })}
            />
          </section>
        )}

        {/* Featured Vendors */}
        {vendors.length > 0 && (
          <section className="mt-14 mb-16">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{t("featuredVendors")}</h2>
              <Link href="/vendors" className="text-sm text-blue-600 hover:underline">
                {t("viewAll")} →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {vendors.map((vendor) => {
                const allReviews = vendor.products.flatMap((p) => p.reviews)
                const rc = allReviews.length
                const avg = rc > 0 ? allReviews.reduce((s, r) => s + r.rating, 0) / rc : 0
                return (
                  <Link
                    key={vendor.id}
                    href={`/vendors/${vendor.slug}`}
                    className="group block rounded-xl border border-gray-200 bg-white p-5 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                      <span className="text-blue-400 text-xl font-bold">
                        {vendor.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {vendor.name}
                    </p>
                    {vendor.description && (
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2">{vendor.description}</p>
                    )}
                    {rc > 0 && (
                      <div className="mt-1.5">
                        <StarDisplay rating={avg} count={rc} size="sm" />
                      </div>
                    )}
                    <p className="mt-2 text-xs text-gray-400">
                      {t("products", { count: vendor._count.products })}
                    </p>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {vendors.length === 0 && categories.length === 0 && featuredProducts.length === 0 && (
          <div className="py-24 text-center text-gray-400 text-sm">
            {t("noContent")}
          </div>
        )}
      </div>
    </>
  )
}
