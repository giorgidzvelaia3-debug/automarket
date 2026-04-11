"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useLocale } from "next-intl"
import ProductGrid from "@/components/store/ProductGrid"
import { getGuestWishlistProducts } from "@/lib/actions/wishlist"
import { useGuestWishlist } from "@/lib/guestWishlist"
import type { ProductCardProps } from "@/lib/productCard"
import { filterWishlistProductIds } from "@/lib/wishlistUtils"

function haveSameIds(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((productId, index) => productId === right[index])
  )
}

export default function GuestWishlistPage() {
  const locale = useLocale()
  const { items, mounted, replace } = useGuestWishlist()
  const [result, setResult] = useState<{
    key: string
    products: ProductCardProps[]
    error: string | null
  }>({
    key: "",
    products: [],
    error: null,
  })
  const itemsKey = items.join("::")

  useEffect(() => {
    if (!mounted || items.length === 0) return

    let cancelled = false

    getGuestWishlistProducts(items, locale)
      .then((nextProducts) => {
        if (cancelled) return

        setResult({
          key: itemsKey,
          products: nextProducts,
          error: null,
        })

        const validIds = filterWishlistProductIds(
          items,
          nextProducts.map((product) => product.productId)
        )

        if (!haveSameIds(items, validIds)) {
          replace(validIds)
        }
      })
      .catch(() => {
        if (cancelled) return
        setResult({
          key: itemsKey,
          products: [],
          error: "We could not load your wishlist right now.",
        })
      })

    return () => {
      cancelled = true
    }
  }, [items, itemsKey, locale, mounted, replace])

  const products =
    result.key === itemsKey
      ? result.products
      : result.products.filter((product) => items.includes(product.productId))
  const isLoading = mounted && items.length > 0 && result.key !== itemsKey
  const loadError = result.key === itemsKey ? result.error : null
  const itemCount = products.length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Wishlist</h1>
        <p className="mt-1 text-sm text-gray-500">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </p>
      </div>

      {!mounted || isLoading ? (
        <div className="py-20 text-center">
          <p className="text-sm text-gray-500">Loading wishlist...</p>
        </div>
      ) : loadError ? (
        <div className="py-20 text-center">
          <p className="text-sm text-red-500">{loadError}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-4xl mb-4">♡</p>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
          <p className="text-sm text-gray-500 mb-6">
            Save products you love by tapping the heart icon.
          </p>
          <Link
            href="/vendors"
            className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  )
}
