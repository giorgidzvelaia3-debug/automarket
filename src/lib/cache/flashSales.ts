import { unstable_cache } from "next/cache"
import { getFlashSalesForProducts as _getFlashSalesForProducts } from "@/lib/actions/flashSales"

/**
 * Cached version of getFlashSalesForProducts.
 * TTL: 2 minutes. Revalidated by flash sale mutations via tag.
 */
export const getCachedFlashSalesForProducts = unstable_cache(
  async (productIds: string[]) => {
    const map = await _getFlashSalesForProducts(productIds)
    // unstable_cache can't serialize Map, convert to array of entries
    return Array.from(map.entries())
  },
  ["flash-sales-for-products"],
  { revalidate: 120, tags: ["flash-sales"] }
)

/** Helper to convert cached result back to Map */
export async function getFlashSalesForProductsCached(
  productIds: string[]
): Promise<Map<string, { salePrice: number; originalPrice: number; discountType: "PERCENTAGE" | "FIXED"; discountValue: number; endTime: string; title: string }>> {
  if (productIds.length === 0) return new Map()
  const entries = await getCachedFlashSalesForProducts(productIds)
  return new Map(entries)
}
