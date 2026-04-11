"use client"

import { useState, useEffect, useTransition, useOptimistic } from "react"
import { useRouter } from "next/navigation"
import { toggleWishlist } from "@/lib/actions/wishlist"
import { useAuth } from "@/lib/authContext"
import { useAddToCart } from "@/lib/useAddToCart"
import { useGuestWishlist } from "@/lib/guestWishlist"
import { useCompare, type CompareProduct } from "@/lib/compareContext"
import VariantPickerModal, { type VariantOption } from "@/components/store/VariantPickerModal"
import type { FlashSaleInfo } from "@/lib/flashSalePrice"

export default function StickyMobileBar({
  productId,
  slug,
  basePrice,
  baseStock,
  isLoggedIn,
  vendorId,
  vendorName,
  vendorSlug,
  name,
  nameEn,
  image,
  hasFlashSale: initialHasFlashSale,
  isWishlisted,
  variants,
  flashSale,
  labels,
}: {
  productId: string
  slug: string
  basePrice: number
  baseStock: number
  isLoggedIn: boolean
  vendorId: string
  vendorName: string
  vendorSlug: string
  name: string
  nameEn: string
  image: string | null
  hasFlashSale: boolean
  isWishlisted: boolean
  variants: VariantOption[]
  flashSale: FlashSaleInfo | null
  labels: { addToCart: string; added: string; error: string }
}) {
  const hasVariants = variants.length > 0
  const [showVariantPicker, setShowVariantPicker] = useState(false)
  const [price, setPrice] = useState(basePrice)
  const [originalPrice, setOriginalPrice] = useState(basePrice)
  const [stock, setStock] = useState(baseStock)
  const [hasFlash, setHasFlash] = useState(initialHasFlashSale)
  const { add, status, isPending } = useAddToCart(isLoggedIn)
  const [visible, setVisible] = useState(true)

  // Hide sticky bar when mobile product-actions panel is on screen
  useEffect(() => {
    const target = document.getElementById("mobile-product-actions")
    if (!target) return
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    function onUpdate(e: Event) {
      const d = (e as CustomEvent).detail
      setPrice(d.price)
      setOriginalPrice(d.originalPrice)
      setStock(d.stock)
      setHasFlash(d.hasFlashSale)
    }
    window.addEventListener("product-price-update", onUpdate)
    return () => window.removeEventListener("product-price-update", onUpdate)
  }, [])

  function handleAdd() {
    if (hasVariants) {
      setShowVariantPicker(true)
      return
    }
    add({
      productId,
      guest: {
        vendorId,
        vendorName,
        vendorSlug,
        price,
        name,
        nameEn,
        image,
        stock,
      },
    })
  }

  const showStrikethrough = hasFlash && originalPrice > price

  // ── Wishlist logic ──
  const authCtx = useAuth()
  const guestWishlist = useGuestWishlist()
  const effectiveLoggedIn = isLoggedIn ?? authCtx.isLoggedIn
  const [authWishlisted, setAuthWishlisted] = useOptimistic(
    isWishlisted,
    (_cur, next: boolean) => next
  )
  const [wishPending, startWishTransition] = useTransition()
  const router = useRouter()

  const wishlisted = effectiveLoggedIn
    ? authWishlisted
    : guestWishlist.mounted
      ? guestWishlist.isWishlisted(productId)
      : isWishlisted

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault()
    if (!effectiveLoggedIn) {
      guestWishlist.toggle(productId)
      return
    }
    const prev = authWishlisted
    setAuthWishlisted(!prev)
    startWishTransition(async () => {
      try {
        const result = await toggleWishlist(productId)
        setAuthWishlisted(result)
        router.refresh()
      } catch {
        setAuthWishlisted(prev)
      }
    })
  }

  // ── Compare logic ──
  const { addToCompare, removeFromCompare, isInCompare, isFull } = useCompare()
  const inCompare = isInCompare(productId)

  function handleCompare(e: React.MouseEvent) {
    e.preventDefault()
    if (inCompare) removeFromCompare(productId)
    else if (!isFull) addToCompare({ id: productId, slug, name, nameEn, price, image } as CompareProduct)
  }

  const btnBase = "flex items-center justify-center rounded-xl border transition-all"

  if (stock === 0) return null

  return (
    <>
    <div className={`fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-gray-200/80 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-transform duration-300 ${visible ? "translate-y-0" : "translate-y-full"}`}>
      <div className="flex items-center gap-2 max-w-lg mx-auto">
        {/* Price */}
        <div className="shrink-0">
          <span className={`text-lg font-bold ${hasFlash ? "text-red-600" : "text-gray-900"}`}>
            ₾{price.toFixed(2)}
          </span>
          {showStrikethrough && (
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-gray-400 line-through">₾{originalPrice.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Wishlist */}
        <button
          type="button"
          onClick={handleWishlist}
          disabled={wishPending || (!effectiveLoggedIn && !guestWishlist.mounted)}
          className={`${btnBase} w-10 h-10 shrink-0 ${
            wishlisted
              ? "border-red-200 bg-red-50 text-red-500"
              : "border-gray-200 bg-white text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50"
          } disabled:opacity-60`}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>

        {/* Compare */}
        <button
          type="button"
          onClick={handleCompare}
          disabled={!inCompare && isFull}
          className={`${btnBase} w-10 h-10 shrink-0 ${
            inCompare
              ? "border-blue-200 bg-blue-50 text-blue-600"
              : "border-gray-200 bg-white text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50"
          } disabled:opacity-40`}
          aria-label={inCompare ? "Remove from compare" : "Compare"}
        >
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
        </button>

        {/* Add to Cart */}
        <button
          type="button"
          onClick={handleAdd}
          disabled={isPending}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
            status === "success"
              ? "bg-green-600 text-white"
              : status === "error"
                ? "bg-red-600 text-white"
                : "bg-blue-600 text-white active:bg-blue-700"
          } disabled:opacity-60`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.836l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.273M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
          <span className="truncate">
            {isPending
              ? "…"
              : status === "success"
                ? `✓ ${labels.added}`
                : status === "error"
                  ? labels.error
                  : labels.addToCart}
          </span>
        </button>
      </div>
    </div>

    {showVariantPicker && (
      <VariantPickerModal
        productId={productId}
        productName={name}
        productNameEn={nameEn}
        productImage={image}
        variants={variants}
        isLoggedIn={isLoggedIn}
        vendorId={vendorId}
        vendorName={vendorName}
        vendorSlug={vendorSlug}
        flashSale={flashSale}
        onClose={() => setShowVariantPicker(false)}
        onSuccess={() => setShowVariantPicker(false)}
      />
    )}
    </>
  )
}
