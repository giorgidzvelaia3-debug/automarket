"use client"

import Link from "next/link"
import { useRef, useState, useEffect } from "react"
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver"
import ProductCard, { type ProductCardProps } from "./ProductCard"
import LazyProductCard from "./LazyProductCard"

function StaggeredCard({ product, index, priority }: { product: ProductCardProps; index: number; priority?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const isVisible = useIntersectionObserver(ref, { rootMargin: "50px", threshold: 0.01 })
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    if (isVisible && !entered) {
      const t = setTimeout(() => setEntered(true), index * 70)
      return () => clearTimeout(t)
    }
  }, [isVisible, entered, index])

  return (
    <div
      ref={ref}
      className="transition-all duration-400 ease-out"
      style={{
        opacity: entered ? 1 : 0,
        transform: entered ? "none" : "translateY(16px)",
      }}
    >
      {isVisible ? (
        <ProductCard {...product} priority={priority} />
      ) : (
        <div className="min-h-[280px]" />
      )}
    </div>
  )
}

export default function ProductGrid({
  products,
  emptyMessage = "No products found.",
  columns = "default",
}: {
  products: ProductCardProps[]
  emptyMessage?: string
  columns?: "default" | "5"
}) {
  if (products.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-400 text-sm">{emptyMessage}</p>
        <Link href="/vendors" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
          Browse Products
        </Link>
      </div>
    )
  }

  const gridCols =
    columns === "5"
      ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {products.map((product, i) => (
        <StaggeredCard
          key={product.productId}
          product={product}
          index={i % (columns === "5" ? 5 : 4)}
          priority={i < 2}
        />
      ))}
    </div>
  )
}
