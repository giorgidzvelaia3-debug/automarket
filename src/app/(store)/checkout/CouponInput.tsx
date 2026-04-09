"use client"

import { useState, useTransition } from "react"
import { validateCoupon, type ValidateCartItem } from "@/lib/actions/coupons"

export default function CouponInput({
  cartItems,
}: {
  cartItems: ValidateCartItem[]
}) {
  const [code, setCode] = useState("")
  const [applied, setApplied] = useState<{ code: string; discount: number } | null>(null)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function apply() {
    setError("")
    startTransition(async () => {
      const result = await validateCoupon(code, cartItems)
      if (result.valid) {
        setApplied({ code: result.couponCode, discount: result.discount })
      } else {
        setError(result.error)
        setApplied(null)
      }
    })
  }

  function remove() {
    setApplied(null)
    setCode("")
    setError("")
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Coupon Code</p>

      {/* Hidden input that will be submitted with the form */}
      <input type="hidden" name="couponCode" value={applied?.code ?? ""} />

      {applied ? (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-green-700 truncate">{applied.code}</p>
              <p className="text-xs text-green-600">−₾{applied.discount.toFixed(2)} discount applied</p>
            </div>
          </div>
          <button
            type="button"
            onClick={remove}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors shrink-0 ml-2"
          >
            Remove
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ENTER CODE"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={apply}
              disabled={isPending || !code.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isPending ? "..." : "Apply"}
            </button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </>
      )}
    </div>
  )
}
