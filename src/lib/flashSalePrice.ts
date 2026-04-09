/**
 * Pure helpers for flash sale price calculation.
 * Used both server-side and client-side.
 */

export type FlashSaleInfo = {
  salePrice: number
  originalPrice: number
  discountType: "PERCENTAGE" | "FIXED"
  discountValue: number
  endTime: string
}

/**
 * Apply flash sale discount to a price.
 * Used to compute variant prices when a flash sale exists at product level.
 */
export function applyDiscount(
  basePrice: number,
  discountType: "PERCENTAGE" | "FIXED",
  discountValue: number
): number {
  if (discountType === "PERCENTAGE") {
    return Math.max(0, Math.round(basePrice * (1 - discountValue / 100) * 100) / 100)
  }
  return Math.max(0, Math.round((basePrice - discountValue) * 100) / 100)
}

/**
 * Calculate effective price for a product+variant combo.
 * If flashSale exists: apply discount to variant price (or use salePrice when no variant).
 * Otherwise return the variant or product price.
 */
export function getEffectivePrice(
  productPrice: number,
  variantPrice: number | null,
  flashSale: FlashSaleInfo | null
): number {
  const basePrice = variantPrice ?? productPrice
  if (!flashSale) return basePrice

  // No variant: use stored salePrice directly
  if (variantPrice == null) return Number(flashSale.salePrice)

  // With variant: apply discount to variant price
  return applyDiscount(variantPrice, flashSale.discountType, flashSale.discountValue)
}
