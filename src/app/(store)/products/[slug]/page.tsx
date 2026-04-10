import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getLocale, getTranslations } from "next-intl/server"
import { localized } from "@/lib/localeName"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import ImageGallery from "./ImageGallery"
import ProductTabs from "./ProductTabs"
import ProductInfoPanel from "./ProductInfoPanel"
import ProductCarousels from "./ProductCarousels"
import StickyMobileBar from "./StickyMobileBar"
import StickyPanel from "./StickyPanel"
import BundleSection from "./BundleSection"
import TrackRecentlyViewed from "@/components/store/TrackRecentlyViewed"
import { getFlashSaleByProduct, getFlashSalesForProducts } from "@/lib/actions/flashSales"
import { isWishlisted } from "@/lib/actions/wishlist"
import { getBundleItems } from "@/lib/actions/bundles"

/* ─── Metadata ──────────────────────────────────────────── */

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await props.params
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      name: true, nameEn: true, descriptionEn: true,
      vendor: { select: { name: true } },
      images: { take: 1, orderBy: { order: "asc" }, where: { variantId: null }, select: { url: true } },
    },
  })
  if (!product) return { title: "Product Not Found" }

  const title = `${product.nameEn} — ${product.vendor.name} | AutoMarket`
  const description = product.descriptionEn?.slice(0, 160) ??
    `Buy ${product.nameEn} from ${product.vendor.name} on AutoMarket`

  return {
    title, description,
    openGraph: { title, description, ...(product.images[0]?.url && { images: [{ url: product.images[0].url }] }) },
  }
}

/* ─── Page ──────────────────────────────────────────────── */

