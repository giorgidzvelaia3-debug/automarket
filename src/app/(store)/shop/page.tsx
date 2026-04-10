import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { optimizeImageUrl } from "@/lib/imageUtils"
import { getLocale } from "next-intl/server"
import { localized } from "@/lib/localeName"
import { prisma } from "@/lib/prisma"
import { StarDisplay } from "@/components/store/StarRating"
import ProductGrid from "@/components/store/ProductGrid"
import ShopFilters from "./ShopFilters"
import ShopTopBar from "./ShopTopBar"
import { getFlashSalesForProducts } from "@/lib/actions/flashSales"

const ALLOWED_PER_PAGE = [12, 24, 48, 96]
const DEFAULT_PER_PAGE = 12

type SearchParams = {
  category?: string
  vendor?: string
  perPage?: string
  minPrice?: string
  maxPrice?: string
  rating?: string
  inStock?: string
  sort?: string
  page?: string
  view?: string
}

export async function generateMetadata(props: {
  searchParams: Promise<SearchParams>
}): Promise<Metadata> {
  const params = await props.searchParams
  const catSlugs = (params.category ?? "").split(",").filter(Boolean)

  let title = "Shop All Products"
  if (catSlugs.length === 1) {
    const cat = await prisma.category.findUnique({
      where: { slug: catSlugs[0] },
      select: { nameEn: true },
    })
    if (cat) title = `${cat.nameEn} — AutoMarket Shop`
  } else if (catSlugs.length > 1) {
    title = `Filtered Products — AutoMarket Shop`
  }

  return {
    title: `${title} | AutoMarket`,
    description: "Browse and filter auto parts from trusted vendors across Georgia.",
  }
}

