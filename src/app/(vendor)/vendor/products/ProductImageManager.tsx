"use client"

import { useState, useRef, useTransition } from "react"
import { addProductImage, deleteProductImage, setMainProductImage } from "@/lib/actions/products"

type Image = { id: string; url: string; order: number }

const MAX_IMAGES = 10

export default function ProductImageManager({
  productId,
  initialImages,
}: {
  productId: string
  initialImages: Image[]
}) {
  const [images, setImages] = useState<Image[]>(
    [...initialImages].sort((a, b) => a.order - b.order)
  )
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    const slotsLeft = MAX_IMAGES - images.length
    const toUpload = files.slice(0, slotsLeft)
    if (toUpload.length === 0) {
      setError(`Maximum ${MAX_IMAGES} images allowed`)
      return
    }

    setError("")
    setUploading(true)

    try {
      for (const file of toUpload) {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch("/api/upload", { method: "POST", body: fd })
        const data = await res.json()
        if (!res.ok || !data.url) {
          setError(data.error ?? "Upload failed")
          continue
        }
        const created = await addProductImage(productId, data.url)
        setImages((prev) => [...prev, created])
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  function handleDelete(imageId: string) {
    if (!confirm("Delete this image?")) return
    startTransition(async () => {
      try {
        await deleteProductImage(imageId)
        setImages((prev) => prev.filter((i) => i.id !== imageId))
      } catch (e) {
        setError((e as Error).message)
      }
    })
  }

  function handleSetMain(imageId: string) {
    startTransition(async () => {
      try {
        await setMainProductImage(imageId)
        setImages((prev) => {
          const target = prev.find((i) => i.id === imageId)
          if (!target) return prev
          const others = prev.filter((i) => i.id !== imageId)
          return [
            { ...target, order: 0 },
            ...others.map((img, idx) => ({ ...img, order: idx + 1 })),
          ]
        })
      } catch (e) {
        setError((e as Error).message)
      }
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Images</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {images.length} of {MAX_IMAGES} · First image is shown as the main product photo
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img, idx) => {
            const isMain = idx === 0
            return (
              <div
                key={img.id}
                className={`relative group rounded-lg overflow-hidden border-2 ${
                  isMain ? "border-blue-500" : "border-gray-200"
                }`}
              >
                <div className="aspect-square bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </div>

                {/* Main badge */}
                {isMain && (
                  <span className="absolute top-1.5 left-1.5 inline-flex items-center rounded-md bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    MAIN
                  </span>
                )}

                {/* Delete X */}
                <button
                  type="button"
                  onClick={() => handleDelete(img.id)}
                  disabled={isPending}
                  className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-30"
                  aria-label="Delete image"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Set as main */}
                {!isMain && (
                  <button
                    type="button"
                    onClick={() => handleSetMain(img.id)}
                    disabled={isPending}
                    className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-white bg-black/60 hover:bg-blue-600 rounded-md px-2 py-1 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-30"
                  >
                    Set as Main
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Upload */}
      {images.length < MAX_IMAGES && (
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/30 transition-colors py-6 flex flex-col items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18v-1.5M16.5 12L12 7.5m0 0L7.5 12M12 7.5V19.5" />
            </svg>
            <p className="text-sm font-medium text-gray-600">
              {uploading ? "Uploading…" : "Click to upload images"}
            </p>
            <p className="text-xs text-gray-400">
              PNG, JPG, WEBP · {MAX_IMAGES - images.length} slots left
            </p>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            className="hidden"
          />
        </div>
      )}
    </div>
  )
}
