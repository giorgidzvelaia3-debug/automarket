"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { createBanner, updateBanner, deleteBanner } from "@/lib/actions/banners"

type Banner = {
  id: string
  title: string
  titleEn: string | null
  subtitle: string | null
  subtitleEn: string | null
  imageUrl: string
  linkUrl: string | null
  position: "HERO" | "SIDE_TOP" | "SIDE_BOTTOM"
  order: number
  active: boolean
}

const positionLabels: Record<string, string> = {
  HERO: "Hero (Main Carousel)",
  SIDE_TOP: "Side Top",
  SIDE_BOTTOM: "Side Bottom",
}

export default function BannerManager({ initialBanners }: { initialBanners: Banner[] }) {
  const [banners, setBanners] = useState(initialBanners)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleToggle(banner: Banner) {
    startTransition(async () => {
      await updateBanner(banner.id, { active: !banner.active })
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, active: !b.active } : b))
      )
    })
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this banner?")) return
    startTransition(async () => {
      await deleteBanner(id)
      setBanners((prev) => prev.filter((b) => b.id !== id))
    })
  }

  return (
    <div className="space-y-6">
      {/* Add button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          {showForm ? "Cancel" : "+ Add Banner"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <BannerForm
          onSuccess={(banner) => {
            setBanners((prev) => [...prev, banner])
            setShowForm(false)
          }}
        />
      )}

      {/* Banner list */}
      {banners.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No banners yet</div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className={`flex items-center gap-4 bg-white rounded-xl border p-4 ${
                banner.active ? "border-gray-200" : "border-gray-200 opacity-50"
              }`}
            >
              <div className="relative w-32 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                <Image src={banner.imageUrl} alt="" fill sizes="128px" className="object-cover" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{banner.title}</p>
                {banner.subtitle && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">{banner.subtitle}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {positionLabels[banner.position]}
                  </span>
                  {banner.linkUrl && (
                    <span className="text-[10px] text-gray-400 truncate max-w-[150px]">{banner.linkUrl}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggle(banner)}
                  disabled={isPending}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    banner.active
                      ? "bg-green-50 text-green-700 hover:bg-green-100"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {banner.active ? "Active" : "Inactive"}
                </button>
                <button
                  onClick={() => handleDelete(banner.id)}
                  disabled={isPending}
                  className="text-xs text-red-500 hover:text-red-700 px-2 py-1.5 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Banner Creation Form ─── */

function BannerForm({ onSuccess }: { onSuccess: (banner: Banner) => void }) {
  const [isPending, startTransition] = useTransition()
  const [imageUrl, setImageUrl] = useState("")
  const [uploading, setUploading] = useState(false)

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      if (!res.ok) throw new Error()
      const { url } = await res.json()
      setImageUrl(url)
    } catch {
      alert("Upload failed")
    } finally {
      setUploading(false)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      await createBanner({
        title: fd.get("title") as string,
        titleEn: (fd.get("titleEn") as string) || undefined,
        subtitle: (fd.get("subtitle") as string) || undefined,
        subtitleEn: (fd.get("subtitleEn") as string) || undefined,
        imageUrl,
        linkUrl: (fd.get("linkUrl") as string) || undefined,
        position: fd.get("position") as "HERO" | "SIDE_TOP" | "SIDE_BOTTOM",
      })
      // Refresh page to get the new banner with ID
      window.location.reload()
    })
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">New Banner</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Title (KA)</label>
          <input name="title" required placeholder="სათაური" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Title (EN)</label>
          <input name="titleEn" placeholder="Title" className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Subtitle (KA)</label>
          <input name="subtitle" placeholder="ქვესათაური" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Subtitle (EN)</label>
          <input name="subtitleEn" placeholder="Subtitle" className={inputClass} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Link URL (optional)</label>
        <input name="linkUrl" placeholder="/shop or /categories/..." className={inputClass} />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Position</label>
        <select name="position" className={inputClass}>
          <option value="HERO">Hero (Main Carousel)</option>
          <option value="SIDE_TOP">Side Top</option>
          <option value="SIDE_BOTTOM">Side Bottom</option>
        </select>
      </div>

      {/* Image upload */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Banner Image</label>
        {imageUrl ? (
          <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gray-100">
            <Image src={imageUrl} alt="" fill className="object-cover" />
            <button
              type="button"
              onClick={() => setImageUrl("")}
              className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full text-white flex items-center justify-center text-xs hover:bg-black/70"
            >
              ×
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUpload(file)
              }}
            />
            {uploading ? (
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span className="text-xs text-gray-500">Click to upload</span>
              </>
            )}
          </label>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || !imageUrl}
        className="w-full rounded-lg bg-blue-600 text-white py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Creating…" : "Create Banner"}
      </button>
    </form>
  )
}
