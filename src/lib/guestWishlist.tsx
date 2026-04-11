"use client"

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import {
  normalizeWishlistProductIds,
  toggleWishlistProductId,
} from "@/lib/wishlistUtils"

export const GUEST_WISHLIST_STORAGE_KEY = "automarket_guest_wishlist"
const EMPTY_WISHLIST: string[] = []
const listeners = new Set<() => void>()

type GuestWishlistContextValue = {
  items: string[]
  count: number
  mounted: boolean
  isWishlisted: (productId: string) => boolean
  toggle: (productId: string) => void
  clear: () => void
  replace: (productIds: string[]) => void
}

const GuestWishlistContext = createContext<GuestWishlistContextValue | null>(null)

let cachedWishlistSnapshot = EMPTY_WISHLIST

function subscribeToMountState() {
  return () => {}
}

function haveSameItems(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((productId, index) => productId === right[index])
  )
}

function readGuestWishlistFromStorage(): string[] {
  if (typeof window === "undefined") return EMPTY_WISHLIST

  try {
    const raw = localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY)
    if (!raw) return EMPTY_WISHLIST

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? normalizeWishlistProductIds(
          parsed.filter((item): item is string => typeof item === "string")
        )
      : EMPTY_WISHLIST
  } catch {
    return EMPTY_WISHLIST
  }
}

function getGuestWishlistSnapshot() {
  const nextSnapshot = readGuestWishlistFromStorage()

  if (haveSameItems(cachedWishlistSnapshot, nextSnapshot)) {
    return cachedWishlistSnapshot
  }

  cachedWishlistSnapshot =
    nextSnapshot.length === 0 ? EMPTY_WISHLIST : nextSnapshot

  return cachedWishlistSnapshot
}

function getGuestWishlistServerSnapshot() {
  return EMPTY_WISHLIST
}

function subscribeToGuestWishlist(onChange: () => void) {
  listeners.add(onChange)

  if (typeof window === "undefined") {
    return () => {
      listeners.delete(onChange)
    }
  }

  function handleStorageChange(event: StorageEvent) {
    if (event.key && event.key !== GUEST_WISHLIST_STORAGE_KEY) return
    getGuestWishlistSnapshot()
    onChange()
  }

  window.addEventListener("storage", handleStorageChange)

  return () => {
    listeners.delete(onChange)
    window.removeEventListener("storage", handleStorageChange)
  }
}

function notifyGuestWishlistListeners() {
  for (const listener of listeners) {
    listener()
  }
}

export function readGuestWishlist(): string[] {
  return getGuestWishlistSnapshot()
}

function writeGuestWishlist(productIds: string[]) {
  const normalized = normalizeWishlistProductIds(productIds)

  cachedWishlistSnapshot =
    normalized.length === 0 ? EMPTY_WISHLIST : normalized

  if (typeof window === "undefined") {
    return
  }

  if (normalized.length === 0) {
    localStorage.removeItem(GUEST_WISHLIST_STORAGE_KEY)
    notifyGuestWishlistListeners()
    return
  }

  localStorage.setItem(GUEST_WISHLIST_STORAGE_KEY, JSON.stringify(normalized))
  notifyGuestWishlistListeners()
}

export function GuestWishlistProvider({
  children,
}: {
  children: ReactNode
}) {
  const items = useSyncExternalStore(
    subscribeToGuestWishlist,
    getGuestWishlistSnapshot,
    getGuestWishlistServerSnapshot
  )
  const mounted = useSyncExternalStore(
    subscribeToMountState,
    () => true,
    () => false
  )

  const isWishlisted = useCallback(
    (productId: string) => items.includes(productId),
    [items]
  )

  const toggle = useCallback((productId: string) => {
    const nextItems = toggleWishlistProductId(readGuestWishlist(), productId)
    writeGuestWishlist(nextItems)
  }, [])

  const clear = useCallback(() => {
    writeGuestWishlist([])
  }, [])

  const replace = useCallback((productIds: string[]) => {
    writeGuestWishlist(normalizeWishlistProductIds(productIds))
  }, [])

  return (
    <GuestWishlistContext.Provider
      value={{
        items,
        count: items.length,
        mounted,
        isWishlisted,
        toggle,
        clear,
        replace,
      }}
    >
      {children}
    </GuestWishlistContext.Provider>
  )
}

export function useGuestWishlist() {
  const context = useContext(GuestWishlistContext)
  if (!context) {
    throw new Error("useGuestWishlist must be used within GuestWishlistProvider")
  }

  return context
}
