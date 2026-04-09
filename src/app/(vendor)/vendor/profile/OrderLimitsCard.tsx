"use client"

import { useState, useTransition } from "react"
import { updateOrderLimits } from "@/lib/actions/vendors"

export default function OrderLimitsCard({
  initialMinAmount,
  initialMaxAmount,
  initialMinQty,
  initialMaxQty,
}: {
  initialMinAmount: number | null
  initialMaxAmount: number | null
  initialMinQty: number | null
  initialMaxQty: number | null
}) {
  const [minAmount, setMinAmount] = useState(initialMinAmount?.toString() ?? "")
  const [maxAmount, setMaxAmount] = useState(initialMaxAmount?.toString() ?? "")
  const [minQty, setMinQty] = useState(initialMinQty?.toString() ?? "")
  const [maxQty, setMaxQty] = useState(initialMaxQty?.toString() ?? "")
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle")
  const [isPending, startTransition] = useTransition()

  function save() {
    startTransition(async () => {
      try {
        await updateOrderLimits({
          minOrderAmount: minAmount ? parseFloat(minAmount) : null,
          maxOrderAmount: maxAmount ? parseFloat(maxAmount) : null,
          minOrderQty: minQty ? parseInt(minQty) : null,
          maxOrderQty: maxQty ? parseInt(maxQty) : null,
        })
        setStatus("saved")
        setTimeout(() => setStatus("idle"), 2000)
      } catch {
        setStatus("error")
        setTimeout(() => setStatus("idle"), 2000)
      }
    })
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

  // Summary badges
  const badges: { label: string; color: string }[] = []
  if (initialMinAmount) badges.push({ label: `მინ: ₾${initialMinAmount}`, color: "bg-blue-50 text-blue-700 border-blue-200" })
  if (initialMaxAmount) badges.push({ label: `მაქს: ₾${initialMaxAmount}`, color: "bg-blue-50 text-blue-700 border-blue-200" })
  if (initialMinQty) badges.push({ label: `მინ რაოდ: ${initialMinQty}`, color: "bg-purple-50 text-purple-700 border-purple-200" })
  if (initialMaxQty) badges.push({ label: `მაქს რაოდ: ${initialMaxQty}`, color: "bg-purple-50 text-purple-700 border-purple-200" })

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">შეკვეთის ლიმიტები</h3>
        <p className="text-xs text-gray-500 mt-0.5">დატოვე ცარიელი თუ ლიმიტი არ გინდა</p>
      </div>

      {badges.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {badges.map((b, i) => (
            <span key={i} className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${b.color}`}>
              {b.label}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Min order ₾</label>
          <input type="number" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} min="0" step="0.01" placeholder="None" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Max order ₾</label>
          <input type="number" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} min="0" step="0.01" placeholder="None" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Min quantity</label>
          <input type="number" value={minQty} onChange={(e) => setMinQty(e.target.value)} min="0" step="1" placeholder="None" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Max quantity</label>
          <input type="number" value={maxQty} onChange={(e) => setMaxQty(e.target.value)} min="0" step="1" placeholder="None" className={inputClass} />
        </div>
      </div>

      <button
        type="button"
        onClick={save}
        disabled={isPending}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
          status === "saved" ? "bg-green-600 text-white" : status === "error" ? "bg-red-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {isPending ? "Saving…" : status === "saved" ? "Saved!" : status === "error" ? "Error" : "Save Limits"}
      </button>
    </div>
  )
}
