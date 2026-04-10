"use client"

import { useCallback, useSyncExternalStore } from "react"

const STORAGE_KEY = "search-history"
const MAX_ITEMS = 8

let listeners: Array<() => void> = []
function subscribe(cb: () => void) {
  listeners.push(cb)
  return () => { listeners = listeners.filter((l) => l !== cb) }
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

export function useSearchHistory() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const items: string[] = JSON.parse(raw)

  const add = useCallback((term: string) => {
    const trimmed = term.trim()
    if (!trimmed) return
    const current: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")
    const filtered = current.filter((t) => t.toLowerCase() !== trimmed.toLowerCase())
    const next = [trimmed, ...filtered].slice(0, MAX_ITEMS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    emitChange()
  }, [])

  const remove = useCallback((term: string) => {
    const current: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")
    const next = current.filter((t) => t !== term)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    emitChange()
  }, [])

  const clear = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "[]")
    emitChange()
  }, [])

  return { items, add, remove, clear }
}
