export default function SearchLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="h-7 bg-gray-200 rounded w-56 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-32 mb-8" />

      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="hidden lg:block w-60 shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="h-9 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-16 mt-4" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-7 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
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
