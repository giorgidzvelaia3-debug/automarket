import Link from "next/link"
import LazyProductCarousel from "@/components/store/LazyProductCarousel"
import type { FlashSaleInfo } from "@/lib/flashSalePrice"

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

function mapProducts(
  products: CarouselProduct[],
  localized: (locale: string, ka: string | null | undefined, en: string | null | undefined) => string,
  locale: string,
  flashSaleMap: Map<string, FlashSaleInfo>,
) {
  return products.map((p) => {
    const rc = p.reviews.length
    return {
      productId: p.id,
      slug: p.slug,
      name: p.name,
      nameEn: p.nameEn,
      price: Number(p.price),
      stock: p.stock,
      imageUrl: p.images[0]?.url,
      categoryName: localized(locale, p.category.name, p.category.nameEn),
      vendorName: p.vendor.name,
      vendorSlug: p.vendor.slug,
      vendorId: p.vendorId,
      avgRating: rc > 0 ? p.reviews.reduce((s, r) => s + r.rating, 0) / rc : undefined,
      reviewCount: rc > 0 ? rc : undefined,
      createdAt: p.createdAt.toISOString(),
      variants: p.variants?.map((v) => ({ id: v.id, name: v.name, nameEn: v.nameEn, price: Number(v.price), stock: v.stock })),
      flashSale: flashSaleMap.get(p.id) ?? null,
    }
  })
}

export default function ProductCarousels({
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
          <LazyProductCarousel products={mapProducts(similarProducts, localized, locale, flashSaleMap)} />
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
          <LazyProductCarousel products={mapProducts(vendorProducts, localized, locale, flashSaleMap)} />
        </div>
      )}
    </>
  )
}
