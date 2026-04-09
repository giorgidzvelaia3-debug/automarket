"use client"

import { useState } from "react"
import { createVendorProfile } from "./actions"

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function RegisterForm({ error }: { error?: string }) {
  const [slug, setSlug] = useState("")
  const [slugEdited, setSlugEdited] = useState(false)

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!slugEdited) {
      setSlug(toSlug(e.target.value))
    }
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlug(e.target.value)
    setSlugEdited(e.target.value !== "")
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {error && (
        <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-600">{decodeURIComponent(error)}</p>
        </div>
      )}

      <form action={createVendorProfile} className="space-y-5">
        {/* Shop name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
            Shop Name <span className="text-red-400">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g. Tbilisi Auto Parts"
            onChange={handleNameChange}
            className={inputClass}
          />
        </div>

        {/* Slug */}
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1.5">
            Shop URL Slug{" "}
            <span className="text-gray-400 font-normal">(auto-generated)</span>
          </label>
          <div className="flex items-center gap-0">
            <span className="shrink-0 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-400 select-none">
              /shop/
            </span>
            <input
              id="slug"
              name="slug"
              type="text"
              value={slug}
              onChange={handleSlugChange}
              required
              placeholder="tbilisi-auto-parts"
              pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              title="Lowercase letters, numbers, and hyphens only"
              className="flex-1 rounded-r-lg rounded-l-none border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Lowercase letters, numbers, and hyphens only.
          </p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
            Description{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Tell buyers about your shop…"
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
            Phone Number{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+995 555 000 000"
            className={inputClass}
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
          >
            Submit for Approval
          </button>
        </div>
      </form>
    </div>
  )
}
