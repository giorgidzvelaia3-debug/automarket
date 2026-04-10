export default function ProductLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      {/* Breadcrumb */}
      <div className="flex gap-2 mb-6">
        <div className="h-3 bg-gray-200 rounded w-12" />
        <div className="h-3 bg-gray-200 rounded w-20" />
        <div className="h-3 bg-gray-200 rounded w-32" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10">
        {/* Gallery skeleton */}
        <div className="flex gap-3">
          <div className="hidden lg:flex flex-col gap-2 w-16 shrink-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-16 h-16 rounded-lg bg-gray-200" />
            ))}
          </div>
          <div className="flex-1 aspect-square rounded-2xl bg-gray-200" />
        </div>

        {/* Info skeleton */}
        <div className="space-y-5">
          <div className="h-6 bg-gray-200 rounded-full w-24" />
          <div className="space-y-2">
            <div className="h-7 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-28" />
          <div className="flex items-baseline gap-2">
            <div className="h-9 bg-gray-200 rounded w-28" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="h-px bg-gray-200" />
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="h-10 bg-gray-200 rounded-lg w-28" />
              <div className="h-10 bg-gray-200 rounded-lg w-28" />
            </div>
            <div className="h-12 bg-gray-200 rounded-lg w-full" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 bg-gray-200 rounded-lg flex-1" />
            <div className="h-10 bg-gray-200 rounded-lg flex-1" />
          </div>
          <div className="h-px bg-gray-200" />
          <div className="bg-gray-200 rounded-xl h-24" />
        </div>
      </div>
    </div>
  )
}
