"use client"

import { useState, useTransition } from "react"
import { addToCart } from "@/lib/actions/cart"
import { addToGuestCart } from "@/lib/guestCart"

export default function AddToCartButton({
  productId,
  variantId,
  stock,
  isLoggedIn,
  vendorId,
  vendorName,
  vendorSlug,
  price,
  name,
  nameEn,
  image,
  labels,
  compact,
}: {
  productId: string
  variantId?: string
  stock: number
  isLoggedIn: boolean
  vendorId?: string
  vendorName?: string
  vendorSlug?: string
  price?: number
  name?: string
  nameEn?: string
  image?: string | null
  labels?: { addToCart: string; added: string; qty: string; outOfStock: string; error: string }
  compact?: boolean
}) {
  const [quantity, setQuantity] = useState(1)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [isPending, startTransition] = useTransition()

  const maxQty = Math.min(stock, 10)

  const l = labels ?? {
    addToCart: "Add to Cart",
    added: "Added",
    qty: "Qty",
    outOfStock: "Out of stock",
    error: "Error — try again",
  }

  if (stock === 0) {
    return (
      <button
        disabled
        className="w-full rounded-lg bg-gray-100 px-5 py-3 text-sm font-semibold text-gray-400 cursor-not-allowed"
      >
        {l.outOfStock}
      </button>
    )
  }

  function handleAdd() {
    if (isLoggedIn) {
      startTransition(async () => {
        try {
          await addToCart(productId, quantity, variantId)
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
          vendorId: vendorId ?? "",
          vendorName: vendorName ?? "",
          vendorSlug: vendorSlug ?? "",
          quantity,
          price: price ?? 0,
          name: name ?? "",
          nameEn: nameEn ?? "",
          image: image ?? null,
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

  return (
    <div className={compact ? "flex items-center gap-3" : "space-y-3"}>
      {/* Quantity selector */}
      <div className={`flex items-center ${compact ? "" : "gap-3"}`}>
        {!compact && <span className="text-sm text-gray-600">{l.qty}</span>}
        <div className="flex items-center rounded-lg border border-gray-300 overflow-hidden">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className={`${compact ? "px-2 py-1" : "px-3 py-1.5"} text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors`}
          >
            −
          </button>
          <span className={`${compact ? "px-2 py-1 min-w-[2rem]" : "px-4 py-1.5 min-w-[2.5rem]"} text-sm font-medium text-gray-900 text-center`}>
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            disabled={quantity >= maxQty}
            className={`${compact ? "px-2 py-1" : "px-3 py-1.5"} text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors`}
          >
            +
          </button>
        </div>
      </div>

      {/* Add button */}
      <button
        type="button"
        onClick={handleAdd}
        disabled={isPending}
        className={`${compact ? "flex-1" : "w-full"} rounded-lg px-5 py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          status === "success"
            ? "bg-green-600 text-white focus:ring-green-500"
            : status === "error"
              ? "bg-red-600 text-white focus:ring-red-500"
              : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
        } disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {isPending
          ? "…"
          : status === "success"
            ? `✓ ${l.added}`
            : status === "error"
              ? l.error
              : l.addToCart}
      </button>
    </div>
  )
}
