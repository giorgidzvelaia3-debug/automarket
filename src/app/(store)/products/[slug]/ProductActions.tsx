"use client"

import { useState, useEffect } from "react"
import AddToCartButton from "@/components/store/AddToCartButton"
import VariantSelector from "./VariantSelector"
import CountdownTimer from "@/components/store/CountdownTimer"
import { applyDiscount, type FlashSaleInfo } from "@/lib/flashSalePrice"

type Variant = {
  id: string
  name: string
  nameEn: string
  price: number
  stock: number
}

type Labels = {
  addToCart: string
  added: string
  qty: string
  outOfStock: string
  inStock: string
  error: string
}

export default function ProductActions({
  productId,
  basePrice,
  baseStock,
  variants,
  flashSale,
  isLoggedIn,
  vendorId,
  vendorName,
  vendorSlug,
  productName,
  productNameEn,
  productImage,
  labels,
}: {
  productId: string
  basePrice: number
  baseStock: number
  variants: Variant[]
  flashSale: FlashSaleInfo | null
  isLoggedIn: boolean
  vendorId: string
  vendorName: string
  vendorSlug: string
  productName: string
  productNameEn: string
  productImage: string | null
  labels: Labels
}) {
  const hasVariants = variants.length > 0
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    hasVariants ? (variants.find((v) => v.stock > 0) ?? variants[0]) : null
  )

  const activeStock = selectedVariant ? selectedVariant.stock : baseStock
  const activeOriginalPrice = selectedVariant ? selectedVariant.price : basePrice

  // Effective price = sale price if flash sale exists
  const activePrice = flashSale
    ? selectedVariant
      ? applyDiscount(selectedVariant.price, flashSale.discountType, flashSale.discountValue)
      : flashSale.salePrice
    : activeOriginalPrice

  // Broadcast active price/stock to the sticky mobile bar
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("product-price-update", {
        detail: { price: activePrice, originalPrice: activeOriginalPrice, stock: activeStock, hasFlashSale: !!flashSale },
      })
    )
  }, [activePrice, activeOriginalPrice, activeStock, flashSale])

  return (
    <div className="space-y-4">
      {/* Flash sale banner — reacts to variant selection */}
      {flashSale && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/60 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-red-600 uppercase tracking-wide flex items-center gap-1">
              ⚡ Flash Sale
            </span>
            <CountdownTimer endTime={flashSale.endTime} size="sm" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-600">₾{activePrice.toFixed(2)}</span>
            <span className="text-sm text-gray-400 line-through">₾{activeOriginalPrice.toFixed(2)}</span>
            <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {flashSale.discountType === "PERCENTAGE"
                ? `-${flashSale.discountValue}%`
                : `-₾${flashSale.discountValue}`}
            </span>
          </div>
        </div>
      )}

      {/* Price — only show when no flash sale (banner above shows the price instead) */}
      {!flashSale && (
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-medium text-gray-500">₾</span>
          <span className="text-3xl font-bold text-gray-900">
            {activePrice.toFixed(2)}
          </span>
        </div>
      )}

      {/* Stock */}
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${activeStock > 0 ? "bg-green-500" : "bg-red-500"}`} />
        <span className={`text-sm font-medium ${activeStock > 0 ? "text-green-700" : "text-red-600"}`}>
          {activeStock > 0 ? labels.inStock.replace("{count}", String(activeStock)) : labels.outOfStock}
        </span>
      </div>

      {/* Variant selector */}
      {hasVariants && (
        <VariantSelector
          variants={variants}
          onSelect={setSelectedVariant}
        />
      )}

      <hr className="border-gray-200" />

      {/* Add to Cart */}
      <AddToCartButton
        productId={productId}
        variantId={selectedVariant?.id}
        stock={activeStock}
        isLoggedIn={isLoggedIn}
        vendorId={vendorId}
        vendorName={vendorName}
        vendorSlug={vendorSlug}
        price={activePrice}
        name={productName}
        nameEn={productNameEn}
        image={productImage}
        labels={labels}
      />
    </div>
  )
}
