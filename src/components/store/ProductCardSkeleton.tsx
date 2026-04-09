export default function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden animate-pulse min-h-[280px]">
      {/* Image — 4:3 aspect ratio */}
      <div className="aspect-[4/3] bg-gray-200" />
      {/* Body */}
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-gray-200 rounded w-4/5" />
        <div className="h-3 bg-gray-200 rounded w-3/5" />
        <div className="h-2.5 bg-gray-200 rounded w-2/5" />
        <div className="flex items-center gap-0.5 mt-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-3 h-3 bg-gray-200 rounded-sm" />
          ))}
          <div className="h-2.5 bg-gray-200 rounded w-6 ml-1" />
        </div>
        <div className="flex items-end justify-between mt-1">
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-2.5 bg-gray-200 rounded w-14" />
        </div>
      </div>
    </div>
  )
}
