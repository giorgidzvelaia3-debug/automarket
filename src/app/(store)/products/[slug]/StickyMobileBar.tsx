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
        setTimeout(() => setStatus("idle"), 2500)
      } catch {
        setStatus("error")
        setTimeout(() => setStatus("idle"), 2500)
      }
    }
  }

  const showStrikethrough = hasFlash && originalPrice > price

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-3 max-w-lg mx-auto">
        {/* Price section */}
        <div className="shrink-0">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-lg font-bold ${hasFlash ? "text-red-600" : "text-gray-900"}`}>
              ₾{price.toFixed(2)}
            </span>
            {showStrikethrough && (
              <span className="text-xs text-gray-400 line-through">
                ₾{originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Add to Cart button */}
        <button
          type="button"
          onClick={handleAdd}
          disabled={isPending}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
            status === "success"
              ? "bg-green-600 text-white"
              : status === "error"
                ? "bg-red-600 text-white"
                : "bg-blue-600 text-white active:bg-blue-700"
          } disabled:opacity-60`}
        >
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
