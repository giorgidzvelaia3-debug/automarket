export default function HomeLoading() {
  return (
    <div className="animate-pulse">
      {/* Banner skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 lg:h-[420px]">
          <div className="bg-gray-200 rounded-2xl h-[220px] lg:h-full" />
          <div className="hidden lg:flex flex-col gap-4 h-full">
            <div className="flex-1 bg-gray-200 rounded-2xl" />
            <div className="flex-1 bg-gray-200 rounded-2xl" />
          </div>
          {/* Mobile side banners */}
          <div className="grid grid-cols-2 gap-3 lg:hidden">
            <div className="bg-gray-200 rounded-2xl h-[120px]" />
            <div className="bg-gray-200 rounded-2xl h-[120px]" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Categories skeleton */}
        <div className="mt-12">
          <div className="h-6 bg-gray-200 rounded w-40 mb-4" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shrink-0 w-32 h-24 rounded-xl bg-gray-200" />
            ))}
          </div>
        </div>

        {/* Products skeleton */}
        <div className="mt-12">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="aspect-[4/3] bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3.5 bg-gray-200 rounded w-4/5" />
                  <div className="h-3 bg-gray-200 rounded w-3/5" />
                  <div className="h-4 bg-gray-200 rounded w-1/3 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
