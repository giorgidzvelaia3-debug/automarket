"use client"

import { useEffect, useState, useTransition, useCallback } from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { useCartDrawer } from "@/lib/cartDrawerContext"
import { useAuth } from "@/lib/authContext"
import { useRecentlyViewed } from "@/lib/useRecentlyViewed"
import { getGuestCart, removeFromGuestCart, updateGuestCartQuantity } from "@/lib/guestCart"
import { getCart, removeFromCart, updateCartQuantity } from "@/lib/actions/cart"
import CartTab, { type CartItem } from "./CartTab"
import RecentlyViewedTab from "./RecentlyViewedTab"

const FREE_SHIPPING_THRESHOLD = 100 // ₾

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
          id: `${g.productId}::${g.variantId ?? ""}`,
          productId: g.productId,
          variantId: g.variantId,
          slug: "",
          name: g.name,
          nameEn: g.nameEn,
          image: g.image,
          price: g.price,
          quantity: g.quantity,
          stock: g.stock,
          variantName: g.variantName,
          variantNameEn: g.variantNameEn,
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
        removeFromGuestCart(item.productId, item.variantId)
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
        updateGuestCartQuantity(item.productId, newQty, item.variantId)
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
