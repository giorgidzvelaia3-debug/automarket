"use client"

import Link from "next/link"
import { useState, useRef } from "react"
import { createProduct } from "@/lib/actions/products"

type Category = { id: string; nameEn: string; name: string }

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"

export default function ProductForm({
  categories,
  error,
}: {
  categories: Category[]
  error?: string
}) {
  const [slug, setSlug] = useState("")
  const [slugEdited, setSlugEdited] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [preview, setPreview] = useState("")
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done" | "error">("idle")
  const [uploadError, setUploadError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleNameEnChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!slugEdited) setSlug(toSlug(e.target.value))
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlug(e.target.value)
    setSlugEdited(e.target.value !== "")
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Local preview
    setPreview(URL.createObjectURL(file))
    setImageUrl("")
    setUploadError("")
    setUploadState("uploading")

    const fd = new FormData()
    fd.append("file", file)

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()

      if (!res.ok || !data.url) {
        setUploadState("error")
        setUploadError(data.error ?? "Upload failed. Please try again.")
        return
      }

      setImageUrl(data.url)
      setUploadState("done")
    } catch {
      setUploadState("error")
      setUploadError("Upload failed. Please try again.")
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {error && (
        <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-600">{decodeURIComponent(error)}</p>
        </div>
      )}

      <form action={createProduct} className="space-y-5">
        {/* Names */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="nameEn" className="block text-sm font-medium text-gray-700 mb-1.5">
              Name (English) <span className="text-red-400">*</span>
            </label>
            <input
              id="nameEn"
              name="nameEn"
              type="text"
              required
              placeholder="e.g. Engine Oil Filter"
              onChange={handleNameEnChange}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Name (Georgian) <span className="text-red-400">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="მაგ. ზეთის ფილტრი"
              className={inputClass}
            />
          </div>
        </div>

        {/* Slug */}
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1.5">
            Slug <span className="text-gray-400 font-normal">(auto-generated)</span>
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            value={slug}
            onChange={handleSlugChange}
            placeholder="engine-oil-filter"
            pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
            title="Lowercase letters, numbers, and hyphens only"
            className={`${inputClass} font-mono`}
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1.5">
            Category <span className="text-red-400">*</span>
          </label>
          <select
            id="categoryId"
            name="categoryId"
            required
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          >
            <option value="">— Select a category —</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nameEn} / {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Descriptions */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="descriptionEn" className="block text-sm font-medium text-gray-700 mb-1.5">
              Description (English)
            </label>
            <textarea
              id="descriptionEn"
              name="descriptionEn"
              rows={4}
              placeholder="Describe the product in English…"
              className={`${inputClass} resize-none`}
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
              Description (Georgian)
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="პროდუქტის აღწერა ქართულად…"
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        {/* Price + Stock */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1.5">
              Price (₾) <span className="text-red-400">*</span>
            </label>
            <input
              id="price"
              name="price"
              type="number"
              required
              min="0"
              step="0.01"
              placeholder="0.00"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1.5">
              Stock
            </label>
            <input
              id="stock"
              name="stock"
              type="number"
              min="0"
              step="1"
              defaultValue={0}
              className={inputClass}
            />
          </div>
        </div>

        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Main Image
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Upload the main image now. You can add more images after creating the product.
          </p>

          {/* Hidden input carries the uploaded URL into the server action */}
          <input type="hidden" name="imageUrl" value={imageUrl} />

          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-lg border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-colors ${
              uploadState === "error"
                ? "border-red-300 bg-red-50"
                : uploadState === "done"
                  ? "border-green-300 bg-green-50"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {preview ? (
              <div className="flex flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Preview"
                  className="h-32 w-32 object-cover rounded-lg"
                />
                {uploadState === "uploading" && (
                  <p className="text-xs text-blue-600 animate-pulse">Uploading…</p>
                )}
                {uploadState === "done" && (
                  <p className="text-xs text-green-600">Uploaded — click to replace</p>
                )}
                {uploadState === "error" && (
                  <p className="text-xs text-red-600">{uploadError}</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <svg
                  className="w-8 h-8 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 16.5V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18v-1.5M16.5 12L12 7.5m0 0L7.5 12M12 7.5V19.5"
                  />
                </svg>
                <p className="text-sm text-gray-500">
                  Click to upload an image
                </p>
                <p className="text-xs text-gray-400">PNG, JPG, WEBP up to 10 MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={uploadState === "uploading"}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadState === "uploading" ? "Uploading…" : "Save as Draft"}
          </button>
          <Link
            href="/vendor/products"
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
