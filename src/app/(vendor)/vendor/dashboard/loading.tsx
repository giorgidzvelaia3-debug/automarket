export default function VendorDashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-6 bg-gray-200 rounded w-32 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-48" />
      </div>

      {/* Balance card */}
      <div className="h-24 bg-gray-200 rounded-xl" />

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 px-6 py-5 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-20" />
            <div className="h-7 bg-gray-200 rounded w-16" />
            <div className="h-2.5 bg-gray-200 rounded w-24" />
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="h-4 bg-gray-200 rounded w-48 mb-4" />
        <div className="h-40 bg-gray-200 rounded" />
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 h-56" />
        <div className="bg-white rounded-xl border border-gray-200 p-6 h-56" />
      </div>
    </div>
  )
}
