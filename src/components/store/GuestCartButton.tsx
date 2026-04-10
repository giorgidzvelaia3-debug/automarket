"use client"

import { useState, useEffect } from "react"
import { getGuestCartCount } from "@/lib/guestCart"
import { useCartDrawer } from "@/lib/cartDrawerContext"

export default function GuestCartButton() {
  const { open } = useCartDrawer()
  const [count, setCount] = useState(0)

  useEffect(() => {
    setCount(getGuestCartCount())

    function onCartChange() {
      setCount(getGuestCartCount())
    }

    window.addEventListener("guest-cart-change", onCartChange)
    window.addEventListener("storage", onCartChange)
    return () => {
      window.removeEventListener("guest-cart-change", onCartChange)
      window.removeEventListener("storage", onCartChange)
    }
  }, [])

  return (
    <button
      type="button"
      onClick={() => open("cart")}
      className="relative flex items-center justify-center w-8 h-8 text-gray-600 hover:text-blue-600 transition-colors"
      aria-label={`Cart (${count} items)`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.836l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.273M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold leading-none">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  )
}
