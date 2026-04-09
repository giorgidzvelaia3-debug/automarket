"use client"

import Link from "next/link"
import ProductCard, { type ProductCardProps } from "./ProductCard"
import LazyProductCard from "./LazyProductCard"

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
      {products.map((product, i) =>
        i < 2 ? (
          <ProductCard key={product.productId} {...product} priority />
        ) : (
          <LazyProductCard key={product.productId} {...product} />
        )
      )}
    </div>
  )
}
