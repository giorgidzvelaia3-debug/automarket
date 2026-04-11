export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED"

export type LimitCheckItem = {
  vendorId: string
  price: number
  quantity: number
}

export type GuestCartEntry = {
  productId: string
  vendorId: string
  quantity: number
  price: number
  variantId?: string | null
  variantName?: string | null
}

/**
 * Get the effective price from a cart item.
 * Priority: stored cart price (flash-sale snapshot) > variant > product
 */
export function getCartItemPrice(item: {
  price?: unknown
  product: { price: unknown }
  variant?: { price: unknown } | null
}): number {
  if (item.price != null) return Number(item.price)
  return Number(item.variant?.price ?? item.product.price)
}
