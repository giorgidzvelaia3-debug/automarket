import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { StarDisplay } from "@/components/store/StarRating"
import ProductGrid from "@/components/store/ProductGrid"
import VendorBadges from "@/components/store/VendorBadges"
import { getFlashSalesForProducts } from "@/lib/actions/flashSales"
import { getCachedVendor } from "@/lib/cache/vendors"

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await props.params
  const vendor = await prisma.vendor.findUnique({
    where: { slug },
    select: { name: true, description: true },
  })

  if (!vendor) return { title: "Vendor Not Found" }

  const title = `${vendor.name} | AutoMarket`
  const description =
    vendor.description?.slice(0, 160) ??
    `Shop auto parts from ${vendor.name} on AutoMarket`

  return { title, description, openGraph: { title, description } }
}

type SortOption = "newest" | "price_asc" | "price_desc" | "rating"

export default async function VendorStorePage(props: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sort?: string }>
}) {
  const [{ slug }, { sort: sortParam }] = await Promise.all([
    props.params,
    props.searchParams,
  ])

  const sort: SortOption = (["newest", "price_asc", "price_desc", "rating"] as const).includes(
    sortParam as SortOption
  )
    ? (sortParam as SortOption)
    : "newest"

  const vendor = await getCachedVendor(slug, sort)

  if (!vendor || vendor.status !== "APPROVED") notFound()

  // Aggregate vendor-wide rating from DB (not from loaded reviews)
  const [vendorRatingAgg, flashSaleMap] = await Promise.all([
    prisma.review.aggregate({
      where: { product: { vendorId: vendor.id } },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    getFlashSalesForProducts(vendor.products.map((p) => p.id)),
  ])

  const totalReviews = vendorRatingAgg._count.rating
  const avgRating = vendorRatingAgg._avg.rating ?? 0

  // Prepare products with computed rating (from loaded reviews which are per-product)
  let products = vendor.products.map((p) => {
    const rc = p.reviews.length
    const avg = rc > 0 ? p.reviews.reduce((s, r) => s + r.rating, 0) / rc : 0
    return { ...p, avgRating: avg, reviewCount: rc }
  })

  // Sort by rating if needed (computed field)
  if (sort === "rating") {
    products = [...products].sort((a, b) => b.avgRating - a.avgRating)
  }

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Newest" },
    { value: "price_asc", label: "Price ↑" },
    { value: "price_desc", label: "Price ↓" },
    { value: "rating", label: "Top Rated" },
  ]

  return (
    <div>
      {/* Banner / cover area */}
      <div className="relative bg-gradient-to-br from-blue-600 to-blue-800 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.3' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E\")" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shrink-0">
              <span className="text-white text-2xl sm:text-4xl font-bold">
                {vendor.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-3xl font-bold text-white truncate">{vendor.name}</h1>
              </div>
              {vendor.badges.length > 0 && (
                <div className="mt-2">
                  <VendorBadges badges={vendor.badges as never} />
                </div>
              )}
              {vendor.description && (
                <p className="mt-2 text-sm text-blue-100/80 max-w-2xl">{vendor.description}</p>
              )}
              {totalReviews > 0 && (
                <div className="mt-3">
                  <StarDisplay rating={avgRating} count={totalReviews} />
                </div>
              )}

              {/* Order limit pills */}
              {(vendor.minOrderAmount || vendor.maxOrderAmount || vendor.minOrderQty || vendor.maxOrderQty) && (
                <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                  {vendor.minOrderAmount && (
                    <span className="inline-flex items-center rounded-full bg-white/15 backdrop-blur-sm border border-white/30 px-2.5 py-1 text-[11px] font-semibold text-white">
                      მინ. შეკვეთა: ₾{Number(vendor.minOrderAmount).toFixed(2)}
                    </span>
                  )}
                  {vendor.maxOrderAmount && (
                    <span className="inline-flex items-center rounded-full bg-white/15 backdrop-blur-sm border border-white/30 px-2.5 py-1 text-[11px] font-semibold text-white">
                      მაქს. შეკვეთა: ₾{Number(vendor.maxOrderAmount).toFixed(2)}
                    </span>
                  )}
                  {vendor.minOrderQty && (
                    <span className="inline-flex items-center rounded-full bg-white/15 backdrop-blur-sm border border-white/30 px-2.5 py-1 text-[11px] font-semibold text-white">
                      მინ. რაოდ: {vendor.minOrderQty}
                    </span>
                  )}
                  {vendor.maxOrderQty && (
                    <span className="inline-flex items-center rounded-full bg-white/15 backdrop-blur-sm border border-white/30 px-2.5 py-1 text-[11px] font-semibold text-white">
                      მაქს. რაოდ: {vendor.maxOrderQty}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Vacation banner */}
      {vendor.vacationMode && (
        <div className="bg-amber-50 border-y border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <p className="text-sm text-amber-800">
              <span className="font-bold">⚠️ ეს მაღაზია შვებულებაშია</span>
              {vendor.vacationMessage && <span> — {vendor.vacationMessage}</span>}
              {vendor.vacationEnd && (
                <span className="ml-2 text-xs">
                  ბრუნდება: {vendor.vacationEnd.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 -mt-8">
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm">
            <p className="text-xs text-gray-500">Rating</p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {totalReviews > 0 ? avgRating.toFixed(1) : "—"}
            </p>
            <p className="text-xs text-gray-400">
              {totalReviews > 0 ? `${totalReviews} review${totalReviews !== 1 ? "s" : ""}` : "No reviews"}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm">
            <p className="text-xs text-gray-500">Reviews</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{totalReviews}</p>
            <p className="text-xs text-gray-400">All products</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm">
            <p className="text-xs text-gray-500">Products</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{products.length}</p>
            <p className="text-xs text-gray-400">Active</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm">
            <p className="text-xs text-gray-500">Member Since</p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {vendor.createdAt.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
            </p>
            <p className="text-xs text-gray-400">
              {vendor.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Sort bar */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-gray-900">
            Products
            <span className="ml-2 text-sm font-normal text-gray-400">({products.length})</span>
          </h2>
          <div className="flex gap-1.5">
            {sortOptions.map((opt) => (
              <Link
                key={opt.value}
                href={opt.value === "newest" ? `/vendors/${slug}` : `/vendors/${slug}?sort=${opt.value}`}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  sort === opt.value
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Products grid */}
        <ProductGrid
          columns="5"
          products={products.map((p) => ({
            productId: p.id,
            slug: p.slug,
            name: p.name,
            nameEn: p.nameEn,
            price: Number(p.price),
            stock: p.stock,
            imageUrl: p.images[0]?.url,
            categoryName: p.category.nameEn,
            vendorName: vendor.name,
            vendorSlug: slug,
            avgRating: p.reviewCount > 0 ? p.avgRating : undefined,
            reviewCount: p.reviewCount > 0 ? p.reviewCount : undefined,
            createdAt: p.createdAt.toISOString(),
            variants: p.variants?.map((v) => ({ id: v.id, name: v.name, nameEn: v.nameEn, price: Number(v.price), stock: v.stock })),
            flashSale: flashSaleMap.get(p.id) ?? null,
          }))}
          emptyMessage="This vendor has no active products yet."
        />
      </div>
    </div>
  )
}
