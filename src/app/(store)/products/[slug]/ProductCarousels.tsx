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

  const hasSimilar = data ? data.similar.length > 0 : true
  const hasVendor = data ? data.vendor.length > 0 : true

  return (
    <div ref={ref}>
      <div
        className="transition-all duration-500 ease-out"
        style={{
          opacity: entered ? 1 : 0,
          transform: entered ? "none" : "translateY(20px)",
        }}
      >
        {/* Similar Products */}
        {hasSimilar && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Similar Products</h2>
              <Link href={`/categories/${categorySlug}`} className="text-sm text-blue-600 hover:underline">
                View All →
              </Link>
            </div>
            {data ? (
              data.similar.length > 0 && <LazyProductCarousel products={data.similar} />
            ) : (
              <ProductCarouselSkeleton />
            )}
          </div>
        )}

        {/* Vendor Products */}
        {hasVendor && (
          <div className="mt-12 mb-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                More from {vendorName}
              </h2>
              <Link href={`/vendors/${vendorSlug}`} className="text-sm text-blue-600 hover:underline">
                View Shop →
              </Link>
            </div>
            {data ? (
              data.vendor.length > 0 && <LazyProductCarousel products={data.vendor} />
            ) : (
              <ProductCarouselSkeleton />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