export default async function ShopPage(props: {
  searchParams: Promise<SearchParams>
}) {
  const params = await props.searchParams
  const minPrice = params.minPrice ? parseFloat(params.minPrice) : undefined
  const maxPrice = params.maxPrice ? parseFloat(params.maxPrice) : undefined
  const minRating = params.rating ? parseInt(params.rating) : undefined
  const inStockOnly = params.inStock === "true"
  const sort = params.sort ?? "newest"
  const page = Math.max(1, parseInt(params.page ?? "1") || 1)
  const view = params.view ?? "grid"
  const rawPerPage = parseInt(String(params.perPage ?? "12"))
  const perPage = ALLOWED_PER_PAGE.includes(rawPerPage) ? rawPerPage : DEFAULT_PER_PAGE
  const catSlugs = (params.category ?? "").split(",").filter(Boolean)
  const vendorSlugs = (params.vendor ?? "").split(",").filter(Boolean)

  // Fetch categories + vendors with product counts for filters
  const [allCategories, allVendors] = await Promise.all([
    prisma.category.findMany({
      orderBy: { nameEn: "asc" },
      select: {
        slug: true,
        nameEn: true,
        name: true,
        _count: { select: { products: { where: { status: "ACTIVE" } } } },
      },
    }),
    prisma.vendor.findMany({
      where: { status: "APPROVED" },
      orderBy: { name: "asc" },
      select: {
        slug: true,
        name: true,
        _count: { select: { products: { where: { status: "ACTIVE" } } } },
      },
    }),
  ])

  // Resolve category/vendor IDs from slugs — in parallel
  const [categoryIds, vendorIds] = await Promise.all([
    catSlugs.length > 0
      ? prisma.category.findMany({ where: { slug: { in: catSlugs } }, select: { id: true } }).then((cs) => cs.map((c) => c.id))
      : undefined,
    vendorSlugs.length > 0
      ? prisma.vendor.findMany({ where: { slug: { in: vendorSlugs } }, select: { id: true } }).then((vs) => vs.map((v) => v.id))
      : undefined,
  ])

  // Build where clause — all server-side
  const where: Record<string, unknown> = { status: "ACTIVE" as const }

  if (categoryIds && categoryIds.length > 0) {
    where.categoryId = { in: categoryIds }
  }
  if (vendorIds && vendorIds.length > 0) {
    where.vendorId = { in: vendorIds }
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {
      ...(minPrice !== undefined ? { gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
    }
  }
  if (inStockOnly) {
    where.stock = { gt: 0 }
  }

  // Sort
  let orderBy: Record<string, string>
  switch (sort) {
    case "price_asc": orderBy = { price: "asc" }; break
    case "price_desc": orderBy = { price: "desc" }; break
    case "popular": orderBy = { createdAt: "desc" }; break // will re-sort by order count
    case "rating": orderBy = { createdAt: "desc" }; break  // will re-sort by avg rating
    default: orderBy = { createdAt: "desc" }
  }

  // Get total count + paginated products
  const [totalCount, rawProducts] = await Promise.all([
    prisma.product.count({ where: where as never }),
    prisma.product.findMany({
      where: where as never,
      orderBy: orderBy as never,
      skip: (page - 1) * perPage,
      take: sort === "rating" || sort === "popular" ? 200 : perPage, // fetch more for JS sort
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
        category: { select: { nameEn: true, name: true } },
        vendor: { select: { name: true, slug: true } },
        reviews: { select: { rating: true } },
        variants: { orderBy: { order: "asc" }, select: { id: true, name: true, nameEn: true, price: true, stock: true } },
        _count: { select: { orderItems: true } },
      },
    }),
  ])

  // Compute ratings + apply JS filters
  let products = rawProducts.map((p) => {
    const rc = p.reviews.length
    const avgRating = rc > 0 ? p.reviews.reduce((s, r) => s + r.rating, 0) / rc : 0
    return { ...p, avgRating, reviewCount: rc, orderCount: p._count.orderItems }
  })

  // Rating filter (computed field)
  if (minRating) {
    products = products.filter((p) => p.avgRating >= minRating)
  }

  // JS-level sorts
  if (sort === "rating") {
    products.sort((a, b) => b.avgRating - a.avgRating)
  } else if (sort === "popular") {
    products.sort((a, b) => b.orderCount - a.orderCount)
  }

  // Paginate after JS sort
  if (sort === "rating" || sort === "popular") {
    products = products.slice((page - 1) * perPage, page * perPage)
  }

  const adjustedTotal = minRating ? totalCount : totalCount // approximation
  const totalPages = Math.ceil(adjustedTotal / perPage)

  const locale = await getLocale()

  // Build name maps for pills
  const categoryNames: Record<string, string> = {}
  for (const c of allCategories) categoryNames[c.slug] = localized(locale, c.name, c.nameEn)
  const vendorNames: Record<string, string> = {}
  for (const v of allVendors) vendorNames[v.slug] = v.name

  const flashSaleMap = await getFlashSalesForProducts(products.map((p) => p.id))

  // Map to ProductCardProps
  const cardProducts = products.map((p) => ({
    productId: p.id,
    slug: p.slug,
    name: p.name,
    nameEn: p.nameEn,
    price: Number(p.price),
    stock: p.stock,
    imageUrl: p.images[0]?.url,
    categoryName: localized(locale, p.category.name, p.category.nameEn),
    vendorName: p.vendor.name,
    vendorSlug: p.vendor.slug,
    vendorId: p.vendorId,
    avgRating: p.reviewCount > 0 ? p.avgRating : undefined,
    reviewCount: p.reviewCount > 0 ? p.reviewCount : undefined,
    createdAt: p.createdAt.toISOString(),
    variants: p.variants?.map((v) => ({ id: v.id, name: v.name, nameEn: v.nameEn, price: Number(v.price), stock: v.stock })),
    flashSale: flashSaleMap.get(p.id) ?? null,
  }))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Shop</h1>
        <p className="mt-1 text-sm text-gray-500">Browse all auto parts and accessories</p>
      </div>

      {/* Mobile filters */}
      <ShopFilters
        categories={allCategories.map((c) => ({ slug: c.slug, nameEn: c.nameEn, name: c.name, count: c._count.products }))}
        vendors={allVendors.map((v) => ({ slug: v.slug, name: v.name, count: v._count.products }))}
        currentParams={params}
        mobile
      />

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <ShopFilters
          categories={allCategories.map((c) => ({ slug: c.slug, nameEn: c.nameEn, name: c.name, count: c._count.products }))}
          vendors={allVendors.map((v) => ({ slug: v.slug, name: v.name, count: v._count.products }))}
          currentParams={params}
        />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <ShopTopBar
            totalCount={adjustedTotal}
            currentParams={params}
            categoryNames={categoryNames}
            vendorNames={vendorNames}
            perPage={perPage}
          />

          <div className="mt-6">
            {view === "list" ? (
              /* List view */
              products.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-gray-400 text-sm">No products match your filters.</p>
                  <Link href="/shop" className="mt-3 inline-block text-sm text-blue-600 hover:underline">Clear all filters</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map((p) => (
                    <Link
                      key={p.id}
                      href={`/products/${p.slug}`}
                      className="flex items-start sm:items-center gap-3 sm:gap-4 bg-white rounded-xl border border-gray-200 p-3 sm:p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
                    >
                      <div className="relative w-24 h-24 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                        {p.images[0] ? (
                          <Image
                            src={optimizeImageUrl(p.images[0].url, 200)}
                            alt={localized(locale, p.name, p.nameEn)}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full"><span className="text-gray-300 text-2xl">□</span></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">{localized(locale, p.name, p.nameEn)}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-blue-500">{localized(locale, p.category.name, p.category.nameEn)}</span>
                          {p.reviewCount > 0 && <StarDisplay rating={p.avgRating} count={p.reviewCount} size="sm" />}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">by {p.vendor.name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-gray-900">₾{Number(p.price).toFixed(2)}</p>
                        <p className={`text-xs font-medium ${p.stock > 0 ? "text-green-600" : "text-red-500"}`}>
                          {p.stock > 0 ? "In stock" : "Out of stock"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            ) : (
              /* Grid view */
              <ProductGrid
                products={cardProducts}
                emptyMessage="No products match your filters."
              />
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link
                  href={buildPageUrl(params, page - 1)}
                  className="px-4 py-2.5 min-h-[44px] rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
                >
                  ← Prev
                </Link>
              )}
              {/* Page numbers — hidden on mobile */}
              <div className="hidden sm:flex items-center gap-2">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let p: number
                  if (totalPages <= 7) {
                    p = i + 1
                  } else if (page <= 4) {
                    p = i + 1
                  } else if (page >= totalPages - 3) {
                    p = totalPages - 6 + i
                  } else {
                    p = page - 3 + i
                  }
                  return (
                    <Link
                      key={p}
                      href={buildPageUrl(params, p)}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                        p === page
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </Link>
                  )
                })}
              </div>
              {/* Mobile: page indicator */}
              <span className="sm:hidden text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={buildPageUrl(params, page + 1)}
                  className="px-4 py-2.5 min-h-[44px] rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
                >
                  Next →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function buildPageUrl(params: SearchParams, page: number): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, v)
  }
  if (page > 1) sp.set("page", String(page))
  else sp.delete("page")
  return `/shop?${sp.toString()}`
}
