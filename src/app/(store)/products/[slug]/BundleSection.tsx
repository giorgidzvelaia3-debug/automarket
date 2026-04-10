"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import { localized } from "@/lib/localeName"
import { optimizeImageUrl } from "@/lib/imageUtils"
import { addToCart } from "@/lib/actions/cart"
import { addToGuestCart } from "@/lib/guestCart"
import { useAuth } from "@/lib/authContext"

type BundleVariant = { id: string; name: string; nameEn: string; price: number; stock: number }

type BundleItem = {
  id: string
  discountPercent: number
  bundleProduct: {
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
}

type MainProduct = {
  id: string
  name: string
  nameEn: string
  price: number
  image: string | null
  vendorId: string
  vendorName: string
  vendorSlug: string
}

export default function BundleSection({
  mainProduct,
  bundles,
}: {
  mainProduct: MainProduct
  bundles: BundleItem[]
}) {
  const locale = useLocale()
  const t = useTranslations("Product")
  const { isLoggedIn } = useAuth()
  const [selected, setSelected] = useState<Set<string>>(new Set(bundles.map((b) => b.id)))
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<"idle" | "success">("idle")

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

  // Get effective price for a bundle product (first in-stock variant or base)
  function getEffectivePrice(bp: BundleItem["bundleProduct"]) {
    if (bp.variants && bp.variants.length > 0) {
      const inStock = bp.variants.find((v) => v.stock > 0)
      return inStock ? inStock.price : bp.variants[0].price
    }
    return bp.price
  }

  function getFirstVariantId(bp: BundleItem["bundleProduct"]): string | undefined {
    if (bp.variants && bp.variants.length > 0) {
      const inStock = bp.variants.find((v) => v.stock > 0)
      return (inStock ?? bp.variants[0]).id
    }
    return undefined
  }

  // Calculate prices
  const mainPrice = mainProduct.price
  const bundleOriginalTotal = selectedBundles.reduce((s, b) => s + getEffectivePrice(b.bundleProduct), 0)
  const bundleDiscountedTotal = selectedBundles.reduce(
    (s, b) => s + getEffectivePrice(b.bundleProduct) * (1 - b.discountPercent / 100),
    0
  )
  const totalOriginal = mainPrice + bundleOriginalTotal
  const totalDiscounted = mainPrice + bundleDiscountedTotal
  const saved = totalOriginal - totalDiscounted
  const itemCount = 1 + selectedBundles.length

  function addGuestItems() {
    addToGuestCart({
      productId: mainProduct.id,
      vendorId: mainProduct.vendorId,
      vendorName: mainProduct.vendorName,
      vendorSlug: mainProduct.vendorSlug,
      quantity: 1,
      price: mainProduct.price,
      name: mainProduct.name,
      nameEn: mainProduct.nameEn,
      image: mainProduct.image,
      stock: 999,
    })
    for (const b of selectedBundles) {
      const ep = getEffectivePrice(b.bundleProduct)
      const discountedPrice = ep * (1 - b.discountPercent / 100)
      addToGuestCart({
        productId: b.bundleProduct.id,
        vendorId: b.bundleProduct.vendorId,
        vendorName: b.bundleProduct.vendorName,
        vendorSlug: b.bundleProduct.vendorSlug,
        quantity: 1,
        price: Math.round(discountedPrice * 100) / 100,
        name: b.bundleProduct.name,
        nameEn: b.bundleProduct.nameEn,
        image: b.bundleProduct.image,
        stock: b.bundleProduct.stock,
      })
    }
    window.dispatchEvent(new Event("guest-cart-change"))
  }

  function handleAddAll() {
    startTransition(async () => {
      try {
        if (isLoggedIn) {
          try {
            await addToCart(mainProduct.id, 1)
            for (const b of selectedBundles) {
              await addToCart(b.bundleProduct.id, 1, getFirstVariantId(b.bundleProduct))
            }
            window.dispatchEvent(new Event("cart-change"))
          } catch {
            // Fallback to guest cart if server action fails
            addGuestItems()
          }
        } else {
          addGuestItems()
        }
        window.dispatchEvent(new Event("cart-drawer-open"))
        setStatus("success")
        setTimeout(() => setStatus("idle"), 2500)
      } catch {
        // ignore
      }
    })
  }

  return (
    <div className="bg-white rounded-xl border border-orange-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 px-5 py-3 border-b border-orange-200">
        <h3 className="text-sm font-bold text-orange-800">{t("bundleTitle")}</h3>
      </div>

      {/* Items */}
      <div className="divide-y divide-gray-100">
        {/* Main product — always included */}
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
            <p className="text-sm font-bold text-gray-900">₾{mainPrice.toFixed(2)}</p>
          </div>
        </div>

        {/* Bundle items with checkboxes */}
        {bundles.map((b) => {
          const isSelected = selected.has(b.id)
          const hasVariants = b.bundleProduct.variants && b.bundleProduct.variants.length > 0
          const originalPrice = getEffectivePrice(b.bundleProduct)
          const discountedPrice = originalPrice * (1 - b.discountPercent / 100)

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
                  {hasVariants && <span className="text-[10px] text-gray-400">from</span>}
                  <span className="text-sm font-bold text-orange-600">₾{discountedPrice.toFixed(2)}</span>
                  {b.discountPercent > 0 && (
                    <span className="text-xs text-gray-400 line-through">₾{originalPrice.toFixed(2)}</span>
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

      {/* Footer — totals + add all button */}
      <div className="border-t border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100/50 px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600">
            {t("bundleTotal")} ({itemCount})
          </span>
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
          onClick={handleAddAll}
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
  )
}
