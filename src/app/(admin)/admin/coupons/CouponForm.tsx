"use client"

import { useState, useTransition } from "react"
import { createCoupon } from "@/lib/actions/coupons"

type Vendor = { id: string; name: string }
type Category = { id: string; nameEn: string }
type Product = { id: string; nameEn: string }

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default function CouponForm({
  vendors,
  categories,
  products,
}: {
  vendors: Vendor[]
  categories: Category[]
  products: Product[]
}) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE")
  const [value, setValue] = useState("")
  const [scope, setScope] = useState<"MARKETPLACE" | "VENDOR" | "CATEGORY" | "PRODUCT">("MARKETPLACE")
  const [vendorId, setVendorId] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [productId, setProductId] = useState("")
  const [minOrder, setMinOrder] = useState("")
  const [maxUses, setMaxUses] = useState("")
  const [endDate, setEndDate] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function submit() {
    setError("")
    if (!code.trim() || !value) {
      setError("Code and value required")
      return
    }
    startTransition(async () => {
      try {
        await createCoupon({
          code: code.trim(),
          type,
          value: parseFloat(value),
          scope,
          vendorId: scope === "VENDOR" ? vendorId : undefined,
          categoryId: scope === "CATEGORY" ? categoryId : undefined,
          productId: scope === "PRODUCT" ? productId : undefined,
          minOrderAmount: minOrder ? parseFloat(minOrder) : undefined,
          maxUses: maxUses ? parseInt(maxUses) : undefined,
          endDate: endDate || undefined,
        })
        setOpen(false)
        setCode("")
        setValue("")
        setMinOrder("")
        setMaxUses("")
        setEndDate("")
      } catch (e) {
        setError((e as Error).message)
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
      >
        Create Coupon
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900">Create Coupon</h2>

            {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">{error}</div>}

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Code</label>
              <div className="flex gap-2">
                <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SUMMER10" className={`${inputClass} font-mono`} />
                <button type="button" onClick={() => setCode(generateCode())} className="rounded-lg bg-gray-100 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-200">
                  Generate
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Type</label>
                <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
                  {(["PERCENTAGE", "FIXED"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${type === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                    >
                      {t === "PERCENTAGE" ? "%" : "₾"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Value</label>
                <input type="number" value={value} onChange={(e) => setValue(e.target.value)} min="0" step="0.01" className={inputClass} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Scope</label>
              <select value={scope} onChange={(e) => setScope(e.target.value as never)} className={inputClass}>
                <option value="MARKETPLACE">Marketplace (all)</option>
                <option value="VENDOR">Vendor</option>
                <option value="CATEGORY">Category</option>
                <option value="PRODUCT">Product</option>
              </select>
            </div>

            {scope === "VENDOR" && (
              <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className={inputClass}>
                <option value="">Select vendor</option>
                {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            )}
            {scope === "CATEGORY" && (
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
              </select>
            )}
            {scope === "PRODUCT" && (
              <select value={productId} onChange={(e) => setProductId(e.target.value)} className={inputClass}>
                <option value="">Select product</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.nameEn}</option>)}
              </select>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Min Order ₾</label>
                <input type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} min="0" step="0.01" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Max Uses</label>
                <input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} min="1" className={inputClass} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Expires</label>
              <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
              <button type="button" onClick={submit} disabled={isPending} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {isPending ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
