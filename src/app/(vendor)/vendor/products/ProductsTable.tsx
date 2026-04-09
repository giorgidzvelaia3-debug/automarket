"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import ProductStatusButton from "./ProductStatusButton"
import DeleteProductButton from "./DeleteProductButton"
import { bulkUpdateProducts, bulkDeleteProducts } from "@/lib/actions/products"

type Product = {
  id: string
  name: string
  nameEn: string
  price: number
  stock: number
  status: string
  categoryName: string
  imageUrl?: string
}

type Category = { id: string; nameEn: string }

const statusBadge: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  ACTIVE: "bg-green-50 text-green-700",
  INACTIVE: "bg-amber-50 text-amber-700",
}

export default function ProductsTable({
  products,
  categories,
}: {
  products: Product[]
  categories: Category[]
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState("")

  const allSelected = products.length > 0 && selected.size === products.length

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(products.map((p) => p.id)))
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function doBulk(action: () => Promise<void>, label: string) {
    startTransition(async () => {
      try {
        await action()
        setSelected(new Set())
        setMessage(`${label} — ${selected.size} products`)
        setTimeout(() => setMessage(""), 3000)
        router.refresh()
      } catch (e) {
        setMessage((e as Error).message)
      }
    })
  }

  return (
    <>
      {message && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-2 text-sm text-blue-700 mb-4">
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 w-12" />
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Price</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Stock</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product) => (
              <tr
                key={product.id}
                className={`transition-colors ${selected.has(product.id) ? "bg-blue-50/50" : "hover:bg-gray-50"}`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(product.id)}
                    onChange={() => toggle(product.id)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="flex items-center justify-center h-full text-gray-300">□</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{product.nameEn}</p>
                  <p className="text-xs text-gray-400">{product.name}</p>
                </td>
                <td className="px-4 py-3 text-gray-500">{product.categoryName}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">₾{product.price.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-gray-600">{product.stock}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[product.status] ?? ""}`}>
                    {product.status.charAt(0) + product.status.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <ProductStatusButton id={product.id} status={product.status} />
                    <Link href={`/vendor/products/${product.id}/edit`} className="text-xs text-gray-500 hover:text-gray-700">Edit</Link>
                    <DeleteProductButton id={product.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-4">
            <span className="text-sm font-medium text-gray-900">
              {selected.size} selected
            </span>
            <div className="h-5 w-px bg-gray-300" />
            <button
              type="button"
              onClick={() => doBulk(() => bulkUpdateProducts(Array.from(selected), { status: "ACTIVE" }), "Activated")}
              disabled={isPending}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              Activate
            </button>
            <button
              type="button"
              onClick={() => doBulk(() => bulkUpdateProducts(Array.from(selected), { status: "INACTIVE" }), "Deactivated")}
              disabled={isPending}
              className="rounded-lg bg-gray-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Deactivate
            </button>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  doBulk(() => bulkUpdateProducts(Array.from(selected), { categoryId: e.target.value }), "Category changed")
                  e.target.value = ""
                }
              }}
              disabled={isPending}
              className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs disabled:opacity-50"
            >
              <option value="">Change Category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.nameEn}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete ${selected.size} products? This cannot be undone.`)) {
                  doBulk(() => bulkDeleteProducts(Array.from(selected)), "Deleted")
                }
              }}
              disabled={isPending}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              Delete
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </>
  )
}
