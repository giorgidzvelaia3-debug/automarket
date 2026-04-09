"use client"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { createReturnRequest } from "@/lib/actions/returns"

type Item = {
  id: string
  quantity: number
  price: number
  name: string
  nameEn: string
  imageUrl: string | null
}

const REASONS = [
  { value: "DEFECTIVE", label: "Defective / Damaged" },
  { value: "WRONG_ITEM", label: "Wrong item received" },
  { value: "NOT_AS_DESCRIBED", label: "Not as described" },
  { value: "CHANGED_MIND", label: "Changed my mind" },
  { value: "OTHER", label: "Other" },
] as const

export default function ReturnForm({
  orderId,
  vendorId,
  items,
}: {
  orderId: string
  vendorId: string
  items: Item[]
}) {
  const router = useRouter()
  const [type, setType] = useState<"RETURN" | "WARRANTY">("RETURN")
  const [reason, setReason] = useState<typeof REASONS[number]["value"]>("DEFECTIVE")
  const [description, setDescription] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({})
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  function toggleItem(itemId: string, maxQty: number) {
    setSelectedItems((prev) => {
      if (prev[itemId]) {
        const next = { ...prev }
        delete next[itemId]
        return next
      }
      return { ...prev, [itemId]: maxQty }
    })
  }

  function updateQty(itemId: string, qty: number, max: number) {
    setSelectedItems((prev) => ({ ...prev, [itemId]: Math.max(1, Math.min(qty, max)) }))
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 3 - images.length)
    if (files.length === 0) return
    setUploading(true)
    try {
      const urls: string[] = []
      for (const file of files) {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch("/api/upload", { method: "POST", body: fd })
        const data = await res.json()
        if (data.url) urls.push(data.url)
      }
      setImages((prev) => [...prev, ...urls])
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  function submit() {
    setError("")
    const itemsList = Object.entries(selectedItems).map(([orderItemId, quantity]) => ({
      orderItemId,
      quantity,
    }))
    if (itemsList.length === 0) {
      setError("Select at least one item")
      return
    }
    startTransition(async () => {
      try {
        await createReturnRequest({
          orderId,
          vendorId,
          type,
          reason,
          description,
          images,
          items: itemsList,
        })
        router.push("/account/returns")
      } catch (e) {
        setError((e as Error).message)
      }
    })
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {/* Type toggle */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Type</p>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {(["RETURN", "WARRANTY"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                type === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              }`}
            >
              {t === "RETURN" ? "Return" : "Warranty"}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-semibold text-gray-900 mb-3">Select items</p>
        <div className="space-y-3">
          {items.map((item) => {
            const checked = selectedItems[item.id] != null
            return (
              <div key={item.id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleItem(item.id, item.quantity)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300">□</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">₾{item.price.toFixed(2)} × {item.quantity}</p>
                </div>
                {checked && (
                  <input
                    type="number"
                    value={selectedItems[item.id]}
                    onChange={(e) => updateQty(item.id, parseInt(e.target.value) || 1, item.quantity)}
                    min="1"
                    max={item.quantity}
                    className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-sm text-center"
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Reason */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Reason</label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value as never)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Describe the issue in detail…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Images */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Photos <span className="text-gray-400 normal-case font-normal">(up to 3)</span>
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          {images.map((url, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
          {images.length < 3 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/30 transition-colors flex items-center justify-center text-gray-400 disabled:opacity-50"
            >
              {uploading ? "…" : "+"}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            className="hidden"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isPending ? "Submitting…" : "Submit Request"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
