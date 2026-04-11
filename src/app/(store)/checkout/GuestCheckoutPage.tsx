"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { type GuestCartItem, getGuestCart, clearGuestCart } from "@/lib/guestCart"
import { createGuestOrder } from "@/lib/actions/orders"
import CouponInput from "./CouponInput"

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"

export default function GuestCheckoutPage() {
  const [items, setItems] = useState<GuestCartItem[]>([])
  const [mounted, setMounted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const cart = getGuestCart()
    if (cart.length === 0) {
      router.replace("/cart")
      return
    }
    setItems(cart)
    setMounted(true)
  }, [router])

  if (!mounted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    )
  }

  // Group by vendor
  const byVendor = new Map<
    string,
    { vendorName: string; items: GuestCartItem[] }
  >()
  for (const item of items) {
    if (!byVendor.has(item.vendorId)) {
      byVendor.set(item.vendorId, { vendorName: item.vendorName, items: [] })
    }
    byVendor.get(item.vendorId)!.items.push(item)
  }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  async function handleSubmit(formData: FormData) {
    setSubmitting(true)
    setError(null)

    // Attach cart items to form data
    formData.set("cartItems", JSON.stringify(
      items.map((i) => ({
        productId: i.productId,
        vendorId: i.vendorId,
        quantity: i.quantity,
        price: i.price,
        variantId: i.variantId ?? null,
        variantName: i.variantName ?? null,
      }))
    ))

    try {
      const result = await createGuestOrder(formData)
      if (result?.error) {
        setError(result.error)
        setSubmitting(false)
        return
      }
      clearGuestCart()
      window.dispatchEvent(new Event("guest-cart-change"))
      router.push("/checkout/success")
    } catch {
      setError("Something went wrong. Please try again.")
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link href="/cart" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          ← Back to Cart
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Guest Checkout</h1>
        <p className="mt-1 text-sm text-gray-500">
          No account needed.{" "}
          <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link> for order tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: form */}
        <div className="lg:col-span-3">
          <form action={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <h2 className="text-base font-semibold text-gray-900">Your Details</h2>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1.5">
                Full name <span className="text-red-400">*</span>
              </label>
              <input id="fullName" name="fullName" type="text" required placeholder="John Doe" className={inputClass} />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email <span className="text-red-400">*</span>
              </label>
              <input id="email" name="email" type="email" required placeholder="you@example.com" className={inputClass} />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone <span className="text-red-400">*</span>
              </label>
              <input id="phone" name="phone" type="tel" required placeholder="+995 555 000 000" className={inputClass} />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1.5">
                Address <span className="text-red-400">*</span>
              </label>
              <input id="address" name="address" type="text" required placeholder="123 Rustaveli Ave" className={inputClass} />
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1.5">
                City <span className="text-red-400">*</span>
              </label>
              <input id="city" name="city" type="text" required placeholder="Tbilisi" className={inputClass} />
            </div>

            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1.5">
                Note <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea id="note" name="note" rows={3} placeholder="Any delivery instructions…" className={`${inputClass} resize-none`} />
            </div>

            <CouponInput
              cartItems={items.map((i) => ({
                productId: i.productId,
                vendorId: i.vendorId,
                categoryId: "",
                price: i.price,
                quantity: i.quantity,
              }))}
            />

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Placing order…" : `Place Order — ₾${total.toFixed(2)}`}
              </button>
            </div>
          </form>
        </div>

        {/* Right: order summary */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Order Summary</h2>

          {Array.from(byVendor.values()).map(({ vendorName, items: vendorItems }) => (
            <div key={vendorName} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-600">{vendorName}</p>
              </div>
              <div className="divide-y divide-gray-100">
                {vendorItems.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image} alt={item.nameEn} className="w-full h-full object-cover" />
                      ) : (
                        <span className="flex items-center justify-center h-full text-gray-300 text-lg">□</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">×{item.quantity}</p>
                    </div>
                    <p className="text-xs font-semibold text-gray-900 shrink-0">
                      ₾{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-white rounded-xl border border-gray-200 px-4 py-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">Total</span>
            <span className="text-lg font-extrabold text-gray-900">₾{total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
