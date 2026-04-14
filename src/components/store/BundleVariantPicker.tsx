"use client"

import { useState } from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { localized } from "@/lib/localeName"
import { optimizeImageUrl } from "@/lib/imageUtils"

type BundleVariant = { id: string; name: string; nameEn: string; price: number; stock: number }

type BundleProduct = {
  id: string
  name: string
  nameEn: string
  price: number
  stock: number
  slug: string
  image: string | null
  vendorId: string
  vendorName: string
  vendorSlug: string
  variants?: BundleVariant[]
}

type FlashSale = {
  salePrice: number
  originalPrice: number
  discountType: "PERCENTAGE" | "FIXED"
  discountValue: number
  endTime: string
}

function applyFlashDiscount(price: number, sale: FlashSale | null | undefined): number {
  if (!sale) return price
  if (sale.discountType === "PERCENTAGE") {
    return Math.max(0, Math.round(price * (1 - sale.discountValue / 100) * 100) / 100)
  }
  return Math.max(0, Math.round((price - sale.discountValue) * 100) / 100)
}

export { type BundleProduct, type BundleVariant, type FlashSale, applyFlashDiscount }

export default function BundleVariantPicker({
  product,
  discountPercent,
  flashSale,
  remaining,
  locale,
  onSelect,
  onCancel,
}: {
  product: BundleProduct
  discountPercent: number
  flashSale?: FlashSale | null
  remaining: number
  locale: string
  onSelect: (variantId: string) => void
  onCancel: () => void
}) {
  const t = useTranslations("Product")
  const [selectedId, setSelectedId] = useState<string | null>(
    product.variants?.find((v) => v.stock > 0)?.id ?? product.variants?.[0]?.id ?? null
  )

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden z-10">
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">{t("bundleChooseVariant")}</h3>
            <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {remaining > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">{remaining} {t("bundleMoreToSelect")}</p>
          )}
        </div>

        {/* Product info */}
        <div className="px-5 pb-3 flex items-center gap-3">
          <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0 relative">
            {product.image ? (
              <Image src={optimizeImageUrl(product.image, 100)} alt="" fill sizes="56px" className="object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-300">□</div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {localized(locale, product.name, product.nameEn)}
            </p>
            {discountPercent > 0 && (
              <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded px-1.5 py-0.5">
                -{discountPercent}%
              </span>
            )}
          </div>
        </div>

        {/* Variants */}
        <div className="px-5 pb-4 space-y-2">
          {product.variants?.map((v) => {
            const isSelected = v.id === selectedId
            const outOfStock = v.stock === 0
            const flashPrice = applyFlashDiscount(v.price, flashSale)
            const price = discountPercent > 0 ? flashPrice * (1 - discountPercent / 100) : flashPrice
            const hasDiscount = price < v.price

            return (
              <button
                key={v.id}
                type="button"
                onClick={() => !outOfStock && setSelectedId(v.id)}
                disabled={outOfStock}
                className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-left border-2 transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : outOfStock
                      ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                      : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                }`}
              >
                <div>
                  <p className={`text-sm font-medium ${outOfStock ? "text-gray-400 line-through" : "text-gray-900"}`}>
                    {localized(locale, v.name, v.nameEn)}
                  </p>
                  {outOfStock && <p className="text-[10px] text-red-500">{t("outOfStock")}</p>}
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${hasDiscount ? "text-red-600" : "text-gray-900"}`}>₾{price.toFixed(2)}</p>
                  {hasDiscount && (
                    <p className="text-[10px] text-gray-400 line-through">₾{v.price.toFixed(2)}</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Confirm */}
        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={() => selectedId && onSelect(selectedId)}
            disabled={!selectedId}
            className="w-full rounded-xl bg-blue-600 text-white py-3 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {remaining > 0 ? t("bundleNextProduct") : t("bundleConfirmAdd")}
          </button>
        </div>
      </div>
    </div>
  )
}
