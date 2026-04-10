"use client"

import { useCallback, useSyncExternalStore } from "react"

const STORAGE_KEY = "recently-viewed"
const MAX_ITEMS = 10

export type RecentlyViewedItem = {
  id: string
  slug: string
  name: string
  nameEn: string
  price: number
  image: string | null
  viewedAt: number
}

// ── external store so every consumer re-renders on change ──
let listeners: Array<() => void> = []
function subscribe(cb: () => void) {
  listeners.push(cb)
  return () => {
    listeners = listeners.filter((l) => l !== cb)
  }
}
function emitChange() {
  for (const l of listeners) l()
}

function getSnapshot(): string {
  if (typeof window === "undefined") return "[]"
  return localStorage.getItem(STORAGE_KEY) ?? "[]"
}

function getServerSnapshot(): string {
  return "[]"
}

export function useRecentlyViewed() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const items: RecentlyViewedItem[] = JSON.parse(raw)

  const add = useCallback((item: Omit<RecentlyViewedItem, "viewedAt">) => {
    const current: RecentlyViewedItem[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "[]"
    )
    const filtered = current.filter((i) => i.id !== item.id)
    const next = [{ ...item, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    emitChange()
  }, [])

  return { items, add }
}
