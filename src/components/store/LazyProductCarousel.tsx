"use client"

import ProductCard, { type ProductCardProps } from "./ProductCard"
import LazyProductCard from "./LazyProductCard"
import ProductCardSkeleton from "./ProductCardSkeleton"

export default function LazyProductCarousel({
  products,
}: {
  products: ProductCardProps[]
}) {
  if (products.length === 0) return null

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory">
      {products.map((product, i) => (
        <div
          key={product.productId}
          className="shrink-0 min-w-[160px] w-44 sm:w-52 snap-start overflow-visible"
        >
          {i < 2 ? (
            <ProductCard {...product} priority={i === 0} />
          ) : (
            <LazyProductCard {...product} />
          )}
        </div>
      ))}
    </div>
  )
}

export function ProductCarouselSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="shrink-0 min-w-[160px] w-44 sm:w-52">
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  )
}
