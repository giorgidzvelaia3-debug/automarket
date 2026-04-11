"use client"

import Link from "next/link"
import Image from "next/image"
import { StarDisplay } from "./StarRating"
import WishlistButton from "./WishlistButton"
import CompareButton from "./CompareButton"
import VariantPickerModal from "./VariantPickerModal"
import { addToCart } from "@/lib/actions/cart"
import { addToGuestCart } from "@/lib/guestCart"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/authContext"
import { useLocale } from "next-intl"
import { localized } from "@/lib/localeName"
import { optimizeImageUrl } from "@/lib/imageUtils"
import {
  getProductCardState,
  type ProductCardProps,
} from "@/lib/productCard"

export type { ProductCardProps } from "@/lib/productCard"

export default function ProductCard({
  productId,
  slug,
  name,
  nameEn,
  price,
  stock,
  imageUrl,
  categoryName,
  vendorName,
  vendorSlug,
  vendorId,
  avgRating,
  reviewCount,
  isLoggedIn: isLoggedInProp,
  isWishlisted,
  wishlist,
  variants,
  flashSale,
  priority = false,
  isNew = false,
}: ProductCardProps) {
  const auth = useAuth()
  const isLoggedIn = isLoggedInProp ?? auth.isLoggedIn
  const router = useRouter()
  const locale = useLocale()
  const displayName = localized(locale, name, nameEn)
  const [cartStatus, setCartStatus] = useState<"idle" | "success">("idle")
  const [isPending, startTransition] = useTransition()
  const [showVariantModal, setShowVariantModal] = useState(false)
  const optimizedImage = imageUrl ? optimizeImageUrl(imageUrl, 400) : null
  const {
    hasVariants,
    variantCount,
    outOfStock,
    displayPrice,
    originalDisplayPrice,
    isDiscounted,
    discountBadge,
  } = getProductCardState({
    price,
    stock,
    variants,
    flashSale,
  })
  const canGuestAddToCart = Boolean(vendorId && vendorName && vendorSlug)

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (hasVariants) {
      if (outOfStock) return
      if (!isLoggedIn && !canGuestAddToCart) {
        router.push(`/products/${slug}`)
        return
      }
      setShowVariantModal(true)
      return
    }

    if (outOfStock) return

    if (!isLoggedIn && !canGuestAddToCart) {
      router.push(`/products/${slug}`)
      return
    }

    if (isLoggedIn) {
      startTransition(async () => {
        try {
          await addToCart(productId, 1)
          setCartStatus("success")
          window.dispatchEvent(new Event("cart-change"))
          window.dispatchEvent(new Event("cart-drawer-open"))
          setTimeout(() => setCartStatus("idle"), 2000)
        } catch { /* ignore */ }
      })
    } else {
      addToGuestCart({
        productId,
        vendorId: vendorId ?? "",
        vendorName: vendorName ?? "",
        vendorSlug: vendorSlug ?? "",
        quantity: 1,
        price: displayPrice,
        name,
        nameEn,
        image: imageUrl ?? null,
        stock: stock ?? 0,
      })
      window.dispatchEvent(new Event("guest-cart-change"))
      window.dispatchEvent(new Event("cart-drawer-open"))
      setCartStatus("success")
      setTimeout(() => setCartStatus("idle"), 2000)
    }
  }

  function handleVariantSuccess() {
    setShowVariantModal(false)
    setCartStatus("success")
    setTimeout(() => setCartStatus("idle"), 2000)
  }

  return (
    <>
      <div className="group relative rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-md transition-all">
        {/* Clickable card link */}
        <Link href={`/products/${slug}`} className="absolute inset-0 z-10" aria-label={displayName} />

        {/* Image — 4:3 aspect ratio */}
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden rounded-t-xl">
          {optimizedImage ? (
            <Image
              src={optimizedImage}
              alt={displayName}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-110"
              priority={priority}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-gray-300 text-4xl">□</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 pointer-events-none">
            {flashSale && discountBadge && (
              <span className="inline-flex items-center rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                ⚡ {discountBadge}
              </span>
            )}
            {isNew && !flashSale && (
              <span className="inline-flex items-center rounded-md bg-green-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                NEW
              </span>
            )}
            {outOfStock && (
              <span className="inline-flex items-center rounded-md bg-gray-800/80 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">
                Out of Stock
              </span>
            )}
            {hasVariants && (
              <span className="inline-flex items-center rounded-md bg-blue-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-sm">
                {variantCount} variants
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="absolute top-2 right-2 z-20 flex flex-col gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="pointer-events-auto">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isPending || outOfStock || (!isLoggedIn && !canGuestAddToCart)}
              className={`w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-sm border border-gray-200/60 shadow-sm transition-all disabled:opacity-40 ${
                cartStatus === "success"
                  ? "bg-green-500 text-white"
                  : "bg-white/90 text-gray-600 hover:bg-blue-600 hover:text-white hover:border-blue-600"
              }`}
              aria-label="Add to cart"
            >
              {cartStatus === "success" ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.836l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.273M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
              )}
            </button>
          </div>
          <div className="pointer-events-auto">
            <WishlistButton
              productId={productId}
              isWishlisted={isWishlisted ?? wishlist?.isWishlisted ?? false}
              isLoggedIn={isLoggedIn}
              size="sm"
            />
          </div>
          <div className="pointer-events-auto">
            <CompareButton
              product={{ id: productId, slug, name, nameEn, price, image: imageUrl ?? null }}
              iconOnly
            />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 p-3 pointer-events-none">
          <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
            {displayName}
          </p>

          {categoryName && (
            <p className="mt-1 text-[11px] text-blue-500">{categoryName}</p>
          )}

          {avgRating !== undefined && reviewCount !== undefined && reviewCount > 0 && (
            <div className="mt-1">
              <StarDisplay rating={avgRating} count={reviewCount} size="sm" />
            </div>
          )}

          <div className="mt-1.5 flex items-end justify-between gap-2">
            <div className="flex items-baseline gap-1.5 min-w-0">
              {hasVariants && <span className="text-[10px] text-gray-400">from</span>}
              <p className={`text-sm font-bold ${isDiscounted ? "text-red-600" : "text-gray-900"}`}>
                ₾{displayPrice.toFixed(2)}
              </p>
              {isDiscounted && (
                <p className="text-[10px] text-gray-400 line-through">₾{originalDisplayPrice.toFixed(2)}</p>
              )}
            </div>
            {vendorName && vendorSlug ? (
              <span
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  router.push(`/vendors/${vendorSlug}`)
                }}
                className="text-[11px] text-gray-400 hover:text-blue-600 transition-colors truncate cursor-pointer pointer-events-auto"
              >
                {vendorName}
              </span>
            ) : vendorName ? (
              <span className="text-[11px] text-gray-400 truncate">{vendorName}</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Variant picker modal */}
      {showVariantModal && hasVariants && (
        <VariantPickerModal
          productId={productId}
          productName={name}
          productNameEn={nameEn}
          productImage={imageUrl ?? null}
          variants={variants ?? []}
          isLoggedIn={isLoggedIn}
          vendorId={vendorId ?? ""}
          vendorName={vendorName ?? ""}
          vendorSlug={vendorSlug ?? ""}
          flashSale={flashSale}
          onClose={() => setShowVariantModal(false)}
          onSuccess={handleVariantSuccess}
        />
      )}
    </>
  )
}
