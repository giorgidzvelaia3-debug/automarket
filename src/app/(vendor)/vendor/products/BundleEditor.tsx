"use client"

import { useState, useTransition, useRef } from "react"
import Image from "next/image"
import { addBundleItem, removeBundleItem, updateBundleItem, searchVendorProducts } from "@/lib/actions/bundles"
import { optimizeImageUrl } from "@/lib/imageUtils"

type BundleItem = {
  id: string
  discountPercent: number
  bundleProduct: {
    id: string
    name: string
    nameEn: string
    price: number
    stock: number
    slug: string
    images: { url: string }[]
  }
}

type SearchResult = {
  id: string
  name: string
  nameEn: string
  price: number
  images: { url: string }[]
}

export default function BundleEditor({
  productId,
  initialItems,
}: {
  productId: string
  initialItems: BundleItem[]
}) {
  const [items, setItems] = useState(initialItems)
  const [searching, setSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [isPending, startTransition] = useTransition()
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  function handleSearch(query: string) {
    setSearchQuery(query)
    if (query.length < 2) {
      setResults([])
      return
    }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await searchVendorProducts(productId, query)
        setResults(res.map((r) => ({ ...r, price: Number(r.price) })))
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
  }

  function handleAdd(product: SearchResult) {
    startTransition(async () => {
      await addBundleItem(productId, product.id, 5)
      setItems((prev) => [
        ...prev,
        {
          id: "", // will be replaced on reload
          discountPercent: 5,
          bundleProduct: {
            id: product.id,
            name: product.name,
            nameEn: product.nameEn,
            price: product.price,
            stock: 0,
            slug: "",
            images: product.images,
          },
        },
      ])
      setResults((prev) => prev.filter((r) => r.id !== product.id))
      setSearchQuery("")
      setShowSearch(false)
      // Reload to get proper IDs
      window.location.reload()
    })
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      await removeBundleItem(id)
      setItems((prev) => prev.filter((item) => item.id !== id))
    })
  }

  function handleDiscountChange(id: string, value: number) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, discountPercent: value } : item))
    )
    startTransition(async () => {
      await updateBundleItem(id, value)
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Bundle Deals ("ერთად იაფია")</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Add products that go well together — buyers get a discount
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowSearch(!showSearch)}
          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="mb-4 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search your products…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          {searching && (
            <div className="absolute right-3 top-2.5">
              <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}
          {results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg z-10 overflow-hidden">
              {results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleAdd(r)}
                  disabled={isPending}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden shrink-0 relative">
                    {r.images[0] ? (
                      <Image src={optimizeImageUrl(r.images[0].url, 64)} alt="" fill sizes="32px" className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-300 text-xs">□</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{r.name}</p>
                    <p className="text-xs text-gray-400 truncate">{r.nameEn}</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-700 shrink-0">₾{r.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bundle items */}
      {items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">
          No bundle items — add products that complement this one.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id || item.bundleProduct.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
              <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden shrink-0 relative">
                {item.bundleProduct.images[0] ? (
                  <Image src={optimizeImageUrl(item.bundleProduct.images[0].url, 64)} alt="" fill sizes="40px" className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-300 text-sm">□</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.bundleProduct.name}</p>
                <p className="text-xs text-gray-400">₾{Number(item.bundleProduct.price).toFixed(2)}</p>
              </div>

              {/* Discount % */}
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs text-gray-500">-</span>
                <input
                  type="number"
                  value={item.discountPercent}
                  onChange={(e) => handleDiscountChange(item.id, parseInt(e.target.value) || 0)}
                  min="0"
                  max="50"
                  className="w-14 rounded border border-gray-300 px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-500">%</span>
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                disabled={isPending}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
