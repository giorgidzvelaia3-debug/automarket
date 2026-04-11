"use client"

import { useState, useTransition, useCallback } from "react"
import { addToCart } from "@/lib/actions/cart"
import { addToGuestCart, type GuestCartItem } from "@/lib/guestCart"

export type AddToCartParams = {
  productId: string
  quantity?: number
  variantId?: string | null
  /** Required for guest checkout */
  guest?: Omit<GuestCartItem, "productId" | "quantity">
}

/**
 * Unified add-to-cart logic for logged-in and guest users.
 * Handles server action, guest localStorage, event dispatching, and status feedback.
 */
export function useAddToCart(
  isLoggedIn: boolean,
  options?: { onSuccess?: () => void; timeout?: number },
) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [isPending, startTransition] = useTransition()
  const timeout = options?.timeout ?? 2500

  const add = useCallback(
    (params: AddToCartParams) => {
      const { productId, quantity = 1, variantId, guest } = params

      if (isLoggedIn) {
        startTransition(async () => {
          try {
            await addToCart(productId, quantity, variantId ?? undefined)
            setStatus("success")
            window.dispatchEvent(new Event("cart-change"))
            window.dispatchEvent(new Event("cart-drawer-open"))
            options?.onSuccess?.()
            setTimeout(() => setStatus("idle"), timeout)
          } catch {
            setStatus("error")
            setTimeout(() => setStatus("idle"), timeout)
          }
        })
      } else if (guest) {
        try {
          addToGuestCart({
            productId,
            variantId: variantId ?? null,
            variantName: guest.variantName ?? null,
            variantNameEn: guest.variantNameEn ?? null,
            vendorId: guest.vendorId,
            vendorName: guest.vendorName,
            vendorSlug: guest.vendorSlug,
            quantity,
            price: guest.price,
            name: guest.name,
            nameEn: guest.nameEn,
            image: guest.image,
            stock: guest.stock,
          })
          setStatus("success")
          window.dispatchEvent(new Event("guest-cart-change"))
          window.dispatchEvent(new Event("cart-drawer-open"))
          options?.onSuccess?.()
          setTimeout(() => setStatus("idle"), timeout)
        } catch {
          setStatus("error")
          setTimeout(() => setStatus("idle"), timeout)
        }
      }
    },
    [isLoggedIn, options, timeout],
  )

  return { add, status, isPending }
}
