"use client"

import { useRef, useState, useCallback } from "react"
import ProductCard, { type ProductCardProps } from "./ProductCard"
import LazyProductCard from "./LazyProductCard"
import ProductCardSkeleton from "./ProductCardSkeleton"

export default function LazyProductCarousel({
  products,
}: {
  products: ProductCardProps[]
}) {
  if (products.length === 0) return null

  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  function scroll(dir: "left" | "right") {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.querySelector<HTMLElement>("[data-card]")?.offsetWidth ?? 260
    const distance = cardWidth + 16 // card width + gap
    el.scrollBy({ left: dir === "left" ? -distance * 2 : distance * 2, behavior: "smooth" })
  }

  return (
    <div className="relative group/carousel">
      {/* Left arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-30 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 hover:shadow-xl transition-all opacity-0 group-hover/carousel:opacity-100"
          aria-label="Scroll left"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      )}

      {/* Right arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-30 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 hover:shadow-xl transition-all opacity-0 group-hover/carousel:opacity-100"
          aria-label="Scroll right"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      )}

      {/* Scroll container */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none"
      >
        {products.map((product, i) => (
          <div
            key={product.productId}
            data-card
            className="shrink-0 w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)]"
          >
            {i < 4 ? (
              <ProductCard {...product} priority={i < 2} />
            ) : (
              <LazyProductCard {...product} />
            )}
          </div>
        ))}
      </div>

      {/* Fade edges */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-1 w-8 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none z-10 hidden sm:block" />
      )}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none z-10 hidden sm:block" />
      )}
    </div>
  )
}

export function ProductCarouselSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-hidden -mx-4 px-4 sm:mx-0 sm:px-0">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="shrink-0 w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)]"
        >
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  )
}
