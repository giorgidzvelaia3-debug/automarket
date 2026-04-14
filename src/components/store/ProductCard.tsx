"use client"

import Link from "next/link"
import Image from "next/image"
import { StarDisplay } from "./StarRating"
import WishlistButton from "./WishlistButton"
import CompareButton from "./CompareButton"
import VariantPickerModal from "./VariantPickerModal"
import { useAddToCart } from "@/lib/useAddToCart"
import { useState, useCallback, useMemo, useRef, memo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/authContext"
import { useLocale, useTranslations } from "next-intl"
import { localized } from "@/lib/localeName"
import { optimizeImageUrl } from "@/lib/imageUtils"
import {
  getProductCardState,
  type ProductCardProps,
} from "@/lib/productCard"

export type { ProductCardProps } from "@/lib/productCard"

export default memo(function ProductCard({
  productId,
  slug,
  name,
  nameEn,
  price,
  stock,
  imageUrl,
  images: imagesProp,
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
  const t = useTranslations("ProductCard")
  const displayName = localized(locale, name, nameEn)
  const [showVariantModal, setShowVariantModal] = useState(false)
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [hovered, setHovered] = useState(false)
  const cachedRect = useRef<DOMRect | null>(null)
  const { add, status: cartStatus, isPending } = useAddToCart(isLoggedIn, { timeout: 2000 })

  const galleryImages = useMemo(
    () => (imagesProp && imagesProp.length > 0 ? imagesProp : imageUrl ? [imageUrl] : [])
      .map((url) => optimizeImageUrl(url, 400)),
    [imagesProp, imageUrl]
  )
  const hasGallery = galleryImages.length > 1

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasGallery) return
    cachedRect.current = e.currentTarget.getBoundingClientRect()
    setHovered(true)
  }, [hasGallery])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasGallery || !cachedRect.current) return
    const x = e.clientX - cachedRect.current.left
    const idx = Math.min(Math.floor((x / cachedRect.current.width) * galleryImages.length), galleryImages.length - 1)
    setActiveImageIdx(idx)
  }, [hasGallery, galleryImages.length])

  const handleMouseLeave = useCallback(() => {
    setActiveImageIdx(0)
    cachedRect.current = null
  }, [])
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
      setShowVariantModal(true)
      return
    }

    if (outOfStock) return

    if (!isLoggedIn && !canGuestAddToCart) {
      router.push(`/products/${slug}`)
      return
    }

    add({
      productId,
      guest: {
        vendorId: vendorId ?? "",
        vendorName: vendorName ?? "",
        vendorSlug: vendorSlug ?? "",
        price: displayPrice,
        name,
        nameEn,
        image: imageUrl ?? null,
        stock: stock ?? 0,
      },
    })
  }

  const formattedPrice = displayPrice % 1 === 0
    ? `₾${displayPrice.toFixed(0)}`
    : `₾${displayPrice.toFixed(2)}`

  const formattedOriginalPrice = originalDisplayPrice % 1 === 0
    ? `₾${originalDisplayPrice.toFixed(0)}`
    : `₾${originalDisplayPrice.toFixed(2)}`

  return (
    <>
      <div className="group relative flex flex-col h-full rounded-2xl border border-gray-200 bg-white hover:shadow-lg transition-shadow duration-300">
        {/* Clickable card link */}
        <Link href={`/products/${slug}`} className="absolute inset-0 z-10" aria-label={displayName} />

        {/* Image with hover gallery */}
        <div
          className="relative aspect-[4/3] bg-gray-50 overflow-hidden rounded-t-2xl z-20 cursor-pointer"
          onMouseEnter={hasGallery ? handleMouseEnter : undefined}
          onMouseMove={hasGallery ? handleMouseMove : undefined}
          onMouseLeave={hasGallery ? handleMouseLeave : undefined}
          onClick={() => router.push(`/products/${slug}`)}
        >
          {galleryImages.length > 0 ? (
            <>
              {/* First image — always loaded */}
              <Image
                src={galleryImages[0]}
                alt={displayName}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className={`object-cover transition-opacity duration-200 ease-out ${
                  activeImageIdx === 0 ? "opacity-100" : "opacity-0"
                }`}
                priority={priority}
              />
              {/* Other images — only mount after first hover */}
              {hovered && galleryImages.slice(1).map((src, i) => (
                <Image
                  key={src}
                  src={src}
                  alt={`${displayName} ${i + 2}`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className={`object-cover transition-opacity duration-200 ease-out ${
                    i + 1 === activeImageIdx ? "opacity-100" : "opacity-0"
                  }`}
                  loading="lazy"
                />
              ))}

              {/* Gallery indicator lines */}
              {hasGallery && (
                <div className="absolute bottom-0 left-0 right-0 z-10 flex gap-1 px-2 pb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {galleryImages.map((_, i) => (
                    <div
                      key={i}
                      className={`h-[3px] flex-1 rounded-full transition-colors duration-150 ${
                        i === activeImageIdx ? "bg-white" : "bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full" aria-hidden>
              <svg className="w-12 h-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
          )}

          {/* Badges — pill shape */}
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5 pointer-events-none">
            {flashSale && discountBadge && (
              <span className="inline-flex items-center rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white shadow">
                {discountBadge}
              </span>
            )}
            {isNew && !flashSale && (
              <span className="inline-flex items-center rounded-full bg-green-500 px-2.5 py-1 text-[11px] font-bold text-white shadow">
                NEW
              </span>
            )}
          </div>

          {/* Hover action buttons — Compare + Wishlist */}
          <div className="absolute top-2.5 right-2.5 z-20 flex flex-col gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="pointer-events-auto">
              <CompareButton
                product={{ id: productId, slug, name, nameEn, price, image: imageUrl ?? null }}
                iconOnly
              />
            </div>
            <div className="pointer-events-auto">
              <WishlistButton
                productId={productId}
                isWishlisted={isWishlisted ?? wishlist?.isWishlisted ?? false}
                isLoggedIn={isLoggedIn}
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col flex-1 p-4 pointer-events-none">
          {/* Top info — grows to fill space */}
          <div className="flex-1">
            <p className="text-[11px] text-gray-400 mb-1 min-h-[16px]">{categoryName ?? "\u00A0"}</p>

            <p className="text-sm font-semibold text-gray-900 truncate group-hover:whitespace-normal group-hover:line-clamp-2 group-hover:text-blue-600 transition-colors">
              {displayName}
            </p>

            <div className="mt-1.5 h-[18px]">
              {avgRating !== undefined && reviewCount !== undefined && reviewCount > 0 ? (
                <StarDisplay rating={avgRating} count={reviewCount} size="sm" />
              ) : null}
            </div>

            {/* Stock status */}
            <div className="mt-1.5">
              {outOfStock ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-red-500 font-medium">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {t("outOfStock")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-green-600 font-medium">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {t("inStock")}
                </span>
              )}
            </div>

            {/* Price */}
            <div className="mt-2 flex items-baseline gap-1">
              {hasVariants && <span className="text-[11px] text-gray-400 mr-0.5">{t("from")}</span>}
              <p className={`text-[15px] font-bold ${isDiscounted ? "text-red-600" : "text-blue-600"}`}>
                {formattedPrice}
              </p>
              {isDiscounted && (
                <p className="text-[11px] text-gray-400 line-through ml-0.5">{formattedOriginalPrice}</p>
              )}
            </div>
          </div>

          {/* Add to Cart / Select Options button — always at bottom */}
          <div className="mt-3 pointer-events-auto">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isPending || outOfStock}
              className={`w-full py-2 px-4 rounded-lg text-[13px] font-semibold transition-all duration-200 disabled:cursor-not-allowed ${
                cartStatus === "success"
                  ? "bg-green-500 text-white"
                  : outOfStock
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
              }`}
            >
              {cartStatus === "success" ? (
                <span className="inline-flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {t("added")}
                </span>
              ) : hasVariants ? (
                t("selectOptions")
              ) : outOfStock ? (
                t("outOfStock")
              ) : (
                t("addToCart")
              )}
            </button>
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
          onSuccess={() => setShowVariantModal(false)}
        />
      )}
    </>
  )
})
