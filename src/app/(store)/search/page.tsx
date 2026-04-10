import Link from "next/link"
import { getLocale } from "next-intl/server"
import { localized } from "@/lib/localeName"
import { prisma } from "@/lib/prisma"
import { StarDisplay } from "@/components/store/StarRating"
import ProductGrid from "@/components/store/ProductGrid"
import SearchBar from "@/components/store/SearchBar"
import SearchFilters from "./SearchFilters"
import { getFlashSalesForProducts } from "@/lib/actions/flashSales"

type SearchParams = {
  q?: string
  minPrice?: string
  maxPrice?: string
  rating?: string
  inStock?: string
  sort?: string
  category?: string
}

export default async function SearchPage(props: {
  searchParams: Promise<SearchParams>
}) {
  const params = await props.searchParams
  const query = params.q?.trim() ?? ""
  const minPrice = params.minPrice ? parseFloat(params.minPrice) : undefined
  const maxPrice = params.maxPrice ? parseFloat(params.maxPrice) : undefined
  const minRating = params.rating ? parseInt(params.rating) : undefined
  const inStockOnly = params.inStock === "true"
  const sort = params.sort ?? "newest"
  const categorySlug = params.category ?? ""

  // Fetch categories for filter dropdown
  const categories = await prisma.category.findMany({
    orderBy: { nameEn: "asc" },
    select: { id: true, slug: true, nameEn: true, name: true },
  })

  // Resolve category ID from slug
  const categoryId = categorySlug
    ? categories.find((c) => c.slug === categorySlug)?.id
    : undefined

  // Build where clause
  const where: Record<string, unknown> = {
    status: "ACTIVE" as const,
  }

  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { nameEn: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { descriptionEn: { contains: query, mode: "insensitive" } },
    ]
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

  if (categoryId) {
    where.categoryId = categoryId
  }

  // Sort order
  let orderBy: Record<string, string>
  switch (sort) {
    case "price_asc":
      orderBy = { price: "asc" }
      break
    case "price_desc":
      orderBy = { price: "desc" }
      break
    case "rating":
      orderBy = { createdAt: "desc" } // We'll re-sort after fetching
      break
    default:
      orderBy = { createdAt: "desc" }
  }

  const products = await prisma.product.findMany({
    where: where as never,
    orderBy: orderBy as never,
    take: 60,
    select: {
      id: true,
      slug: true,
      name: true,
      nameEn: true,
      price: true,
      stock: true,
      images: { take: 1, orderBy: { order: "asc" }, where: { variantId: null }, select: { url: true } },
      category: { select: { nameEn: true, name: true } },
      vendor: { select: { name: true, slug: true } },
      reviews: { select: { rating: true } },
      variants: { orderBy: { order: "asc" }, select: { id: true, name: true, nameEn: true, price: true, stock: true } },
    },
  })

  const locale = await getLocale()

  // Compute avg rating for each product and apply filters
  let filtered = products.map((p) => {
    const rc = p.reviews.length
    const avgRating = rc > 0 ? p.reviews.reduce((s, r) => s + r.rating, 0) / rc : 0
    return { ...p, avgRating, reviewCount: rc }
  })

  // Rating filter (done in JS since it's a computed field)
  if (minRating) {
    filtered = filtered.filter((p) => p.avgRating >= minRating)
  }

  // Sort by rating if needed
  if (sort === "rating") {
    filtered.sort((a, b) => b.avgRating - a.avgRating)
  }

  const flashSaleMap = await getFlashSalesForProducts(filtered.map((p) => p.id))

  // Vendors search (only when there's a text query)
  const vendors = query
    ? await prisma.vendor.findMany({
        where: {
          status: "APPROVED",
          name: { contains: query, mode: "insensitive" },
        },
        orderBy: { name: "asc" },
        take: 8,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          _count: { select: { products: { where: { status: "ACTIVE" } } } },
        },
      })
    : []

  const hasQuery = !!query || !!categorySlug || minPrice !== undefined || maxPrice !== undefined || !!minRating || inStockOnly

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Search bar */}
      <div className="mb-8">
        <SearchBar defaultValue={query} />
      </div>

      {/* Header */}
      <div className="mb-6">
        {query ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900">
              Results for <span className="text-blue-600">&ldquo;{query}&rdquo;</span>
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {filtered.length} product{filtered.length !== 1 ? "s" : ""}
              {vendors.length > 0 && `, ${vendors.length} vendor${vendors.length !== 1 ? "s" : ""}`}
            </p>
          </>
        ) : hasQuery ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900">Browse Products</h1>
            <p className="mt-1 text-sm text-gray-500">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>
          </>
        ) : (
          <div className="py-8 text-center">
            <p className="text-gray-500 text-sm">Enter a search term or use filters to find products.</p>
          </div>
        )}
      </div>

      {hasQuery && (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters */}
          <aside className="lg:w-64 shrink-0">
            <SearchFilters
              categories={categories}
              currentParams={params}
            />
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0 space-y-10">
            {/* Vendors */}
            {vendors.length > 0 && (
              <section>
                <h2 className="text-base font-semibold text-gray-700 mb-4">
                  Vendors <span className="text-gray-400 font-normal">({vendors.length})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {vendors.map((vendor) => (
                    <Link
                      key={vendor.id}
                      href={`/vendors/${vendor.slug}`}
                      className="group block rounded-xl border border-gray-200 bg-white p-5 hover:border-blue-300 hover:shadow-sm transition-all"
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
                      <p className="mt-2 text-xs text-gray-400">
                        {vendor._count.products} {vendor._count.products === 1 ? "product" : "products"}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Products */}
            <section>
              <h2 className="text-base font-semibold text-gray-700 mb-4">
                Products <span className="text-gray-400 font-normal">({filtered.length})</span>
              </h2>
              <ProductGrid
                products={filtered.map((p) => ({
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
                  avgRating: p.reviewCount > 0 ? p.avgRating : undefined,
                  reviewCount: p.reviewCount > 0 ? p.reviewCount : undefined,
                  variants: p.variants?.map((v) => ({ id: v.id, name: v.name, nameEn: v.nameEn, price: Number(v.price), stock: v.stock })),
                  flashSale: flashSaleMap.get(p.id) ?? null,
                }))}
                emptyMessage="No products match your filters."
              />
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
