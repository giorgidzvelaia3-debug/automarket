export function normalizeWishlistProductIds(productIds: string[]): string[] {
  const seen = new Set<string>()
  const normalized: string[] = []

  for (const productId of productIds) {
    const id = productId.trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    normalized.push(id)
  }

  return normalized
}

export function toggleWishlistProductId(
  productIds: string[],
  productId: string
): string[] {
  const id = productId.trim()
  if (!id) return normalizeWishlistProductIds(productIds)

  const normalized = normalizeWishlistProductIds(productIds)
  return normalized.includes(id)
    ? normalized.filter((itemId) => itemId !== id)
    : [...normalized, id]
}

export function filterWishlistProductIds(
  productIds: string[],
  allowedProductIds: Iterable<string>
): string[] {
  const allowed = new Set(allowedProductIds)
  return normalizeWishlistProductIds(productIds).filter((productId) =>
    allowed.has(productId)
  )
}

export function getWishlistProductIdsToCreate(
  existingProductIds: Iterable<string>,
  incomingProductIds: string[]
): string[] {
  const existing = new Set(existingProductIds)
  return normalizeWishlistProductIds(incomingProductIds).filter(
    (productId) => !existing.has(productId)
  )
}
