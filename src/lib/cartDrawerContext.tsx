"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

type CartDrawerState = {
  isOpen: boolean
  activeTab: "cart" | "recent"
  open: (tab?: "cart" | "recent") => void
  close: () => void
  setTab: (tab: "cart" | "recent") => void
}

const CartDrawerContext = createContext<CartDrawerState>({
  isOpen: false,
  activeTab: "cart",
  open: () => {},
  close: () => {},
  setTab: () => {},
})

export function CartDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"cart" | "recent">("cart")

  const open = useCallback((tab: "cart" | "recent" = "cart") => {
    setActiveTab(tab)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => setIsOpen(false), [])

  // Auto-open on add to cart
  useEffect(() => {
    function onDrawerOpen() {
      setActiveTab("cart")
      setIsOpen(true)
    }
    window.addEventListener("cart-drawer-open", onDrawerOpen)
    return () => window.removeEventListener("cart-drawer-open", onDrawerOpen)
  }, [])

  return (
    <CartDrawerContext.Provider value={{ isOpen, activeTab, open, close, setTab: setActiveTab }}>
      {children}
    </CartDrawerContext.Provider>
  )
}

export function useCartDrawer() {
  return useContext(CartDrawerContext)
}
