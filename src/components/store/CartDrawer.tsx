"use client"

import { useEffect, useState, useTransition, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import { localized } from "@/lib/localeName"
import { optimizeImageUrl } from "@/lib/imageUtils"
import { useCartDrawer } from "@/lib/cartDrawerContext"
import { useAuth } from "@/lib/authContext"
import { useRecentlyViewed } from "@/lib/useRecentlyViewed"
import { getGuestCart, removeFromGuestCart, updateGuestCartQuantity } from "@/lib/guestCart"
import { getCart, removeFromCart, updateCartQuantity } from "@/lib/actions/cart"
import WishlistButton from "./WishlistButton"

const FREE_SHIPPING_THRESHOLD = 100 // ₾

type CartItem = {
  id: string
  productId: string
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

export default function CartDrawer() {
  const { isOpen, activeTab, close, setTab } = useCartDrawer()
  const { isLoggedIn } = useAuth()
  const locale = useLocale()
  const t = useTranslations("Cart")
  const { items: recentItems } = useRecentlyViewed()

  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Load cart when drawer opens
  const loadCart = useCallback(async () => {
    if (isLoggedIn) {
      setLoading(true)
      try {
        const items = await getCart()
        setCartItems(
          items.map((item) => ({
            id: item.id,
            productId: item.product.id,
            slug: item.product.slug,
            name: item.product.name,
            nameEn: item.product.nameEn,
            image: item.variant?.images?.[0]?.url ?? item.product.images[0]?.url ?? null,
            price: Number(item.price ?? item.variant?.price ?? item.product.price),
            quantity: item.quantity,
            stock: item.variant?.stock ?? item.product.stock,
            variantName: item.variant?.name,
            variantNameEn: item.variant?.nameEn,
            vendorName: item.vendor.name,
          }))
        )
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    } else {
      const guest = getGuestCart()
      setCartItems(
        guest.map((g) => ({
          id: g.productId,
          productId: g.productId,
          slug: "",
          name: g.name,
          nameEn: g.nameEn,
          image: g.image,
          price: g.price,
          quantity: g.quantity,
          stock: g.stock,
          vendorName: g.vendorName,
        }))
      )
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (isOpen) loadCart()
  }, [isOpen, loadCart])

  // Listen for cart changes
  useEffect(() => {
    function onCartChange() {
      if (isOpen) loadCart()
    }
    window.addEventListener("guest-cart-change", onCartChange)
    window.addEventListener("cart-change", onCartChange)
    return () => {
      window.removeEventListener("guest-cart-change", onCartChange)
      window.removeEventListener("cart-change", onCartChange)
    }
  }, [isOpen, loadCart])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close()
    }
    if (isOpen) document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [isOpen, close])

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0)
  const shippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)
  const awayFromFree = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)

  function handleRemove(item: CartItem) {
    startTransition(async () => {
      if (isLoggedIn) {
        await removeFromCart(item.id)
        window.dispatchEvent(new Event("cart-change"))
      } else {
        removeFromGuestCart(item.productId)
        window.dispatchEvent(new Event("guest-cart-change"))
      }
      loadCart()
    })
  }

  function handleQuantity(item: CartItem, delta: number) {
    const newQty = Math.max(1, Math.min(item.stock, item.quantity + delta))
    if (newQty === item.quantity) return
    startTransition(async () => {
      if (isLoggedIn) {
        await updateCartQuantity(item.id, newQty)
        window.dispatchEvent(new Event("cart-change"))
      } else {
        updateGuestCartQuantity(item.productId, newQty)
        window.dispatchEvent(new Event("guest-cart-change"))
      }
      loadCart()
    })
  }

  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0)

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={close}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header with tabs */}
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between px-5 pt-4 pb-0">
            <div className="flex gap-0">
              <button
                onClick={() => setTab("cart")}
                className={`px-4 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  activeTab === "cart"
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {t("bag")} {cartCount > 0 && <span className="ml-1">{cartCount}</span>}
              </button>
              <button
                onClick={() => setTab("recent")}
                className={`px-4 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  activeTab === "recent"
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {t("recentlyViewed")} {recentItems.length > 0 && <span className="ml-1">{recentItems.length}</span>}
              </button>
            </div>
            <button
              onClick={close}
              className="p-1.5 -mr-1.5 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "cart" ? (
            <CartTab
              items={cartItems}
              loading={loading}
              isPending={isPending}
              locale={locale}
              subtotal={subtotal}
              shippingProgress={shippingProgress}
              awayFromFree={awayFromFree}
              onRemove={handleRemove}
              onQuantity={handleQuantity}
              onClose={close}
              t={t}
            />
          ) : (
            <RecentlyViewedTab
              items={recentItems}
              locale={locale}
              isLoggedIn={isLoggedIn}
              onClose={close}
              t={t}
            />
          )}
        </div>

        {/* Footer — only on cart tab with items */}
        {activeTab === "cart" && cartItems.length > 0 && (
          <div className="border-t border-gray-200 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">{t("subtotal")}</span>
              <span className="text-lg font-bold text-gray-900">₾{subtotal.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/cart"
                onClick={close}
                className="flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t("viewCart")}
              </Link>
              <Link
                href="/checkout"
                onClick={close}
                className="flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                {t("checkout")} →
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

/* ─── Cart Tab ─────────────────────────────────────────── */

function CartTab({
  items,
  loading,
  isPending,
  locale,
  subtotal,
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
  subtotal: number
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

/* ─── Recently Viewed Tab ──────────────────────────────── */

function RecentlyViewedTab({
  items,
  locale,
  isLoggedIn,
  onClose,
  t,
}: {
  items: ReturnType<typeof useRecentlyViewed>["items"]
  locale: string
  isLoggedIn: boolean
  onClose: () => void
  t: ReturnType<typeof useTranslations<"Cart">>
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <svg className="w-16 h-16 text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-sm font-medium text-gray-900 mb-1">{t("noRecentItems")}</p>
        <p className="text-xs text-gray-400">{t("noRecentHint")}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/products/${item.slug}`}
          onClick={onClose}
          className="group rounded-xl border border-gray-200 bg-white hover:border-blue-200 hover:shadow-sm transition-all overflow-hidden"
        >
          <div className="relative aspect-square bg-gray-100">
            {item.image ? (
              <Image src={optimizeImageUrl(item.image, 200)} alt="" fill sizes="180px" className="object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-gray-300 text-2xl">□</span>
              </div>
            )}
            {isLoggedIn && (
              <div className="absolute top-1.5 right-1.5 z-10" onClick={(e) => e.preventDefault()}>
                <WishlistButton
                  productId={item.id}
                  isWishlisted={false}
                  isLoggedIn={isLoggedIn}
                  size="sm"
                />
              </div>
            )}
          </div>
          <div className="p-2.5">
            <p className="text-xs font-medium text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
              {localized(locale, item.name, item.nameEn)}
            </p>
            <p className="text-sm font-bold text-gray-900 mt-1">₾{item.price.toFixed(2)}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
