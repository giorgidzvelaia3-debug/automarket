"use client"

import { useRef } from "react"
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver"
import ProductCard, { type ProductCardProps } from "./ProductCard"
import ProductCardSkeleton from "./ProductCardSkeleton"

const OBSERVER_OPTIONS: IntersectionObserverInit = {
  rootMargin: "50px",
  threshold: 0.01,
}

export default function LazyProductCard(props: ProductCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isVisible = useIntersectionObserver(ref, OBSERVER_OPTIONS)

  return (
    <div ref={ref} className="min-h-[280px] h-full">
      {isVisible ? (
        <ProductCard {...props} />
      ) : (
        <ProductCardSkeleton />
      )}
    </div>
  )
}