export default async function ProductPage(props: {
  params: Promise<{ slug: string }>
}) {
  const [{ slug }, t, session, locale] = await Promise.all([
    props.params, getTranslations("Product"), auth(), getLocale(),
  ])

  // ── Product query ──
  const rawProduct = await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true, name: true, nameEn: true, description: true, descriptionEn: true,
      price: true, stock: true, status: true, categoryId: true, vendorId: true,
      images: { orderBy: { order: "asc" }, select: { id: true, url: true, variantId: true } },
      category: { select: { nameEn: true, name: true, slug: true } },
      vendor: { select: { name: true, slug: true, description: true } },
      variants: { orderBy: { order: "asc" }, select: { id: true, name: true, nameEn: true, price: true, stock: true } },
    },
  })
  const product = rawProduct
    ? { ...rawProduct, price: Number(rawProduct.price), variants: rawProduct.variants.map((v) => ({ ...v, price: Number(v.price) })) }
    : null
  if (!product || product.status !== "ACTIVE") notFound()

  const userId = session?.user?.id ?? null

  // ── Parallel data fetch ──
  const carouselSelect = {
    id: true, slug: true, name: true, nameEn: true, price: true, stock: true,
    createdAt: true, vendorId: true,
    images: { take: 1, orderBy: { order: "asc" as const }, where: { variantId: null }, select: { url: true } },
    category: { select: { nameEn: true, name: true } },
    vendor: { select: { name: true, slug: true } },
    reviews: { select: { rating: true } },
    variants: { orderBy: { order: "asc" as const }, select: { id: true, name: true, nameEn: true, price: true, stock: true } },
  }

  const [similarProducts, vendorProducts, reviews, ratingAgg, totalReviewCount, wishlisted, activeSale, bundleItems] = await Promise.all([
    prisma.product.findMany({ where: { categoryId: product.categoryId, status: "ACTIVE", id: { not: product.id } }, take: 8, orderBy: { createdAt: "desc" }, select: carouselSelect }),
    prisma.product.findMany({ where: { vendorId: product.vendorId, status: "ACTIVE", id: { not: product.id } }, take: 8, orderBy: { createdAt: "desc" }, select: carouselSelect }),
    prisma.review.findMany({ where: { productId: product.id }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, rating: true, comment: true, createdAt: true, userId: true, user: { select: { name: true, email: true } } } }),
    prisma.review.aggregate({ where: { productId: product.id }, _avg: { rating: true }, _count: { rating: true } }),
    prisma.review.count({ where: { productId: product.id } }),
    userId ? isWishlisted(product.id) : Promise.resolve(false),
    getFlashSaleByProduct(product.id),
    getBundleItems(product.id),
  ])

  const carouselFlashSaleMap = await getFlashSalesForProducts([...similarProducts.map((p) => p.id), ...vendorProducts.map((p) => p.id)])

  const avgRating = ratingAgg?._avg?.rating ?? 0
  const existingReview = userId ? reviews.find((r) => r.userId === userId) : undefined
  const starCounts = [0, 0, 0, 0, 0]
  for (const r of reviews) starCounts[r.rating - 1]++

  const priceNum = product.price
  const productLabels = {
    addToCart: t("addToCart"), added: t("added"), qty: t("qty"),
    outOfStock: t("outOfStock"), inStock: t("inStock", { count: "{count}" }), error: t("error"),
  }

  // ── Render ──
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
      <TrackRecentlyViewed id={product.id} slug={slug} name={product.name} nameEn={product.nameEn} price={priceNum} image={product.images[0]?.url ?? null} />

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-gray-400">
        <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
        <Link href={`/categories/${product.category.slug}`} className="hover:text-gray-600 transition-colors">{localized(locale, product.category.name, product.category.nameEn)}</Link>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
        <span className="text-gray-600 truncate max-w-[200px]">{localized(locale, product.name, product.nameEn)}</span>
      </nav>

      {/* ─── 2-column grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 lg:items-start">
        {/* LEFT */}
        <div className="space-y-6">
          <ImageGallery images={product.images} altBase={product.nameEn} />
          {bundleItems.length > 0 && (
            <BundleSection
              mainProduct={{ id: product.id, name: product.name, nameEn: product.nameEn, price: priceNum, image: product.images[0]?.url ?? null, vendorId: product.vendorId, vendorName: product.vendor.name, vendorSlug: product.vendor.slug }}
              bundles={bundleItems.map((b) => ({ id: b.id, discountPercent: b.discountPercent, bundleProduct: { id: b.bundleProduct.id, name: b.bundleProduct.name, nameEn: b.bundleProduct.nameEn, price: Number(b.bundleProduct.price), stock: b.bundleProduct.stock, slug: b.bundleProduct.slug, image: b.bundleProduct.images[0]?.url ?? null, vendorId: product.vendorId, vendorName: product.vendor.name, vendorSlug: product.vendor.slug, variants: b.bundleProduct.variants?.map((v) => ({ id: v.id, name: v.name, nameEn: v.nameEn, price: Number(v.price), stock: v.stock })) } }))}
            />
          )}
        </div>

        {/* RIGHT — JS-based sticky info panel */}
        <StickyPanel>
        <ProductInfoPanel
          product={product}
          locale={locale}
          localized={localized}
          slug={slug}
          userId={userId}
          avgRating={avgRating}
          totalReviewCount={totalReviewCount}
          wishlisted={wishlisted}
          activeSale={activeSale}
          labels={productLabels}
          visitShopLabel={t("visitShop")}
        />
        </StickyPanel>
      </div>

      {/* ─── Description + Reviews ─── */}
      <div className="mt-12">
        <ProductTabs
          description={product.description}
          descriptionEn={product.descriptionEn}
          reviews={reviews.map((r) => ({ id: r.id, rating: r.rating, comment: r.comment, createdAt: r.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }), userId: r.userId, userName: r.user.name ?? r.user.email.split("@")[0] }))}
          totalReviewCount={totalReviewCount}
          starCounts={starCounts}
          avgRating={avgRating}
          productId={product.id}
          currentUserId={userId}
          existingReview={existingReview ? { rating: existingReview.rating, comment: existingReview.comment } : undefined}
        />
      </div>

      {/* ─── Carousels ─── */}
      <ProductCarousels
        similarProducts={similarProducts}
        vendorProducts={vendorProducts}
        categorySlug={product.category.slug}
        vendorName={product.vendor.name}
        vendorSlug={product.vendor.slug}
        locale={locale}
        localized={localized}
        flashSaleMap={carouselFlashSaleMap}
      />

      {/* ─── Mobile sticky bar ─── */}
      <StickyMobileBar
        productId={product.id}
        basePrice={activeSale ? activeSale.salePrice : priceNum}
        baseStock={product.stock}
        isLoggedIn={!!userId}
        vendorId={product.vendorId}
        vendorName={product.vendor.name}
        vendorSlug={product.vendor.slug}
        name={product.name}
        nameEn={product.nameEn}
        image={product.images[0]?.url ?? null}
        hasFlashSale={!!activeSale}
        labels={productLabels}
      />
    </div>
  )
}
