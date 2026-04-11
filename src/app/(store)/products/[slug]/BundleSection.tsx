"use client"

import { useState, useTransition, useCallback } from "react"
import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import { localized } from "@/lib/localeName"
import { optimizeImageUrl } from "@/lib/imageUtils"
import { addToCart } from "@/lib/actions/cart"
import { addToGuestCart } from "@/lib/guestCart"
import { useAuth } from "@/lib/authContext"
import BundleVariantPicker, {
  type BundleProduct,
  type BundleVariant,
  type FlashSale,
  applyFlashDiscount,
} from "@/components/store/BundleVariantPicker"

type BundleItem = {
  id: string
  discountPercent: number
  bundleProduct: BundleProduct
  flashSale?: FlashSale | null
}

type MainProduct = BundleProduct

// Get lowest variant price or base price, with optional flash sale
function getEffectivePrice(p: { price: number; variants?: BundleVariant[] }, sale?: FlashSale | null): number {
  let base: number
  if (p.variants && p.variants.length > 0) {
    const inStock = p.variants.filter((v) => v.stock > 0)
    const pool = inStock.length > 0 ? inStock : p.variants
    base = Math.min(...pool.map((v) => v.price))
  } else {
    base = p.price
  }
  return applyFlashDiscount(base, sale)
}

function hasVariants(p: { variants?: BundleVariant[] }) {
  return p.variants !== undefined && p.variants.length > 0
}

