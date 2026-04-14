"use client"

import { useOptimistic, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toggleWishlist } from "@/lib/actions/wishlist"
import { useAuth } from "@/lib/authContext"
import { useGuestWishlist } from "@/lib/guestWishlist"

export default function WishlistButton({
  productId,
  isWishlisted: initialWishlisted,
  isLoggedIn: isLoggedInProp,
  size = "md",
}: {
  productId: string
  isWishlisted: boolean
  isLoggedIn?: boolean
  size?: "sm" | "md"
}) {
  const auth = useAuth()
  const guestWishlist = useGuestWishlist()
  const isLoggedIn = isLoggedInProp ?? auth.isLoggedIn
  const [authWishlisted, setAuthWishlisted] = useOptimistic(
    initialWishlisted,
    (_currentState, nextState: boolean) => nextState
  )
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const wishlisted = isLoggedIn
    ? authWishlisted
    : guestWishlist.mounted
      ? guestWishlist.isWishlisted(productId)
      : initialWishlisted

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!isLoggedIn) {
      guestWishlist.toggle(productId)
      return
    }

    const previous = authWishlisted
    setAuthWishlisted(!previous)

    startTransition(async () => {
      try {
        const result = await toggleWishlist(productId)
        setAuthWishlisted(result)
        router.refresh()
      } catch {
        setAuthWishlisted(previous)
      }
    })
  }

  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5"
  const btnSize = size === "sm" ? "w-8 h-8" : "w-9 h-9"

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending || (!isLoggedIn && !guestWishlist.mounted)}
      className={`${btnSize} flex items-center justify-center rounded-lg border shadow-sm transition-colors disabled:opacity-60 ${
        wishlisted
          ? "bg-red-50 text-red-500 border-red-200 hover:bg-red-100"
          : "bg-white text-gray-400 border-gray-200 hover:text-red-500 hover:bg-red-50 hover:border-red-200"
      }`}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={wishlisted}
    >
      <svg
        className={iconSize}
        viewBox="0 0 24 24"
        fill={wishlisted ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    </button>
  )
}
