"use client"

import { useRef, useState, useEffect } from "react"
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
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isVisible) {
      const t = setTimeout(() => setShow(true), 50)
      return () => clearTimeout(t)
    }
  }, [isVisible])

  return (
    <div ref={ref} className="min-h-[280px]">
      {isVisible ? (
        <div className={`transition-opacity duration-300 ease-in-out ${show ? "opacity-100" : "opacity-0"}`}>
          <ProductCard {...props} />
        </div>
      ) : (
        <ProductCardSkeleton />
      )}
    </div>
  )
}
