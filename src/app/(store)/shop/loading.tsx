import ProductCardSkeleton from "@/components/store/ProductCardSkeleton"

export default function ShopLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="h-7 bg-gray-200 rounded w-24 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-64 mb-8" />

      <div className="flex gap-8">
        {/* Sidebar skeleton */}
        <div className="hidden lg:block w-60 shrink-0 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-20" />
                <div className="h-8 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Grid skeleton */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-8 bg-gray-200 rounded w-28" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
