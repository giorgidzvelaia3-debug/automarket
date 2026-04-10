"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

type AuthModalState = {
  isOpen: boolean
  tab: "login" | "register"
  open: (tab?: "login" | "register") => void
  close: () => void
  setTab: (tab: "login" | "register") => void
}

const AuthModalContext = createContext<AuthModalState>({
  isOpen: false,
  tab: "login",
  open: () => {},
  close: () => {},
  setTab: () => {},
})

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [tab, setTab] = useState<"login" | "register">("login")

  const open = useCallback((t: "login" | "register" = "login") => {
    setTab(t)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => setIsOpen(false), [])

  return (
    <AuthModalContext.Provider value={{ isOpen, tab, open, close, setTab }}>
      {children}
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  return useContext(AuthModalContext)
}
