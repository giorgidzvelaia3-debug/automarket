"use client"

import { useState, useEffect, useTransition } from "react"
import { addToCart } from "@/lib/actions/cart"
import { addToGuestCart } from "@/lib/guestCart"
import { applyDiscount, type FlashSaleInfo } from "@/lib/flashSalePrice"

export type VariantOption = {
  id: string
  name: string
  nameEn: string
  price: number
  stock: number
}

export default function VariantPickerModal({
  productId,
  productName,
  productNameEn,
  productImage,
  variants,
  isLoggedIn,
  vendorId,
  vendorName,
  vendorSlug,
  flashSale,
  onClose,
  onSuccess,
}: {
  productId: string
  productName: string
  productNameEn: string
  productImage: string | null
  variants: VariantOption[]
  isLoggedIn: boolean
  vendorId: string
  vendorName: string
  vendorSlug: string
  flashSale?: FlashSaleInfo | null
  onClose: () => void
  onSuccess: () => void
}) {
  const defaultIdx = variants.findIndex((v) => v.stock > 0)
  const [selectedId, setSelectedId] = useState(
    variants[defaultIdx >= 0 ? defaultIdx : 0]?.id ?? ""
  )
  const [isPending, startTransition] = useTransition()

  const selected = variants.find((v) => v.id === selectedId)

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [onClose])

  function handleAdd() {
    if (!selected || selected.stock === 0) return

    if (isLoggedIn) {
      startTransition(async () => {
        try {
          await addToCart(productId, 1, selected.id)
          window.dispatchEvent(new Event("cart-change"))
          window.dispatchEvent(new Event("cart-drawer-open"))
          onSuccess()
        } catch { /* ignore */ }
      })
    } else {
      addToGuestCart({
        productId,
        vendorId,
        vendorName,
        vendorSlug,
        quantity: 1,
        price: flashSale ? applyDiscount(selected.price, flashSale.discountType, flashSale.discountValue) : selected.price,
        name: productName,
        nameEn: `${productNameEn} — ${selected.nameEn}`,
        image: productImage,
        stock: selected.stock,
      })
      window.dispatchEvent(new Event("guest-cart-change"))
      window.dispatchEvent(new Event("cart-drawer-open"))
      onSuccess()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Product header */}
        <div className="flex items-center gap-3">
          {productImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={productImage}
              alt={productNameEn}
              className="w-14 h-14 rounded-lg object-cover bg-gray-100"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
              <span className="text-gray-300 text-xl">□</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{productName}</p>
            <p className="text-xs text-gray-400 truncate">{productNameEn}</p>
          </div>
        </div>

        {/* Variant selector */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Choose variant
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const isActive = v.id === selectedId
              const isOos = v.stock === 0
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => !isOos && setSelectedId(v.id)}
                  disabled={isOos}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition-all min-h-[44px] ${
                    isActive
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                      : isOos
                        ? "bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed line-through"
                        : "bg-white border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  {v.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected variant info */}
        {selected && (() => {
          const salePrice = flashSale ? applyDiscount(selected.price, flashSale.discountType, flashSale.discountValue) : selected.price
          const hasDiscount = salePrice < selected.price
          return (
          <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
            <div>
              <div className="flex items-baseline gap-2">
                <p className={`text-lg font-bold ${hasDiscount ? "text-red-600" : "text-gray-900"}`}>₾{salePrice.toFixed(2)}</p>
                {hasDiscount && <p className="text-sm text-gray-400 line-through">₾{selected.price.toFixed(2)}</p>}
              </div>
              <p className="text-xs text-gray-400">{selected.nameEn}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${selected.stock > 0 ? "bg-green-500" : "bg-red-500"}`} />
              <span className={`text-xs font-medium ${selected.stock > 0 ? "text-green-700" : "text-red-600"}`}>
                {selected.stock > 0 ? `${selected.stock} in stock` : "Out of stock"}
              </span>
            </div>
          </div>
          )
        })()}

        {/* Add to Cart button */}
        <button
          type="button"
          onClick={handleAdd}
          disabled={isPending || !selected || selected.stock === 0}
          className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          {isPending ? "Adding…" : "Add to Cart"}
        </button>
      </div>
    </div>
  )
}
