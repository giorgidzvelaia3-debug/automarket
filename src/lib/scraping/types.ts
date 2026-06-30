// Shared types for the aggregated-product scraping layer.

export type OfferAvailabilityValue = "IN_STOCK" | "OUT_OF_STOCK" | "UNKNOWN"

export type ProductSpecs = Record<string, string>

/** One product as scraped from a source's category listing. */
export type ScrapedOffer = {
  rawName: string
  /** Absolute, canonical product-page URL. The upsert key together with sourceId. */
  sourceUrl: string
  /** Absolute image URL — hotlinked, never re-uploaded to our storage. */
  sourceImageUrl?: string
  price: number
  originalPrice?: number
  discountPercent?: number
  availability: OfferAvailabilityValue
  /** Inline key/value characteristics, when the source exposes them in the listing. */
  specs?: ProductSpecs
}

/** Source row config stored in `Source.config` (Json). */
export type SourceConfig = {
  defaultCategorySlug?: string
  categoryUrls?: string[]
  pagesMax?: number
  apiEndpoint?: string
  [key: string]: unknown
}

/** Minimal shape of a Source the adapters need (avoids importing Prisma types here). */
export type SourceLike = {
  id: string
  slug: string
  name: string
  baseUrl: string
  config: SourceConfig | null
}

export interface SourceAdapter {
  slug: string
  kind: "STATIC_HTML" | "JS_RENDERED"
  /** Yields offers across all configured category pages. */
  scrape(source: SourceLike): AsyncGenerator<ScrapedOffer>
  /**
   * Optional: fetch key/value characteristics from a single product page.
   * Called lazily by the sync (only for offers that don't have specs yet), so
   * each product page is fetched at most once. Returns null if unavailable.
   */
  fetchSpecs?(sourceUrl: string): Promise<ProductSpecs | null>
}

export type SyncResult = {
  status: "SUCCESS" | "PARTIAL" | "FAILED"
  offersSeen: number
  offersNew: number
  offersUpdated: number
  offersMissing: number
  proposalsCreated: number
  error?: string
}
