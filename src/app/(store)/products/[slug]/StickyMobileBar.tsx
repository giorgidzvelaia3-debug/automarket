"use client"

import { useState, useEffect, useTransition } from "react"
import { addToCart } from "@/lib/actions/cart"
import { addToGuestCart } from "@/lib/guestCart"

export default function StickyMobileBar({
  productId,
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
  labels,
}: {
  productId: string
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
  labels: { addToCart: string; added: string; error: string }
}) {
  const [price, setPrice] = useState(basePrice)
  const [originalPrice, setOriginalPrice] = useState(basePrice)
  const [stock, setStock] = useState(baseStock)
  const [hasFlash, setHasFlash] = useState(initialHasFlashSale)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [isPending, startTransition] = useTransition()

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

  if (stock === 0) return null

  function handleAdd() {
    if (isLoggedIn) {
      startTransition(async () => {
        try {
          await addToCart(productId, 1)
          setStatus("success")
          window.dispatchEvent(new Event("cart-change"))
          window.dispatchEvent(new Event("cart-drawer-open"))
          setTimeout(() => setStatus("idle"), 2500)
        } catch {
          setStatus("error")
          setTimeout(() => setStatus("idle"), 2500)
        }
      })
    } else {
      try {
        addToGuestCart({
          productId,
          vendorId,
          vendorName,
          vendorSlug,
          quantity: 1,
          price,
          name,
          nameEn,
          image,
          stock,
        })
        setStatus("success")
        window.dispatchEvent(new Event("guest-cart-change"))
        window.dispatchEvent(new Event("cart-drawer-open"))
        setTimeout(() => setStatus("idle"), 2500)
      } catch {
        setStatus("error")
        setTimeout(() => setStatus("idle"), 2500)
      }
    }
  }

  const showStrikethrough = hasFlash && originalPrice > price

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-gray-200/80 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-3 max-w-lg mx-auto">
        {/* Price */}
        <div className="shrink-0 min-w-[80px]">
          <span className={`text-xl font-bold ${hasFlash ? "text-red-600" : "text-gray-900"}`}>
            ₾{price.toFixed(2)}
          </span>
          {showStrikethrough && (
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-gray-400 line-through">₾{originalPrice.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Add to Cart */}
        <button
          type="button"
          onClick={handleAdd}
          disabled={isPending}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
            status === "success"
              ? "bg-green-600 text-white"
              : status === "error"
                ? "bg-red-600 text-white"
                : "bg-blue-600 text-white active:bg-blue-700"
          } disabled:opacity-60`}
        >
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.836l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.273M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
          {isPending
            ? "…"
            : status === "success"
              ? `✓ ${labels.added}`
              : status === "error"
                ? labels.error
                : labels.addToCart}
        </button>
      </div>
    </div>
  )
}
