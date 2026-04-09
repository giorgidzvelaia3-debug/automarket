import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import ImageGallery from "./ImageGallery"
import AddToCartButton from "@/components/store/AddToCartButton"
import ProductActions from "./ProductActions"
import ProductTabs from "./ProductTabs"
import MessageVendorButton from "./MessageVendorButton"
import { StarDisplay } from "@/components/store/StarRating"
import LazyProductCarousel from "@/components/store/LazyProductCarousel"
import WishlistButton from "@/components/store/WishlistButton"
import CompareButton from "@/components/store/CompareButton"
import { getFlashSaleByProduct, getFlashSalesForProducts } from "@/lib/actions/flashSales"
import { isWishlisted } from "@/lib/actions/wishlist"
// Cache removed — Neon cold start can cause null to be cached as 404

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await props.params
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      name: true,
      nameEn: true,
      descriptionEn: true,
      vendor: { select: { name: true } },
      images: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
    },
  })

  if (!product) return { title: "Product Not Found" }

  const title = `${product.nameEn} — ${product.vendor.name} | AutoMarket`
  const description =
    product.descriptionEn?.slice(0, 160) ??
    `Buy ${product.nameEn} from ${product.vendor.name} on AutoMarket`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(product.images[0]?.url && { images: [{ url: product.images[0].url }] }),
    },
  }
}

