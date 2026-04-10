export function SkeletonBox({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
}

export function SkeletonText({ className = "", lines = 1 }: { className?: string; lines?: number }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`animate-pulse rounded bg-gray-200 h-4 ${i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"}`} />
      ))}
    </div>
  )
}

export function SkeletonProductCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <SkeletonBox className="aspect-[4/3] rounded-none" />
      <div className="p-3 space-y-2">
        <SkeletonText lines={2} />
        <SkeletonBox className="h-4 w-20" />
        <div className="flex justify-between items-center pt-1">
          <SkeletonBox className="h-5 w-16" />
          <SkeletonBox className="h-3 w-12" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonProductGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProductCard key={i} />
      ))}
    </div>
  )
}
