"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import {
  type GuestCartItem,
  getGuestCart,
  removeFromGuestCart,
  updateGuestCartQuantity,
} from "@/lib/guestCart"

export default function GuestCartPage() {
  const [items, setItems] = useState<GuestCartItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setItems(getGuestCart())
    setMounted(true)
  }, [])

  function refresh() {
    setItems(getGuestCart())
    window.dispatchEvent(new Event("guest-cart-change"))
  }

  if (!mounted) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-sm text-gray-400">Loading cart…</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-4xl mb-4">🛒</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
        <p className="text-sm text-gray-500 mb-6">კალათა ცარიელია</p>
        <Link
          href="/vendors"
          className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Browse Products
        </Link>
      </div>
    )
  }

  // Group by vendor
  const byVendor = new Map<
    string,
    { vendorName: string; vendorSlug: string; items: GuestCartItem[] }
  >()
  for (const item of items) {
    const key = item.vendorId
    if (!byVendor.has(key)) {
      byVendor.set(key, { vendorName: item.vendorName, vendorSlug: item.vendorSlug, items: [] })
    }
    byVendor.get(key)!.items.push(item)
  }

  const grandTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Cart / კალათა{" "}
        <span className="text-base font-normal text-gray-400">
          ({items.length} {items.length === 1 ? "item" : "items"})
        </span>
      </h1>

      <div className="space-y-6">
        {Array.from(byVendor.values()).map(({ vendorName, vendorSlug, items: vendorItems }) => {
          const vendorTotal = vendorItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
          return (
            <div key={vendorSlug} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
                <Link
                  href={`/vendors/${vendorSlug}`}
                  className="text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
                >
                  {vendorName}
                </Link>
                <span className="text-xs text-gray-400">Subtotal: ₾{vendorTotal.toFixed(2)}</span>
              </div>
              <div className="divide-y divide-gray-100">
                {vendorItems.map((item) => (
                  <GuestCartItemRow key={item.productId} item={item} onUpdate={refresh} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <span className="text-base font-semibold text-gray-900">Grand Total / სულ</span>
          <span className="text-2xl font-extrabold text-gray-900">₾{grandTotal.toFixed(2)}</span>
        </div>
        <Link
          href="/checkout"
          className="block w-full rounded-lg bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Proceed to Checkout →
        </Link>
      </div>
    </div>
  )
}

function GuestCartItemRow({
  item,
  onUpdate,
}: {
  item: GuestCartItem
  onUpdate: () => void
}) {
  const maxQty = Math.min(item.stock, 10)

  function changeQty(newQty: number) {
    updateGuestCartQuantity(item.productId, newQty)
    onUpdate()
  }

  function remove() {
    removeFromGuestCart(item.productId)
    onUpdate()
  }

  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <Link href={`/products/${item.productId}`} className="shrink-0">
        <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
          {item.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image} alt={item.nameEn} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-300 text-2xl">□</span>
          )}
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
        <p className="text-xs text-gray-400 truncate">{item.nameEn}</p>
        <p className="mt-1 text-sm font-semibold text-gray-900">₾{item.price.toFixed(2)}</p>
      </div>

      <div className="flex items-center rounded-lg border border-gray-300 overflow-hidden shrink-0">
        <button
          onClick={() => changeQty(item.quantity - 1)}
          className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors text-sm"
        >
          −
        </button>
        <span className="px-3 py-1.5 text-sm font-medium text-gray-900 min-w-[2rem] text-center">
          {item.quantity}
        </span>
        <button
          onClick={() => changeQty(item.quantity + 1)}
          disabled={item.quantity >= maxQty}
          className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors text-sm"
        >
          +
        </button>
      </div>

      <p className="w-20 text-right text-sm font-semibold text-gray-900 shrink-0">
        ₾{(item.price * item.quantity).toFixed(2)}
      </p>

      <button
        onClick={remove}
        className="shrink-0 text-gray-300 hover:text-red-500 transition-colors"
        aria-label="Remove"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
