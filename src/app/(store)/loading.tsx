export default function StoreLoading() {
  return (
    <div className="animate-pulse">
      {/* Hero skeleton */}
      <div className="bg-gray-200 h-72 sm:h-96" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Categories skeleton */}
        <div className="mt-12 space-y-4">
          <div className="h-5 bg-gray-200 rounded w-40" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shrink-0 w-32 h-24 rounded-xl bg-gray-200" />
            ))}
          </div>
        </div>

        {/* Products skeleton */}
        <div className="mt-14 space-y-4">
          <div className="h-5 bg-gray-200 rounded w-32" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="shrink-0 w-48">
                <div className="aspect-[4/3] bg-gray-200 rounded-t-xl" />
                <div className="p-3 space-y-2">
                  <div className="h-3.5 bg-gray-200 rounded w-4/5" />
                  <div className="h-3 bg-gray-200 rounded w-3/5" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
