import Link from "next/link"
import LazyProductCarousel from "@/components/store/LazyProductCarousel"
import type { FlashSaleInfo } from "@/lib/flashSalePrice"
import { getWishlistIds } from "@/lib/actions/wishlist"
import { toProductCardProps } from "@/lib/productCard"

type CarouselProduct = {
  id: string
  slug: string
  name: string
  nameEn: string
  price: unknown
  stock: number
  createdAt: Date
  vendorId: string
  images: { url: string }[]
  category: { nameEn: string; name: string }
  vendor: { name: string; slug: string }
  reviews: { rating: number }[]
  variants?: { id: string; name: string; nameEn: string; price: unknown; stock: number }[]
}

export default async function ProductCarousels({
  similarProducts,
  vendorProducts,
  categorySlug,
  vendorName,
  vendorSlug,
  locale,
  localized,
  flashSaleMap,
}: {
  similarProducts: CarouselProduct[]
  vendorProducts: CarouselProduct[]
  categorySlug: string
  vendorName: string
  vendorSlug: string
  locale: string
  localized: (locale: string, ka: string | null | undefined, en: string | null | undefined) => string
  flashSaleMap: Map<string, FlashSaleInfo>
}) {
  const wishlistIds = await getWishlistIds()
  void localized

  return (
    <>
      {similarProducts.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Similar Products</h2>
            <Link href={`/categories/${categorySlug}`} className="text-sm text-blue-600 hover:underline">
              View All →
            </Link>
          </div>
          <LazyProductCarousel
            products={similarProducts.map((product) =>
              toProductCardProps(product, {
                locale,
                flashSale: flashSaleMap.get(product.id) ?? null,
                isWishlisted: wishlistIds.has(product.id),
              })
            )}
          />
        </div>
      )}

      {vendorProducts.length > 0 && (
        <div className="mt-12 mb-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">
              More from {vendorName}
            </h2>
            <Link href={`/vendors/${vendorSlug}`} className="text-sm text-blue-600 hover:underline">
              View Shop →
            </Link>
          </div>
          <LazyProductCarousel
            products={vendorProducts.map((product) =>
              toProductCardProps(product, {
                locale,
                flashSale: flashSaleMap.get(product.id) ?? null,
                isWishlisted: wishlistIds.has(product.id),
              })
            )}
          />
        </div>
      )}
    </>
  )
}
