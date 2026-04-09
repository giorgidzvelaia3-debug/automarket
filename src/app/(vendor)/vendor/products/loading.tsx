export default function VendorProductsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-6 bg-gray-200 rounded w-24 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-32" />
        </div>
        <div className="h-10 bg-gray-200 rounded-lg w-32" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Table header */}
        <div className="border-b border-gray-200 bg-gray-50 px-5 py-3 flex gap-6">
          {["w-32", "w-48", "w-20", "w-16", "w-20", "w-16"].map((w, i) => (
            <div key={i} className={`h-3 bg-gray-200 rounded ${w}`} />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-5 py-4 flex items-center gap-6 border-b border-gray-100">
            <div className="w-10 h-10 bg-gray-200 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-gray-200 rounded w-3/5" />
              <div className="h-3 bg-gray-200 rounded w-2/5" />
            </div>
            <div className="h-3 bg-gray-200 rounded w-16" />
            <div className="h-3 bg-gray-200 rounded w-12" />
            <div className="h-6 bg-gray-200 rounded-full w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
