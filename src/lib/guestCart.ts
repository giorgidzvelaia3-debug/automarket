"use client"

export type GuestCartItem = {
  productId: string
  vendorId: string
  vendorName: string
  vendorSlug: string
  quantity: number
  price: number
  name: string
  nameEn: string
  image: string | null
  stock: number
}

const STORAGE_KEY = "automarket_guest_cart"

export function getGuestCart(): GuestCartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCart(items: GuestCartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function addToGuestCart(item: GuestCartItem) {
  const cart = getGuestCart()
  const existing = cart.find((i) => i.productId === item.productId)
  if (existing) {
    existing.quantity = Math.min(existing.quantity + item.quantity, item.stock)
  } else {
    cart.push(item)
  }
  saveCart(cart)
}

export function removeFromGuestCart(productId: string) {
  const cart = getGuestCart().filter((i) => i.productId !== productId)
  saveCart(cart)
}

export function updateGuestCartQuantity(productId: string, quantity: number) {
  const cart = getGuestCart()
  if (quantity < 1) {
    saveCart(cart.filter((i) => i.productId !== productId))
    return
  }
  const item = cart.find((i) => i.productId === productId)
  if (item) {
    item.quantity = Math.min(quantity, item.stock)
  }
  saveCart(cart)
}

export function clearGuestCart() {
  localStorage.removeItem(STORAGE_KEY)
}

export function getGuestCartCount(): number {
  return getGuestCart().length
}
