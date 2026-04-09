"use client"

import Link from "next/link"
import { updateProduct } from "@/lib/actions/products"

type Category = { id: string; nameEn: string; name: string }

type Product = {
  id: string
  name: string
  nameEn: string
  slug: string
  description: string | null
  descriptionEn: string | null
  price: unknown
  stock: number
  categoryId: string
  hasVariants?: boolean
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"

export default function EditProductForm({
  product,
  categories,
  error,
}: {
  product: Product
  categories: Category[]
  error?: string
}) {
  const action = updateProduct.bind(null, product.id)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {error && (
        <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-600">{decodeURIComponent(error)}</p>
        </div>
      )}

      <form action={action} className="space-y-5">
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
              defaultValue={product.nameEn}
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
              defaultValue={product.name}
              className={inputClass}
            />
          </div>
        </div>

        {/* Slug (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Slug <span className="text-gray-400 font-normal">(cannot be changed)</span>
          </label>
          <input
            type="text"
            value={product.slug}
            readOnly
            className={`${inputClass} font-mono bg-gray-50 text-gray-400 cursor-not-allowed`}
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
            defaultValue={product.categoryId}
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
              defaultValue={product.descriptionEn ?? ""}
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
              defaultValue={product.description ?? ""}
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
              defaultValue={Number(product.price)}
              disabled={product.hasVariants}
              className={`${inputClass} ${product.hasVariants ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}`}
            />
            {product.hasVariants && (
              <p className="mt-1.5 text-xs text-amber-600">
                ⚠️ როცა ვარიაციები გაქვს, ეს ფასი არ გამოიყენება
              </p>
            )}
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
              defaultValue={product.stock}
              disabled={product.hasVariants}
              className={`${inputClass} ${product.hasVariants ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}`}
            />
            {product.hasVariants && (
              <p className="mt-1.5 text-xs text-amber-600">
                ⚠️ ვარიაციების მარაგი ცალკეა
              </p>
            )}
          </div>
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
