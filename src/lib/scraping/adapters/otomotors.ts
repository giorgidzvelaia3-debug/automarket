import type { ProductSpecs, ScrapedOffer, SourceAdapter, SourceLike } from "../types"
import { fetchJson, politeDelay } from "../http"

// otomotors.shop is a Nuxt SPA backed by a JSON API (discovered, not headless):
//   https://api.otomotors.shop/api/getProductsNew/{categoryId}?page={n}
// Response: { products: [...], total_products, category_name, ... }
// Outbound product page: https://otomotors.shop/product-detail/{ID}

const API_BASE = "https://api.otomotors.shop/api/getProductsNew"
const PRODUCT_URL = "https://otomotors.shop/product-detail"

type OtoOption = {
  name?: string
  title?: string
  static_titles?: string | null
}

type OtoProduct = {
  ID: number
  title?: string
  sku?: string
  price?: number
  sale_price?: number
  stock?: number
  img_url?: string
  brand_text?: string
  options?: OtoOption[]
}

type OtoResponse = {
  products?: OtoProduct[]
  total_products?: number
}

/** Category id is the trailing number of a slug like "dzravis-zetebi-679". */
function categoryIdFromUrl(url: string): string | null {
  const m = url.match(/-(\d+)\/?$/)
  return m ? m[1] : null
}

function buildSpecs(p: OtoProduct): ProductSpecs {
  const specs: ProductSpecs = {}
  if (p.brand_text) specs["ბრენდი"] = p.brand_text
  for (const opt of p.options ?? []) {
    const key = opt.name?.trim()
    const value = (opt.static_titles ?? opt.title)?.toString().trim()
    if (key && value) specs[key] = value
  }
  if (p.sku) specs["კოდი"] = String(p.sku)
  return specs
}

export const otomotorsAdapter: SourceAdapter = {
  slug: "otomotors",
  kind: "JS_RENDERED",

  async *scrape(source: SourceLike): AsyncGenerator<ScrapedOffer> {
    const config = source.config ?? {}
    const categoryUrls = config.categoryUrls ?? []
    const pagesMax = config.pagesMax ?? 15

    for (const categoryUrl of categoryUrls) {
      const categoryId = categoryIdFromUrl(categoryUrl)
      if (!categoryId) continue

      for (let page = 1; page <= pagesMax; page++) {
        let data: OtoResponse
        try {
          data = await fetchJson<OtoResponse>(`${API_BASE}/${categoryId}?page=${page}`)
        } catch {
          break
        }

        const products = data.products ?? []
        if (products.length === 0) break

        for (const p of products) {
          if (!p.ID || !p.title) continue
          const salePrice = p.sale_price && p.sale_price > 0 ? p.sale_price : null
          const basePrice = p.price ?? 0
          const price = salePrice ?? basePrice
          if (!price || price <= 0) continue

          const discountPercent =
            salePrice && basePrice > salePrice
              ? Math.round(((basePrice - salePrice) / basePrice) * 100)
              : undefined

          yield {
            rawName: p.title.trim(),
            sourceUrl: `${PRODUCT_URL}/${p.ID}`,
            sourceImageUrl: p.img_url || undefined,
            price,
            originalPrice: salePrice ? basePrice : undefined,
            discountPercent,
            availability: p.stock && p.stock > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
            specs: buildSpecs(p),
          }
        }

        await politeDelay()
      }
    }
  },
}
