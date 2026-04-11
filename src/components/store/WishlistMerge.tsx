"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { mergeGuestWishlist } from "@/lib/actions/wishlist"
import { useGuestWishlist } from "@/lib/guestWishlist"

export default function WishlistMerge() {
  const { items, mounted, clear } = useGuestWishlist()
  const router = useRouter()
  const lastAttempted = useRef<string | null>(null)

  useEffect(() => {
    if (!mounted || items.length === 0) return

    const mergeKey = items.join("::")
    if (lastAttempted.current === mergeKey) return
    lastAttempted.current = mergeKey

    mergeGuestWishlist(items)
      .then(() => {
        clear()
        router.refresh()
      })
      .catch(() => {
        lastAttempted.current = null
      })
  }, [clear, items, mounted, router])

  return null
}
