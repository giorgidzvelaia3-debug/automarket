"use client"

import { useEffect, useRef } from "react"
import { getGuestCart, clearGuestCart } from "@/lib/guestCart"
import { mergeGuestCart } from "@/lib/actions/mergeCart"

export default function CartMerge() {
  const merged = useRef(false)

  useEffect(() => {
    if (merged.current) return
    merged.current = true

    const guestItems = getGuestCart()
    if (guestItems.length === 0) return

    const items = guestItems.map((i) => ({
      productId: i.productId,
      vendorId: i.vendorId,
      quantity: i.quantity,
    }))

    mergeGuestCart(items).then(() => {
      clearGuestCart()
      window.dispatchEvent(new Event("guest-cart-change"))
    })
  }, [])

  return null
}
