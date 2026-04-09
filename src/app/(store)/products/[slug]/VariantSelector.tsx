"use client"

import { useState, useEffect, useRef } from "react"

type Variant = {
  id: string
  name: string
  nameEn: string
  price: number
  stock: number
}

export default function VariantSelector({
  variants,
  onSelect,
}: {
  variants: Variant[]
  onSelect: (variant: Variant) => void
}) {
  const defaultIdx = variants.findIndex((v) => v.stock > 0)
  const [selectedId, setSelectedId] = useState(
    variants[defaultIdx >= 0 ? defaultIdx : 0]?.id ?? ""
  )
  const firedInitial = useRef(false)

  // Fire initial selection once on mount
  useEffect(() => {
    if (firedInitial.current) return
    firedInitial.current = true
    const initial = variants.find((v) => v.id === selectedId)
    if (initial) onSelect(initial)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSelect(v: Variant) {
    if (v.stock === 0) return
    setSelectedId(v.id)
    onSelect(v)
  }

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Choose variant
      </p>
      <div className="flex flex-wrap gap-2">
        {variants.map((v) => {
          const isSelected = v.id === selectedId
          const isOutOfStock = v.stock === 0

          return (
            <button
              key={v.id}
              type="button"
              onClick={() => handleSelect(v)}
              disabled={isOutOfStock}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                isSelected
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                  : isOutOfStock
                    ? "bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed line-through"
                    : "bg-white border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
              }`}
              title={isOutOfStock ? "Out of stock" : `${v.name} — ₾${v.price.toFixed(2)}`}
            >
              {v.name}
              <span className="ml-1.5 text-xs opacity-70">₾{v.price.toFixed(2)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
