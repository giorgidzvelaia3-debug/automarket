"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toggleWishlist } from "@/lib/actions/wishlist"
import { useAuth } from "@/lib/authContext"

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
  const isLoggedIn = isLoggedInProp ?? auth.isLoggedIn
  const [wishlisted, setWishlisted] = useState(initialWishlisted)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!isLoggedIn) {
      router.push("/login")
      return
    }

    // Optimistic update
    setWishlisted((prev) => !prev)

    startTransition(async () => {
      try {
        const result = await toggleWishlist(productId)
        setWishlisted(result)
      } catch {
        setWishlisted(wishlisted)
      }
    })
  }

  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5"
  const btnSize = size === "sm" ? "w-7 h-7" : "w-9 h-9"

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`${btnSize} flex items-center justify-center rounded-full transition-all ${
        wishlisted
          ? "bg-red-50 text-red-500 hover:bg-red-100"
          : "bg-white/80 text-gray-400 hover:text-red-500 hover:bg-red-50"
      } backdrop-blur-sm border border-gray-200/60 shadow-sm disabled:opacity-60`}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
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
