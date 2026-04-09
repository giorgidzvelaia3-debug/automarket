"use client"

import { useState, useTransition, useMemo } from "react"
import { createFlashSale, updateFlashSale } from "@/lib/actions/flashSales"

type Product = { id: string; name: string; nameEn: string; price: number; categoryId: string; imageUrl?: string }
type Category = { id: string; nameEn: string; name: string; productCount: number }

type SaleItem = {
  productId: string
  discountType: "PERCENTAGE" | "FIXED"
  discountValue: string
  maxQuantity: string
}

type SaleMode = "PRODUCTS" | "CATEGORY"

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"

export default function FlashSaleForm({
  products,
  categories,
  existingData,
  saleId,
}: {
  products: Product[]
  categories: Category[]
  existingData?: {
    title: string
    titleEn: string
    startTime: string
    endTime: string
    saleMode: SaleMode
    categoryId?: string
    categoryDiscount?: string
    categoryDiscountType?: "PERCENTAGE" | "FIXED"
    items: SaleItem[]
  }
  saleId?: string
}) {
  const [title, setTitle] = useState(existingData?.title ?? "")
  const [titleEn, setTitleEn] = useState(existingData?.titleEn ?? "")
  const [startTime, setStartTime] = useState(existingData?.startTime ?? "")
  const [endTime, setEndTime] = useState(existingData?.endTime ?? "")
  const [saleMode, setSaleMode] = useState<SaleMode>(existingData?.saleMode ?? "PRODUCTS")
  const [items, setItems] = useState<SaleItem[]>(existingData?.items ?? [])
  const [categoryId, setCategoryId] = useState(existingData?.categoryId ?? "")
  const [catDiscountType, setCatDiscountType] = useState<"PERCENTAGE" | "FIXED">(existingData?.categoryDiscountType ?? "PERCENTAGE")
  const [catDiscountValue, setCatDiscountValue] = useState(existingData?.categoryDiscount ?? "10")
  const [isPending, startTransition] = useTransition()

  const productMap = new Map(products.map((p) => [p.id, p]))

  // Duration calculation
  const duration = useMemo(() => {
    if (!startTime || !endTime) return null
    const ms = new Date(endTime).getTime() - new Date(startTime).getTime()
    if (ms <= 0) return null
    const hours = Math.floor(ms / 3600000)
    const days = Math.floor(hours / 24)
    const remHours = hours % 24
    if (days > 0) return `${days} day${days !== 1 ? "s" : ""} ${remHours}h`
    return `${hours} hour${hours !== 1 ? "s" : ""}`
  }, [startTime, endTime])

  // Status preview
  const statusPreview = useMemo(() => {
    if (!startTime || !endTime) return null
    const now = Date.now()
    const start = new Date(startTime).getTime()
    const end = new Date(endTime).getTime()
    if (now < start) return { label: "Upcoming", color: "bg-blue-50 text-blue-700 border-blue-200" }
    if (now > end) return { label: "Ended", color: "bg-gray-50 text-gray-600 border-gray-200" }
    return { label: "Active", color: "bg-green-50 text-green-700 border-green-200" }
  }, [startTime, endTime])

  // Category products count
  const catProducts = categoryId ? products.filter((p) => p.categoryId === categoryId) : []

  function calcSalePrice(item: SaleItem): number {
    const product = productMap.get(item.productId)
    if (!product) return 0
    const dv = parseFloat(item.discountValue) || 0
    if (item.discountType === "PERCENTAGE") return product.price * (1 - dv / 100)
    return product.price - dv
  }

  function calcSavings(item: SaleItem): { pct: number; amount: number } {
    const product = productMap.get(item.productId)
    if (!product) return { pct: 0, amount: 0 }
    const sp = Math.max(0, calcSalePrice(item))
    const amount = product.price - sp
    const pct = product.price > 0 ? (amount / product.price) * 100 : 0
    return { pct: Math.round(pct), amount }
  }

  // Summary stats
  const avgDiscount = items.length > 0
    ? Math.round(items.reduce((sum, item) => sum + calcSavings(item).pct, 0) / items.length)
    : 0

  function addItem() {
    if (products.length === 0) return
    setItems((prev) => [
      ...prev,
      { productId: products[0].id, discountType: "PERCENTAGE", discountValue: "10", maxQuantity: "" },
    ])
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateItem(idx: number, field: keyof SaleItem, value: string) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)))
  }

  function handleSubmit() {
    startTransition(async () => {
      const data = {
        title,
        titleEn,
        startTime,
        endTime,
        saleMode,
        categoryId: saleMode === "CATEGORY" ? categoryId : undefined,
        categoryDiscount: saleMode === "CATEGORY" ? parseFloat(catDiscountValue) || 0 : undefined,
        categoryDiscountType: saleMode === "CATEGORY" ? catDiscountType : undefined,
        items: saleMode === "PRODUCTS"
          ? items.map((item) => ({
              productId: item.productId,
              discountType: item.discountType as "PERCENTAGE" | "FIXED",
              discountValue: parseFloat(item.discountValue) || 0,
              maxQuantity: item.maxQuantity ? parseInt(item.maxQuantity) : undefined,
            }))
          : [],
      }
      if (saleId) {
        await updateFlashSale(saleId, data)
      } else {
        await createFlashSale(data)
      }
    })
  }

  const canSubmit = title && titleEn && startTime && endTime &&
    (saleMode === "PRODUCTS" ? items.length > 0 : categoryId)

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(["PRODUCTS", "CATEGORY"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setSaleMode(mode)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              saleMode === mode ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {mode === "PRODUCTS" ? "Select Products" : "Entire Category"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
        {/* LEFT — Sale Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h3 className="text-sm font-semibold text-gray-900">Sale Settings</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Title (English)</label>
              <input type="text" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder="Summer Sale" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Title (Georgian)</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ზაფხულის ფასდაკლება" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Start</label>
              <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">End</label>
              <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass} />
            </div>
          </div>

          {/* Duration + status */}
          <div className="flex items-center gap-3">
            {duration && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                Lasts {duration}
              </span>
            )}
            {statusPreview && (
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusPreview.color}`}>
                {statusPreview.label}
              </span>
            )}
          </div>
        </div>

        {/* RIGHT — Category mode settings or summary */}
        {saleMode === "CATEGORY" ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <h3 className="text-sm font-semibold text-gray-900">Category Discount</h3>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={inputClass}
              >
                <option value="">— Select category —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nameEn} ({c.productCount} products)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Discount</label>
              <div className="flex gap-2">
                <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
                  {(["PERCENTAGE", "FIXED"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCatDiscountType(t)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                        catDiscountType === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                      }`}
                    >
                      {t === "PERCENTAGE" ? "%" : "₾"}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={catDiscountValue}
                  onChange={(e) => setCatDiscountValue(e.target.value)}
                  min="0"
                  className={inputClass}
                />
              </div>
            </div>

            {categoryId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <p className="text-sm text-blue-800">
                  All <span className="font-bold">{catProducts.length}</span> products in{" "}
                  <span className="font-bold">{categories.find((c) => c.id === categoryId)?.nameEn}</span>{" "}
                  will be discounted by{" "}
                  <span className="font-bold">{catDiscountType === "PERCENTAGE" ? `${catDiscountValue}%` : `₾${catDiscountValue}`}</span>
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center text-center">
            <p className="text-3xl font-bold text-gray-900">{items.length}</p>
            <p className="text-sm text-gray-500">products on sale</p>
            {items.length > 0 && (
              <p className="mt-2 text-sm text-green-600 font-medium">avg {avgDiscount}% off</p>
            )}
          </div>
        )}
      </div>

      {/* PRODUCTS MODE — Product cards */}
      {saleMode === "PRODUCTS" && (
        <div className="space-y-3">
          {items.map((item, i) => {
            const product = productMap.get(item.productId)
            const salePrice = Math.max(0, calcSalePrice(item))
            const savings = calcSavings(item)
            return (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 relative">
                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>

                <div className="flex items-center gap-4">
                  {/* Product selector + image */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {product?.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-100 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <select
                        value={item.productId}
                        onChange={(e) => updateItem(i, "productId", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-2.5 py-2 text-sm"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.nameEn}</option>
                        ))}
                      </select>
                      {product && <p className="text-xs text-gray-400 mt-0.5">Original: ₾{product.price.toFixed(2)}</p>}
                    </div>
                  </div>

                  {/* Discount type toggle */}
                  <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5 shrink-0">
                    {(["PERCENTAGE", "FIXED"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => updateItem(i, "discountType", t)}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                          item.discountType === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                        }`}
                      >
                        {t === "PERCENTAGE" ? "%" : "₾"}
                      </button>
                    ))}
                  </div>

                  {/* Discount value */}
                  <input
                    type="number"
                    value={item.discountValue}
                    onChange={(e) => updateItem(i, "discountValue", e.target.value)}
                    min="0"
                    className="w-20 rounded-lg border border-gray-300 px-2.5 py-2 text-sm text-center"
                  />

                  {/* Sale price result */}
                  <div className="w-28 text-right shrink-0">
                    <p className="text-lg font-bold text-red-600">₾{salePrice.toFixed(2)}</p>
                    {savings.pct > 0 && (
                      <span className="inline-flex items-center rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                        Save {savings.pct}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Add product button */}
          <button
            type="button"
            onClick={addItem}
            className="w-full rounded-xl border-2 border-dashed border-gray-300 py-4 text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-colors"
          >
            + Add Product
          </button>
        </div>
      )}

      {/* Sticky save bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-8 px-8 py-4 flex items-center justify-between rounded-b-xl">
        <div className="text-sm text-gray-500">
          {saleMode === "PRODUCTS" ? (
            <span><span className="font-semibold text-gray-900">{items.length}</span> products on sale{items.length > 0 && ` — avg ${avgDiscount}% discount`}</span>
          ) : (
            categoryId ? (
              <span><span className="font-semibold text-gray-900">{catProducts.length}</span> products in category</span>
            ) : (
              <span>Select a category</span>
            )
          )}
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !canSubmit}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Saving…" : saleId ? "Update Sale" : "Create Sale"}
        </button>
      </div>
    </div>
  )
}
