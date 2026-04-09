import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { StarDisplay } from "@/components/store/StarRating"

type SortOption = "name" | "top_rated" | "newest"

export default async function VendorsPage(props: {
  searchParams: Promise<{ sort?: string }>
}) {
  const { sort: sortParam } = await props.searchParams
  const sort: SortOption = (["name", "top_rated", "newest"] as const).includes(sortParam as SortOption)
    ? (sortParam as SortOption)
    : "name"

  const vendors = await prisma.vendor.findMany({
    where: { status: "APPROVED" },
    orderBy: sort === "newest" ? { createdAt: "desc" } : { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      createdAt: true,
      _count: { select: { products: { where: { status: "ACTIVE" } } } },
      products: {
        where: { status: "ACTIVE" },
        select: {
          reviews: { select: { rating: true } },
        },
      },
    },
  })

  // Compute vendor ratings
  const vendorsWithRating = vendors.map((vendor) => {
    const allReviews = vendor.products.flatMap((p) => p.reviews)
    const totalReviews = allReviews.length
    const avgRating =
      totalReviews > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0
    return { ...vendor, avgRating, totalReviews }
  })

  // Sort by top rated if needed
  if (sort === "top_rated") {
    vendorsWithRating.sort((a, b) => b.avgRating - a.avgRating)
  }

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "name", label: "Name A–Z" },
    { value: "top_rated", label: "Top Rated" },
    { value: "newest", label: "Newest" },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Vendors</h1>
          <p className="mt-1 text-sm text-gray-500">
            {vendorsWithRating.length} approved{" "}
            {vendorsWithRating.length === 1 ? "vendor" : "vendors"}
          </p>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          {sortOptions.map((opt) => (
            <Link
              key={opt.value}
              href={opt.value === "name" ? "/vendors" : `/vendors?sort=${opt.value}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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

      {vendorsWithRating.length === 0 ? (
        <div className="py-24 text-center text-gray-400 text-sm">
          No vendors available yet. Check back soon.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {vendorsWithRating.map((vendor) => (
            <Link
              key={vendor.id}
              href={`/vendors/${vendor.slug}`}
              className="group block rounded-xl border border-gray-200 bg-white p-6 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              {/* Logo placeholder */}
              <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                <span className="text-blue-400 text-2xl font-bold">
                  {vendor.name.charAt(0).toUpperCase()}
                </span>
              </div>

              <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-base">
                {vendor.name}
              </p>

              {vendor.description && (
                <p className="mt-1.5 text-xs text-gray-500 line-clamp-3 leading-relaxed">
                  {vendor.description}
                </p>
              )}

              {/* Rating badge */}
              {vendor.totalReviews > 0 && (
                <div className="mt-2">
                  <StarDisplay
                    rating={vendor.avgRating}
                    count={vendor.totalReviews}
                    size="sm"
                  />
                </div>
              )}

              <p className="mt-3 text-xs text-gray-400">
                {vendor._count.products}{" "}
                {vendor._count.products === 1 ? "product" : "products"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
