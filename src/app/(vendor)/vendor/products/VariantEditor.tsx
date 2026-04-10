"use client"

import { useState, useTransition, useRef } from "react"
import Image from "next/image"
import { saveVariants } from "@/lib/actions/variants"
import { addProductImage, deleteProductImage } from "@/lib/actions/products"

type VariantImage = { id: string; url: string }

type Variant = {
  id?: string
  name: string
  nameEn: string
  price: string
  stock: number
  sku: string
  images: VariantImage[]
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
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)

  function addRow() {
    setVariants((prev) => [
      ...prev,
      { name: "", nameEn: "", price: "", stock: 0, sku: "", images: [] },
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

  async function handleImageUpload(index: number, file: File) {
    const variant = variants[index]
    if (!variant.id) {
      alert("Save the variant first before uploading images.")
      return
    }

    setUploadingIdx(index)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const { url } = await res.json()

      const created = await addProductImage(productId, url, variant.id)
      setVariants((prev) =>
        prev.map((v, i) =>
          i === index
            ? { ...v, images: [...v.images, { id: created.id, url: created.url }] }
            : v
        )
      )
    } catch {
      alert("Image upload failed")
    } finally {
      setUploadingIdx(null)
    }
  }

  async function handleImageDelete(variantIndex: number, imageId: string) {
    try {
      await deleteProductImage(imageId)
      setVariants((prev) =>
        prev.map((v, i) =>
          i === variantIndex
            ? { ...v, images: v.images.filter((img) => img.id !== imageId) }
            : v
        )
      )
    } catch {
      alert("Failed to delete image")
    }
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
            Add size, volume, or type variants with individual pricing, stock and images
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
        <div className="space-y-4">
          {variants.map((v, i) => (
            <VariantRow
              key={v.id ?? `new-${i}`}
              variant={v}
              index={i}
              uploading={uploadingIdx === i}
              onUpdate={updateRow}
              onRemove={removeRow}
              onImageUpload={handleImageUpload}
              onImageDelete={handleImageDelete}
            />
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

function VariantRow({
  variant: v,
  index: i,
  uploading,
  onUpdate,
  onRemove,
  onImageUpload,
  onImageDelete,
}: {
  variant: Variant
  index: number
  uploading: boolean
  onUpdate: (i: number, field: keyof Variant, value: string | number) => void
  onRemove: (i: number) => void
  onImageUpload: (i: number, file: File) => void
  onImageDelete: (i: number, imageId: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="bg-gray-50 rounded-xl p-3 space-y-2">
      {/* Fields row */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_100px_80px_100px_40px] gap-2 items-center">
        <input
          type="text"
          value={v.name}
          onChange={(e) => onUpdate(i, "name", e.target.value)}
          placeholder="მაგ. 1 ლიტრი"
          className={inputClass}
        />
        <input
          type="text"
          value={v.nameEn}
          onChange={(e) => onUpdate(i, "nameEn", e.target.value)}
          placeholder="e.g. 1 Liter"
          className={inputClass}
        />
        <input
          type="number"
          value={v.price}
          onChange={(e) => onUpdate(i, "price", e.target.value)}
          placeholder="0.00"
          min="0"
          step="0.01"
          className={inputClass}
        />
        <input
          type="number"
          value={v.stock}
          onChange={(e) => onUpdate(i, "stock", parseInt(e.target.value) || 0)}
          min="0"
          className={inputClass}
        />
        <input
          type="text"
          value={v.sku}
          onChange={(e) => onUpdate(i, "sku", e.target.value)}
          placeholder="SKU"
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => onRemove(i)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          aria-label="Remove variant"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Images row */}
      <div className="flex items-center gap-2 flex-wrap">
        {v.images.map((img) => (
          <div key={img.id} className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 group">
            <Image src={img.url} alt="" fill sizes="48px" className="object-cover" />
            <button
              type="button"
              onClick={() => onImageDelete(i, img.id)}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        {/* Upload button */}
        {v.id && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onImageUpload(i, file)
                e.target.value = ""
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              )}
            </button>
          </>
        )}

        {!v.id && v.images.length === 0 && (
          <p className="text-[10px] text-gray-400">Save first to upload images</p>
        )}
      </div>
    </div>
  )
}
