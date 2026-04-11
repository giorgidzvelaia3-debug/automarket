"use client"

import { useState, useTransition } from "react"
import { addToCart } from "@/lib/actions/cart"
import { addToGuestCart } from "@/lib/guestCart"

export default function AddToCartButton({
  productId,
  variantId,
  variantName,
  variantNameEn,
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
}: {
  productId: string
  variantId?: string
  variantName?: string
  variantNameEn?: string
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
          variantId: variantId ?? null,
          variantName: variantName ?? null,
          variantNameEn: variantNameEn ?? null,
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
        window.dispatchEvent(new Event("cart-drawer-open"))
        setTimeout(() => setStatus("idle"), 2500)
      } catch {
        setStatus("error")
        setTimeout(() => setStatus("idle"), 2500)
      }
    }
  }

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      {/* Quantity selector — compact */}
      <div className="flex items-center rounded-lg border border-gray-300 overflow-hidden shrink-0">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          disabled={quantity <= 1}
          className="px-2.5 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors text-sm"
        >
          −
        </button>
        <span className="px-3 py-2 text-sm font-medium text-gray-900 text-center min-w-[2rem]">
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
          disabled={quantity >= maxQty}
          className="px-2.5 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors text-sm"
        >
          +
        </button>
      </div>

      {/* Add to Cart button */}
      <button
        type="button"
        onClick={handleAdd}
        disabled={isPending}
        className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          status === "success"
            ? "bg-green-600 text-white focus:ring-green-500"
            : status === "error"
              ? "bg-red-600 text-white focus:ring-red-500"
              : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
        } disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {/* Cart icon */}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.836l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.273M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
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
