export default function AdminDashboardLoading() {
  return (
    <div className="max-w-5xl space-y-8 animate-pulse">
      <div>
        <div className="h-6 bg-gray-200 rounded w-32 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-56" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 px-6 py-5 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-24" />
            <div className="h-8 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-4 bg-gray-200 rounded w-32" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="space-y-1.5">
              <div className="h-3.5 bg-gray-200 rounded w-40" />
              <div className="h-3 bg-gray-200 rounded w-28" />
            </div>
            <div className="h-6 bg-gray-200 rounded-full w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
