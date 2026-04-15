"use client"

import Link from "next/link"
import { useState } from "react"
import { updateCategory } from "@/lib/actions/categories"

type ParentCategory = { id: string; nameEn: string }
type Category = { id: string; name: string; nameEn: string; slug: string; parentId: string | null }

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function EditCategoryForm({
  category,
  parentCategories,
  error,
}: {
  category: Category
  parentCategories: ParentCategory[]
  error?: string
}) {
  const [slug, setSlug] = useState(category.slug)
  const [slugEdited, setSlugEdited] = useState(true)

  const action = updateCategory.bind(null, category.id)

  function handleNameEnChange(e: React.ChangeEvent<HTMLInputElement>) {
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

      <form action={action} className="space-y-5">
        {/* Georgian name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
            Name (Georgian) <span className="text-red-400">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={category.name}
            className={inputClass}
          />
        </div>

        {/* English name */}
        <div>
          <label htmlFor="nameEn" className="block text-sm font-medium text-gray-700 mb-1.5">
            Name (English) <span className="text-red-400">*</span>
          </label>
          <input
            id="nameEn"
            name="nameEn"
            type="text"
            required
            defaultValue={category.nameEn}
            onChange={handleNameEnChange}
            className={inputClass}
          />
        </div>

        {/* Slug */}
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1.5">
            Slug
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            value={slug}
            onChange={handleSlugChange}
            pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
            title="Lowercase letters, numbers, and hyphens only"
            className={`${inputClass} font-mono`}
          />
        </div>

        {/* Parent category */}
        <div>
          <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 mb-1.5">
            Parent Category{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <select
            id="parentId"
            name="parentId"
            defaultValue={category.parentId ?? ""}
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          >
            <option value="">— Top-level category —</option>
            {parentCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nameEn}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
          >
            Save Changes
          </button>
          <Link
            href="/admin/categories"
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
