"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

export type CompareProduct = {
  id: string
  slug: string
  name: string
  nameEn: string
  price: number
  image: string | null
}

type CompareContextType = {
  items: CompareProduct[]
  addToCompare: (product: CompareProduct) => void
  removeFromCompare: (productId: string) => void
  clearCompare: () => void
  isInCompare: (productId: string) => boolean
  isFull: boolean
}

const MAX_COMPARE = 3
const STORAGE_KEY = "automarket_compare"

const CompareContext = createContext<CompareContextType | null>(null)

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareProduct[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch {}
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, mounted])

  const addToCompare = useCallback((product: CompareProduct) => {
    setItems((prev) => {
      if (prev.length >= MAX_COMPARE) return prev
      if (prev.some((p) => p.id === product.id)) return prev
      return [...prev, product]
    })
  }, [])

  const removeFromCompare = useCallback((productId: string) => {
    setItems((prev) => prev.filter((p) => p.id !== productId))
  }, [])

  const clearCompare = useCallback(() => {
    setItems([])
  }, [])

  const isInCompare = useCallback(
    (productId: string) => items.some((p) => p.id === productId),
    [items]
  )

  return (
    <CompareContext.Provider
      value={{
        items,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        isFull: items.length >= MAX_COMPARE,
      }}
    >
      {children}
    </CompareContext.Provider>
  )
}

export function useCompare() {
  const ctx = useContext(CompareContext)
  if (!ctx) throw new Error("useCompare must be used within CompareProvider")
  return ctx
}
