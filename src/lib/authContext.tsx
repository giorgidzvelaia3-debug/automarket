"use client"

import { createContext, useContext, type ReactNode } from "react"

type AuthState = {
  isLoggedIn: boolean
  userId: string | null
}

const AuthContext = createContext<AuthState>({ isLoggedIn: false, userId: null })

export function AuthProvider({
  isLoggedIn,
  userId,
  children,
}: AuthState & { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ isLoggedIn, userId }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