export default async function ProductPage(props: {
  params: Promise<{ slug: string }>
}) {
  // Phase 1: Cached product + session + translations — all parallel
  const [{ slug }, t, session] = await Promise.all([
    props.params,
    getTranslations("Product"),
    auth(),
  ])

  // Direct query — prevents caching null/error as 404 on Neon cold start
  const rawProduct = await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      nameEn: true,
      description: true,
      descriptionEn: true,
      price: true,
      stock: true,
      status: true,
      categoryId: true,
      vendorId: true,
      images: { orderBy: { order: "asc" }, select: { id: true, url: true } },
      category: { select: { nameEn: true, name: true, slug: true } },
      vendor: { select: { name: true, slug: true, description: true } },
      variants: {
        orderBy: { order: "asc" },
        select: { id: true, name: true, nameEn: true, price: true, stock: true },
      },
    },
  })
  const product = rawProduct
    ? {
        ...rawProduct,
        price: Number(rawProduct.price),
        variants: rawProduct.variants.map((v) => ({ ...v, price: Number(v.price) })),
      }
    : null
  if (!product || product.status !== "ACTIVE") notFound()

  const userId = session?.user?.id ?? null

  // Phase 2: All remaining queries in one parallel batch
  const productSelect = {
    id: true,
    slug: true,
    name: true,
    nameEn: true,
    price: true,
    stock: true,
    createdAt: true,
    vendorId: true,
    images: { take: 1, orderBy: { order: "asc" as const }, select: { url: true } },
    category: { select: { nameEn: true } },
    vendor: { select: { name: true, slug: true } },
    reviews: { select: { rating: true } },
    variants: { orderBy: { order: "asc" as const }, select: { id: true, name: true, nameEn: true, price: true, stock: true } },
  }

  const [
    similarProducts,
    vendorProducts,
    reviews,
    ratingAgg,
    totalReviewCount,
    wishlisted,
    activeSale,
  ] = await Promise.all([
    prisma.product.findMany({
      where: { categoryId: product.categoryId, status: "ACTIVE", id: { not: product.id } },
      take: 8,
      orderBy: { createdAt: "desc" },
      select: productSelect,
    }),
    prisma.product.findMany({
      where: { vendorId: product.vendorId, status: "ACTIVE", id: { not: product.id } },
      take: 8,
      orderBy: { createdAt: "desc" },
      select: productSelect,
    }),
    prisma.review.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        userId: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    prisma.review.count({ where: { productId: product.id } }),
    userId ? isWishlisted(product.id) : Promise.resolve(false),
    getFlashSaleByProduct(product.id),
  ])

  // Phase 3: Flash sales for carousels (depends on phase 2 results)
  const carouselFlashSaleMap = await getFlashSalesForProducts([
    ...similarProducts.map((p) => p.id),
    ...vendorProducts.map((p) => p.id),
  ])

  const avgRating = ratingAgg?._avg?.rating ?? 0
  const existingReview = userId
    ? reviews.find((r) => r.userId === userId)
    : undefined

  // Star breakdown for rating summary
  const starCounts = [0, 0, 0, 0, 0]
  for (const r of reviews) {
    starCounts[r.rating - 1]++
  }

  const priceNum = product.price

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-gray-400">
        <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
        <Link href={`/categories/${product.category.slug}`} className="hover:text-gray-600 transition-colors">
          {product.category.nameEn}
        </Link>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
        <span className="text-gray-600 truncate max-w-[200px]">{product.nameEn}</span>
      </nav>

      {/* ─── Main 2-column layout ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10">
        {/* LEFT: Image gallery */}
        <div>
          <ImageGallery images={product.images} altBase={product.nameEn} />
        </div>

        {/* RIGHT: Sticky info panel */}
        <div className="lg:sticky lg:top-24 lg:self-start space-y-5">
          {/* Category pill */}
          <Link
            href={`/categories/${product.category.slug}`}
            className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
          >
            {product.category.nameEn}
          </Link>

          {/* Product name */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{product.name}</h1>
            <p className="mt-1 text-sm text-gray-500">{product.nameEn}</p>
          </div>

          {/* Rating row — clickable anchor to #reviews */}
          {totalReviewCount > 0 ? (
            <a href="#reviews" className="flex items-center gap-2 group">
              <StarDisplay rating={avgRating} size="sm" />
              <span className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors">
                {avgRating.toFixed(1)} ({totalReviewCount} {totalReviewCount === 1 ? "review" : "reviews"})
              </span>
            </a>
          ) : (
            <a href="#reviews" className="text-xs text-gray-400 hover:text-blue-500 transition-colors">
              Be the first to review
            </a>
          )}

          {/* Price, stock, variant selector, add to cart (incl. flash sale banner) */}
          <ProductActions
            productId={product.id}
            basePrice={priceNum}
            baseStock={product.stock}
            flashSale={activeSale}
            variants={product.variants.map((v) => ({
              id: v.id,
              name: v.name,
              nameEn: v.nameEn,
              price: Number(v.price),
              stock: v.stock,
            }))}
            isLoggedIn={!!userId}
            vendorId={product.vendorId}
            vendorName={product.vendor.name}
            vendorSlug={product.vendor.slug}
            productName={product.name}
            productNameEn={product.nameEn}
            productImage={product.images[0]?.url ?? null}
          />

          {/* Wishlist + Compare side by side */}
          <div className="flex gap-3">
            <div className="flex-1">
              <WishlistButton
                productId={product.id}
                isWishlisted={wishlisted}
                isLoggedIn={!!userId}
                size="md"
              />
            </div>
            <div className="flex-1">
              <CompareButton
                product={{
                  id: product.id,
                  slug,
                  name: product.name,
                  nameEn: product.nameEn,
                  price: priceNum,
                  image: product.images[0]?.url ?? null,
                }}
              />
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Vendor card */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <span className="text-blue-500 text-lg font-bold">
                  {product.vendor.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">{product.vendor.name}</p>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-green-50 border border-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700 shrink-0">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                    Verified
                  </span>
                </div>
                {product.vendor.description && (
                  <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{product.vendor.description}</p>
                )}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Link
                href={`/vendors/${product.vendor.slug}`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
              >
                {t("visitShop")}
              </Link>
              <MessageVendorButton
                vendorId={product.vendorId}
                productId={product.id}
                isLoggedIn={!!userId}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Description + Reviews Tabs ─────────────────────────── */}
      <div className="mt-12">
        <ProductTabs
          description={product.description}
          descriptionEn={product.descriptionEn}
          reviews={reviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
            userId: r.userId,
            userName: r.user.name ?? r.user.email.split("@")[0],
          }))}
          totalReviewCount={totalReviewCount}
          starCounts={starCounts}
          avgRating={avgRating}
          productId={product.id}
          currentUserId={userId}
          existingReview={existingReview
            ? { rating: existingReview.rating, comment: existingReview.comment }
            : undefined}
        />
      </div>

      {/* ─── Similar Products — horizontal scroll with lazy loading ── */}
      {similarProducts.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Similar Products</h2>
            <Link href={`/categories/${product.category.slug}`} className="text-sm text-blue-600 hover:underline">
              View All →
            </Link>
          </div>
          <LazyProductCarousel
            products={similarProducts.map((p) => {
              const rc = p.reviews.length
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
                avgRating: rc > 0 ? p.reviews.reduce((s, r) => s + r.rating, 0) / rc : undefined,
                reviewCount: rc > 0 ? rc : undefined,
                createdAt: p.createdAt.toISOString(),
                variants: p.variants?.map((v) => ({ id: v.id, name: v.name, nameEn: v.nameEn, price: Number(v.price), stock: v.stock })),
                flashSale: carouselFlashSaleMap.get(p.id) ?? null,
              }
            })}
          />
        </div>
      )}

      {/* ─── More from vendor — horizontal scroll with lazy loading ── */}
      {vendorProducts.length > 0 && (
        <div className="mt-12 mb-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">
              More from {product.vendor.name}
            </h2>
            <Link href={`/vendors/${product.vendor.slug}`} className="text-sm text-blue-600 hover:underline">
              View Shop →
            </Link>
          </div>
          <LazyProductCarousel
            products={vendorProducts.map((p) => {
              const rc = p.reviews.length
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
                avgRating: rc > 0 ? p.reviews.reduce((s, r) => s + r.rating, 0) / rc : undefined,
                reviewCount: rc > 0 ? rc : undefined,
                createdAt: p.createdAt.toISOString(),
                variants: p.variants?.map((v) => ({ id: v.id, name: v.name, nameEn: v.nameEn, price: Number(v.price), stock: v.stock })),
                flashSale: carouselFlashSaleMap.get(p.id) ?? null,
              }
            })}
          />
        </div>
      )}

      {/* ─── Sticky mobile bar ─────────────────────────────────────── */}
      {product.stock > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white border-t border-gray-200 shadow-lg px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-4 max-w-lg mx-auto">
            <div className="shrink-0">
              <p className="text-lg font-bold text-gray-900">₾{priceNum.toFixed(2)}</p>
              <p className="text-[10px] text-green-600 font-medium">{product.stock} in stock</p>
            </div>
            <div className="flex-1">
              <AddToCartButton
                productId={product.id}
                stock={product.stock}
                isLoggedIn={!!userId}
                vendorId={product.vendorId}
                vendorName={product.vendor.name}
                vendorSlug={product.vendor.slug}
                price={priceNum}
                name={product.name}
                nameEn={product.nameEn}
                image={product.images[0]?.url ?? null}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
