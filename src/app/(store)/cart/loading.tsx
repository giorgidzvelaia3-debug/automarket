export default function CartLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="h-7 bg-gray-200 rounded w-28 mb-6" />

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 bg-white rounded-xl border border-gray-200 p-4">
            <div className="w-20 h-20 rounded-lg bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/3" />
              <div className="flex items-center justify-between mt-2">
                <div className="h-8 bg-gray-200 rounded w-24" />
                <div className="h-5 bg-gray-200 rounded w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="h-5 bg-gray-200 rounded w-24" />
        </div>
        <div className="h-12 bg-gray-200 rounded-lg w-full" />
      </div>
    </div>
  )
}
