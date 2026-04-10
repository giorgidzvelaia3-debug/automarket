import Link from "next/link"
import { StarDisplay } from "@/components/store/StarRating"
import WishlistButton from "@/components/store/WishlistButton"
import CompareButton from "@/components/store/CompareButton"
import ProductActions from "./ProductActions"
import MessageVendorButton from "./MessageVendorButton"
import type { FlashSaleInfo } from "@/lib/flashSalePrice"

type Variant = { id: string; name: string; nameEn: string; price: number; stock: number }

type Props = {
  product: {
    id: string
    name: string
    nameEn: string
    price: number
    stock: number
    vendorId: string
    vendor: { name: string; slug: string; description: string | null }
    category: { name: string; nameEn: string; slug: string }
    variants: Variant[]
    images: { url: string }[]
  }
  locale: string
  localized: (locale: string, ka: string | null | undefined, en: string | null | undefined) => string
  slug: string
  userId: string | null
  avgRating: number
  totalReviewCount: number
  wishlisted: boolean
  activeSale: FlashSaleInfo | null
  labels: {
    addToCart: string; added: string; qty: string
    outOfStock: string; inStock: string; error: string
  }
  visitShopLabel: string
}

export default function ProductInfoPanel({
  product, locale, localized, slug, userId, avgRating, totalReviewCount,
  wishlisted, activeSale, labels, visitShopLabel,
}: Props) {
  return (
    <div>
      <div className="bg-white/80 backdrop-blur-xl border border-gray-200/60 shadow-lg rounded-2xl overflow-hidden">
        {/* Header — category + name + rating */}
        <div className="px-5 pt-5 pb-4">
          <Link
            href={`/categories/${product.category.slug}`}
            className="inline-flex items-center rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
          >
            {localized(locale, product.category.name, product.category.nameEn)}
          </Link>

          <h1 className="mt-3 text-xl font-bold text-gray-900 leading-tight">
            {localized(locale, product.name, product.nameEn)}
          </h1>

          {totalReviewCount > 0 ? (
            <a href="#reviews" className="flex items-center gap-2 mt-2 group">
              <StarDisplay rating={avgRating} size="sm" />
              <span className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors">
                {avgRating.toFixed(1)} ({totalReviewCount})
              </span>
            </a>
          ) : (
            <a href="#reviews" className="text-xs text-gray-400 hover:text-blue-500 transition-colors mt-2 inline-block">
              Be the first to review
            </a>
          )}
        </div>

        {/* Price, stock, variants, add to cart */}
        <div className="px-5 pb-4 border-t border-gray-100 pt-4">
          <ProductActions
            productId={product.id}
            basePrice={product.price}
            baseStock={product.stock}
            flashSale={activeSale}
            variants={product.variants.map((v) => ({
              id: v.id, name: v.name, nameEn: v.nameEn,
              price: Number(v.price), stock: v.stock,
            }))}
            isLoggedIn={!!userId}
            vendorId={product.vendorId}
            vendorName={product.vendor.name}
            vendorSlug={product.vendor.slug}
            productName={product.name}
            productNameEn={product.nameEn}
            productImage={product.images[0]?.url ?? null}
            labels={labels}
          />
        </div>

        {/* Wishlist + Compare */}
        <div className="px-5 pb-4 flex gap-2">
          <div className="flex-1">
            <WishlistButton
              productId={product.id}
              isWishlisted={wishlisted}
              isLoggedIn={!!userId}
              size="md"
            />
          </div>
          <div className="flex-1">
            <CompareButton
              product={{
                id: product.id, slug,
                name: product.name, nameEn: product.nameEn,
                price: product.price,
                image: product.images[0]?.url ?? null,
              }}
            />
          </div>
        </div>

        {/* Vendor */}
        <div className="border-t border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <span className="text-blue-500 text-base font-bold">
                {product.vendor.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-gray-900 truncate">{product.vendor.name}</p>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-green-50 border border-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700 shrink-0">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                  Verified
                </span>
              </div>
              {product.vendor.description && (
                <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{product.vendor.description}</p>
              )}
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Link
              href={`/vendors/${product.vendor.slug}`}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
            >
              {visitShopLabel}
            </Link>
            <MessageVendorButton
              vendorId={product.vendorId}
              productId={product.id}
              isLoggedIn={!!userId}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
