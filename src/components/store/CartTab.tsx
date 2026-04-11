"use client"

import Image from "next/image"
import { localized } from "@/lib/localeName"
import { optimizeImageUrl } from "@/lib/imageUtils"
import type { useTranslations } from "next-intl"

export type CartItem = {
  id: string
  productId: string
  variantId?: string | null
  slug: string
  name: string
  nameEn: string
  image: string | null
  price: number
  quantity: number
  stock: number
  variantName?: string | null
  variantNameEn?: string | null
  vendorName: string
}

export default function CartTab({
  items,
  loading,
  isPending,
  locale,
  shippingProgress,
  awayFromFree,
  onRemove,
  onQuantity,
  onClose,
  t,
}: {
  items: CartItem[]
  loading: boolean
  isPending: boolean
  locale: string
  shippingProgress: number
  awayFromFree: number
  onRemove: (item: CartItem) => void
  onQuantity: (item: CartItem, delta: number) => void
  onClose: () => void
  t: ReturnType<typeof useTranslations<"Cart">>
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <svg className="w-16 h-16 text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.836l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.273M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
        <p className="text-sm font-medium text-gray-900 mb-1">{t("empty")}</p>
        <p className="text-xs text-gray-400 mb-5">{t("emptyHint")}</p>
        <button
          onClick={onClose}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2"
        >
          {t("continueShopping")}
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Free shipping progress */}
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
        {awayFromFree > 0 ? (
          <p className="text-xs text-gray-600 text-center mb-2">
            {t("freeShippingAway", { amount: `₾${awayFromFree.toFixed(0)}` })}
          </p>
        ) : (
          <p className="text-xs text-green-600 font-medium text-center mb-2">
            {t("freeShippingReached")}
          </p>
        )}
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${shippingProgress}%` }}
          />
        </div>
      </div>

      {/* Cart items */}
      <div className="divide-y divide-gray-100">
        {items.map((item) => (
          <div key={item.id} className={`px-5 py-4 flex gap-3 ${isPending ? "opacity-60" : ""}`}>
            {/* Image */}
            <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0 relative">
              {item.image ? (
                <Image src={optimizeImageUrl(item.image, 80)} alt="" fill sizes="64px" className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-gray-300 text-lg">□</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {localized(locale, item.name, item.nameEn)}
                  </p>
                  {item.variantName && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {localized(locale, item.variantName, item.variantNameEn ?? null)}
                    </p>
                  )}
                  <p className="text-[11px] text-gray-400">{item.vendorName}</p>
                </div>
                <button
                  onClick={() => onRemove(item)}
                  className="p-1 text-gray-300 hover:text-red-500 transition-colors shrink-0"
                  aria-label="Remove"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center justify-between mt-2">
                {/* Quantity controls */}
                <div className="flex items-center rounded-md border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => onQuantity(item, -1)}
                    disabled={item.quantity <= 1}
                    className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                  >
                    −
                  </button>
                  <span className="px-2.5 py-1 text-xs font-medium text-gray-900 min-w-[1.75rem] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onQuantity(item, 1)}
                    disabled={item.quantity >= item.stock}
                    className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  ₾{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Continue Shopping */}
      <div className="px-5 py-4 text-center border-t border-gray-100">
        <button
          onClick={onClose}
          className="text-xs font-semibold text-gray-600 hover:text-gray-900 uppercase tracking-wide underline underline-offset-4 decoration-gray-300"
        >
          {t("continueShopping")}
        </button>
      </div>
    </div>
  )
}
