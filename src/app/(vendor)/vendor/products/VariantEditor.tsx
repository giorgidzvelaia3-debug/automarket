"use client"

import { useState, useTransition } from "react"
import { saveVariants } from "@/lib/actions/variants"

type Variant = {
  id?: string
  name: string
  nameEn: string
  price: string
  stock: number
  sku: string
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"

export default function VariantEditor({
  productId,
  initialVariants,
}: {
  productId: string
  initialVariants: Variant[]
}) {
  const [variants, setVariants] = useState<Variant[]>(initialVariants)
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle")

  function addRow() {
    setVariants((prev) => [
      ...prev,
      { name: "", nameEn: "", price: "", stock: 0, sku: "" },
    ])
  }

  function removeRow(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index))
  }

  function updateRow(index: number, field: keyof Variant, value: string | number) {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    )
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await saveVariants(
          productId,
          variants.map((v) => ({
            id: v.id,
            name: v.name,
            nameEn: v.nameEn,
            price: v.price,
            stock: v.stock,
            sku: v.sku || undefined,
          }))
        )
        setStatus("saved")
        setTimeout(() => setStatus("idle"), 2500)
      } catch {
        setStatus("error")
        setTimeout(() => setStatus("idle"), 2500)
      }
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Product Variants</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Add size, volume, or type variants with individual pricing and stock
          </p>
        </div>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Variant
        </button>
      </div>

      {variants.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          No variants — product uses base price and stock.
        </p>
      ) : (
        <div className="space-y-3">
          {/* Header */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_100px_80px_100px_40px] gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
            <span>Name (KA)</span>
            <span>Name (EN)</span>
            <span>Price (₾)</span>
            <span>Stock</span>
            <span>SKU</span>
            <span />
          </div>

          {variants.map((v, i) => (
            <div key={v.id ?? `new-${i}`} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_100px_80px_100px_40px] gap-2 items-center bg-gray-50 rounded-lg p-2 sm:p-0 sm:bg-transparent">
              <input
                type="text"
                value={v.name}
                onChange={(e) => updateRow(i, "name", e.target.value)}
                placeholder="მაგ. 1 ლიტრი"
                className={inputClass}
              />
              <input
                type="text"
                value={v.nameEn}
                onChange={(e) => updateRow(i, "nameEn", e.target.value)}
                placeholder="e.g. 1 Liter"
                className={inputClass}
              />
              <input
                type="number"
                value={v.price}
                onChange={(e) => updateRow(i, "price", e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className={inputClass}
              />
              <input
                type="number"
                value={v.stock}
                onChange={(e) => updateRow(i, "stock", parseInt(e.target.value) || 0)}
                min="0"
                className={inputClass}
              />
              <input
                type="text"
                value={v.sku}
                onChange={(e) => updateRow(i, "sku", e.target.value)}
                placeholder="SKU"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                aria-label="Remove variant"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {variants.length > 0 && (
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
              status === "saved"
                ? "bg-green-600 text-white"
                : status === "error"
                  ? "bg-red-600 text-white"
                  : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isPending ? "Saving…" : status === "saved" ? "Saved!" : status === "error" ? "Error" : "Save Variants"}
          </button>
          <p className="text-xs text-gray-400">
            When variants exist, each variant has its own price and stock.
          </p>
        </div>
      )}
    </div>
  )
}