export default function BundleSection({
  mainProduct,
  mainFlashSale,
  bundles,
}: {
  mainProduct: MainProduct
  mainFlashSale?: FlashSale | null
  bundles: BundleItem[]
}) {
  const locale = useLocale()
  const t = useTranslations("Product")
  const { isLoggedIn } = useAuth()
  const [selected, setSelected] = useState<Set<string>>(new Set(bundles.map((b) => b.id)))
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<"idle" | "success">("idle")

  // Variant picker state
  const [pickerQueue, setPickerQueue] = useState<{ product: BundleProduct; discountPercent: number; flashSale?: FlashSale | null }[]>([])
  const [pickerResults, setPickerResults] = useState<Map<string, string>>(new Map()) // productId → variantId
  const showPicker = pickerQueue.length > 0

  if (bundles.length === 0) return null

  function toggleItem(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedBundles = bundles.filter((b) => selected.has(b.id))

  // Prices
  const mainPrice = getEffectivePrice(mainProduct, mainFlashSale)
  const bundleOriginalTotal = selectedBundles.reduce((s, b) => s + getEffectivePrice(b.bundleProduct, b.flashSale), 0)
  const bundleDiscountedTotal = selectedBundles.reduce(
    (s, b) => s + getEffectivePrice(b.bundleProduct, b.flashSale) * (1 - b.discountPercent / 100), 0
  )
  const totalOriginal = mainPrice + bundleOriginalTotal
  const totalDiscounted = mainPrice + bundleDiscountedTotal
  const saved = totalOriginal - totalDiscounted
  const itemCount = 1 + selectedBundles.length

  // Collect all products that need variant picking
  function startAddAll() {
    const needsPicking: { product: BundleProduct; discountPercent: number; flashSale?: FlashSale | null }[] = []

    if (hasVariants(mainProduct)) {
      needsPicking.push({ product: mainProduct, discountPercent: 0, flashSale: mainFlashSale })
    }
    for (const b of selectedBundles) {
      if (hasVariants(b.bundleProduct)) {
        needsPicking.push({ product: b.bundleProduct, discountPercent: b.discountPercent, flashSale: b.flashSale })
      }
    }

    if (needsPicking.length === 0) {
      // No variants — add directly
      doAddAll(new Map())
    } else {
      setPickerResults(new Map())
      setPickerQueue(needsPicking)
    }
  }

  function onVariantPicked(productId: string, variantId: string) {
    const newResults = new Map(pickerResults)
    newResults.set(productId, variantId)
    setPickerResults(newResults)

    // Remove from queue
    const remaining = pickerQueue.slice(1)
    if (remaining.length === 0) {
      // All picked — add to cart
      setPickerQueue([])
      doAddAll(newResults)
    } else {
      setPickerQueue(remaining)
    }
  }

  function cancelPicker() {
    setPickerQueue([])
    setPickerResults(new Map())
  }

  const doAddAll = useCallback((variantSelections: Map<string, string>) => {
    startTransition(async () => {
      try {
        if (isLoggedIn) {
          try {
            const mainVariantId = variantSelections.get(mainProduct.id)
            await addToCart(mainProduct.id, 1, mainVariantId)
            for (const b of selectedBundles) {
              const vid = variantSelections.get(b.bundleProduct.id)
              await addToCart(b.bundleProduct.id, 1, vid)
            }
            window.dispatchEvent(new Event("cart-change"))
          } catch {
            addGuestItems(variantSelections)
          }
        } else {
          addGuestItems(variantSelections)
        }
        window.dispatchEvent(new Event("cart-drawer-open"))
        setStatus("success")
        setTimeout(() => setStatus("idle"), 2500)
      } catch { /* ignore */ }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, mainProduct, selectedBundles])

  function addGuestItems(variantSelections: Map<string, string>) {
    const mainVid = variantSelections.get(mainProduct.id)
    const mainVariant = mainVid ? mainProduct.variants?.find((v) => v.id === mainVid) : undefined
    addToGuestCart({
      productId: mainProduct.id,
      variantId: mainVid ?? null,
      variantName: mainVariant?.name ?? null,
      variantNameEn: mainVariant?.nameEn ?? null,
      vendorId: mainProduct.vendorId,
      vendorName: mainProduct.vendorName,
      vendorSlug: mainProduct.vendorSlug,
      quantity: 1,
      price: applyFlashDiscount(mainVariant ? mainVariant.price : mainProduct.price, mainFlashSale),
      name: mainProduct.name,
      nameEn: mainProduct.nameEn,
      image: mainProduct.image,
      stock: mainVariant ? mainVariant.stock : mainProduct.stock,
    })
    for (const b of selectedBundles) {
      const vid = variantSelections.get(b.bundleProduct.id)
      const variant = vid ? b.bundleProduct.variants?.find((v) => v.id === vid) : undefined
      const flashPrice = applyFlashDiscount(variant ? variant.price : getEffectivePrice(b.bundleProduct), b.flashSale)
      const discountedPrice = flashPrice * (1 - b.discountPercent / 100)
      addToGuestCart({
        productId: b.bundleProduct.id,
        variantId: vid ?? null,
        variantName: variant?.name ?? null,
        variantNameEn: variant?.nameEn ?? null,
        vendorId: b.bundleProduct.vendorId,
        vendorName: b.bundleProduct.vendorName,
        vendorSlug: b.bundleProduct.vendorSlug,
        quantity: 1,
        price: Math.round(discountedPrice * 100) / 100,
        name: b.bundleProduct.name,
        nameEn: b.bundleProduct.nameEn,
        image: b.bundleProduct.image,
        stock: variant ? variant.stock : b.bundleProduct.stock,
      })
    }
    window.dispatchEvent(new Event("guest-cart-change"))
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-orange-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 px-5 py-3 border-b border-orange-200">
          <h3 className="text-sm font-bold text-orange-800">{t("bundleTitle")}</h3>
        </div>

        <div className="divide-y divide-gray-100">
          {/* Main product */}
          <div className="flex items-center gap-3 px-5 py-3 bg-orange-50/30">
            <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 relative">
              {mainProduct.image ? (
                <Image src={optimizeImageUrl(mainProduct.image, 80)} alt="" fill sizes="48px" className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-300">□</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {localized(locale, mainProduct.name, mainProduct.nameEn)}
              </p>
              <div className="flex items-baseline gap-1.5">
                {hasVariants(mainProduct) && <span className="text-[10px] text-gray-400">from</span>}
                <span className={`text-sm font-bold ${mainFlashSale ? "text-red-600" : "text-gray-900"}`}>₾{mainPrice.toFixed(2)}</span>
                {mainFlashSale && (
                  <span className="text-xs text-gray-400 line-through">₾{getEffectivePrice(mainProduct).toFixed(2)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Bundle items */}
          {bundles.map((b) => {
            const isSelected = selected.has(b.id)
            const ep = getEffectivePrice(b.bundleProduct, b.flashSale)
            const discountedPrice = ep * (1 - b.discountPercent / 100)
            const originalBeforeSale = getEffectivePrice(b.bundleProduct)
            const isVariant = hasVariants(b.bundleProduct)

            return (
              <label
                key={b.id}
                className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${
                  isSelected ? "bg-white" : "bg-gray-50/50 opacity-60"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleItem(b.id)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 w-4 h-4 shrink-0"
                />
                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 relative">
                  {b.bundleProduct.image ? (
                    <Image src={optimizeImageUrl(b.bundleProduct.image, 80)} alt="" fill sizes="48px" className="object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-300">□</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {localized(locale, b.bundleProduct.name, b.bundleProduct.nameEn)}
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    {isVariant && <span className="text-[10px] text-gray-400">from</span>}
                    <span className="text-sm font-bold text-orange-600">₾{discountedPrice.toFixed(2)}</span>
                    {(b.discountPercent > 0 || b.flashSale) && originalBeforeSale > discountedPrice && (
                      <span className="text-xs text-gray-400 line-through">₾{originalBeforeSale.toFixed(2)}</span>
                    )}
                  </div>
                </div>
                {b.discountPercent > 0 && isSelected && (
                  <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded px-1.5 py-0.5 shrink-0">
                    -{b.discountPercent}%
                  </span>
                )}
              </label>
            )
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100/50 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">{t("bundleTotal")} ({itemCount})</span>
            <div className="flex items-baseline gap-2">
              {saved > 0.01 && (
                <span className="text-sm text-gray-400 line-through">₾{totalOriginal.toFixed(2)}</span>
              )}
              <span className="text-lg font-bold text-orange-600">₾{totalDiscounted.toFixed(2)}</span>
            </div>
          </div>
          {saved > 0.01 && (
            <p className="text-xs text-green-600 font-medium mb-3">
              {t("bundleSaved", { amount: `₾${saved.toFixed(2)}` })}
            </p>
          )}
          <button
            type="button"
            onClick={startAddAll}
            disabled={isPending || selectedBundles.length === 0}
            className={`w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
              status === "success"
                ? "bg-green-600 text-white"
                : "bg-orange-600 text-white hover:bg-orange-700"
            } disabled:opacity-50`}
          >
            {isPending ? "…" : status === "success" ? `✓ ${t("bundleAdded")}` : t("bundleAddAll")}
          </button>
        </div>
      </div>

      {/* Variant Picker Modal */}
      {showPicker && (
        <BundleVariantPicker
          product={pickerQueue[0].product}
          discountPercent={pickerQueue[0].discountPercent}
          flashSale={pickerQueue[0].flashSale}
          remaining={pickerQueue.length - 1}
          locale={locale}
          onSelect={(variantId) => onVariantPicked(pickerQueue[0].product.id, variantId)}
          onCancel={cancelPicker}
        />
      )}
    </>
  )
}
