"use client"

import Link from "next/link"
import { useRef, useState, useEffect } from "react"
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver"
import LazyProductCarousel, { ProductCarouselSkeleton } from "@/components/store/LazyProductCarousel"
import type { ProductCardProps } from "@/lib/productCard"

const OBSERVER_OPTIONS: IntersectionObserverInit = {
  rootMargin: "400px",
  threshold: 0,
}

export default function ProductCarousels({
  productId,
  categorySlug,
  vendorName,
  vendorSlug,
}: {
  productId: string
  categorySlug: string
  vendorName: string
  vendorSlug: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isVisible = useIntersectionObserver(ref, OBSERVER_OPTIONS)
  const [data, setData] = useState<{ similar: ProductCardProps[]; vendor: ProductCardProps[] } | null>(null)
  const [entered, setEntered] = useState(false)
  const fetched = useRef(false)

  useEffect(() => {
    if (!isVisible || fetched.current) return
    fetched.current = true

    fetch(`/api/products/${productId}/related`)
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        requestAnimationFrame(() => setEntered(true))
      })
      .catch(() => setData({ similar: [], vendor: [] }))
  }, [isVisible, productId])

  // Nothing fetched yet — show skeleton placeholders
  if (!data) {
    return (
      <div ref={ref}>
        <div className="mt-16">
          <div className="flex items-center justify-between mb-5">
            <div className="h-6 w-40 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-4 w-20 bg-gray-100 rounded-lg animate-pulse" />
          </div>
          <ProductCarouselSkeleton />
        </div>
        <div className="mt-12 mb-4">
          <div className="flex items-center justify-between mb-5">
            <div className="h-6 w-48 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-4 w-20 bg-gray-100 rounded-lg animate-pulse" />
          </div>
          <ProductCarouselSkeleton />
        </div>
      </div>
    )
  }

  // Data loaded but both empty
  if (data.similar.length === 0 && data.vendor.length === 0) return null

  return (
    <div
      className="transition-all duration-500 ease-out"
      style={{
        opacity: entered ? 1 : 0,
        transform: entered ? "none" : "translateY(20px)",
      }}
    >
      {data.similar.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Similar Products</h2>
            <Link href={`/categories/${categorySlug}`} className="text-sm text-blue-600 hover:underline">
              View All →
            </Link>
          </div>
          <LazyProductCarousel products={data.similar} />
        </div>
      )}

      {data.vendor.length > 0 && (
        <div className="mt-12 mb-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">
              More from {vendorName}
            </h2>
            <Link href={`/vendors/${vendorSlug}`} className="text-sm text-blue-600 hover:underline">
              View Shop →
            </Link>
          </div>
          <LazyProductCarousel products={data.vendor} />
        </div>
      )}
    </div>
  )
}
