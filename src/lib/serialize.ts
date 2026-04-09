/**
 * Centralized serialization helpers for converting Prisma Decimal types
 * to plain numbers before passing to Client Components.
 */

export function toNum(val: unknown): number {
  if (val === null || val === undefined) return 0
  return Number(val)
}

export function toNumOrNull(val: unknown): number | null {
  if (val === null || val === undefined) return null
  return Number(val)
}

/**
 * Serialize a cart item's Decimal fields.
 */
export function serializeCartItem<T extends Record<string, unknown>>(item: T & {
  price?: unknown
  product: { price: unknown } & Record<string, unknown>
  variant?: { price: unknown } | null
}) {
  return {
    ...item,
    price: item.price != null ? toNum(item.price) : null,
    product: { ...item.product, price: toNum(item.product.price) },
    variant: item.variant
      ? { ...item.variant, price: toNum(item.variant.price) }
      : null,
  }
}

/**
 * Serialize a withdrawal's Decimal fields.
 */
export function serializeWithdrawal<T extends { amount: unknown }>(w: T) {
  return { ...w, amount: toNum(w.amount) }
}
