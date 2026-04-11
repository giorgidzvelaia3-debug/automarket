"use client"

export type GuestCartItem = {
  productId: string
  variantId?: string | null
  variantName?: string | null
  variantNameEn?: string | null
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

function cartKey(item: { productId: string; variantId?: string | null }) {
  return `${item.productId}::${item.variantId ?? ""}`
}

export function addToGuestCart(item: GuestCartItem) {
  const cart = getGuestCart()
  const key = cartKey(item)
  const existing = cart.find((i) => cartKey(i) === key)
  if (existing) {
    existing.quantity = Math.min(existing.quantity + item.quantity, item.stock)
    existing.price = item.price // update price in case flash sale changed
  } else {
    cart.push(item)
  }
  saveCart(cart)
}

export function removeFromGuestCart(productId: string, variantId?: string | null) {
  const key = `${productId}::${variantId ?? ""}`
  const cart = getGuestCart().filter((i) => cartKey(i) !== key)
  saveCart(cart)
}

export function updateGuestCartQuantity(productId: string, quantity: number, variantId?: string | null) {
  const cart = getGuestCart()
  const key = `${productId}::${variantId ?? ""}`
  if (quantity < 1) {
    saveCart(cart.filter((i) => cartKey(i) !== key))
    return
  }
  const item = cart.find((i) => cartKey(i) === key)
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
