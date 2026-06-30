import * as cheerio from "cheerio"
import type { ProductSpecs, ScrapedOffer, SourceAdapter, SourceLike } from "../types"
import { fetchHtml, politeDelay } from "../http"

// amboli.ge is server-rendered. Each product card:
//   div.products-grid-item
//     figure.product-img-wrap a > img[src]        (relative image URL)
//     h4.title a[href]                            (name text + product URL)
//     span.products-price                         ("199.8 ₾")
//     span.products-price-old                     ("235 ₾", only when discounted)
// Pagination is path-based: ".../dzravis-zeti/page-2/".

function parsePrice(text: string | undefined): number | undefined {
  if (!text) return undefined
  const m = text.replace(/\s/g, "").match(/(\d+(?:[.,]\d+)?)/)
  if (!m) return undefined
  const n = Number(m[1].replace(",", "."))
  return Number.isFinite(n) ? n : undefined
}

function absolute(baseUrl: string, url: string | undefined): string | undefined {
  if (!url) return undefined
  try {
    return new URL(url, baseUrl).toString()
  } catch {
    return undefined
  }
}

function pageUrl(categoryUrl: string, page: number): string {
  if (page <= 1) return categoryUrl
  // ensure trailing slash then append page-N/
  const base = categoryUrl.endsWith("/") ? categoryUrl : `${categoryUrl}/`
  return `${base}page-${page}/`
}

export const amboliAdapter: SourceAdapter = {
  slug: "amboli",
  kind: "STATIC_HTML",

  async *scrape(source: SourceLike): AsyncGenerator<ScrapedOffer> {
    const config = source.config ?? {}
    const categoryUrls = config.categoryUrls ?? []
    const pagesMax = config.pagesMax ?? 15

    for (const categoryUrl of categoryUrls) {
      for (let page = 1; page <= pagesMax; page++) {
        const url = pageUrl(categoryUrl, page)
        let html: string
        try {
          html = await fetchHtml(url)
        } catch {
          // stop this category on fetch failure of a page
          break
        }

        const $ = cheerio.load(html)
        const cards = $("div.products-grid-item")
        if (cards.length === 0) break // no more products — stop early

        let yielded = 0
        for (const el of cards.toArray()) {
          const card = $(el)
          const link = card.find("h4.title a").first()
          const rawName = link.text().trim()
          const href = absolute(source.baseUrl, link.attr("href"))
          if (!rawName || !href) continue

          const imgSrc = card.find("figure.product-img-wrap img").first().attr("src")
          // drop resize query (?w=800) so we hotlink the original; ignore the
          // site's "no photo" placeholder so our own fallback shows instead.
          const cleanImg = imgSrc?.split("?")[0]
          const sourceImageUrl = cleanImg && !cleanImg.includes("nophoto")
            ? absolute(source.baseUrl, cleanImg)
            : undefined

          const price = parsePrice(card.find(".products-price").first().text())
          const originalPrice = parsePrice(card.find(".products-price-old").first().text())
          if (price === undefined) continue

          let discountPercent: number | undefined
          if (originalPrice && originalPrice > price) {
            discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100)
          }

          yielded++
          yield {
            rawName,
            sourceUrl: href,
            sourceImageUrl,
            price,
            originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
            discountPercent,
            availability: "UNKNOWN", // amboli exposes no stock signal
          }
        }

        if (yielded === 0) break
        await politeDelay()
      }
    }
  },

  // Specs live on the product detail page inside `.features-container-body`,
  // as rows of `<div>label:</div><div>value</div>`.
  async fetchSpecs(sourceUrl: string): Promise<ProductSpecs | null> {
    let html: string
    try {
      html = await fetchHtml(sourceUrl)
    } catch {
      return null
    }
    const $ = cheerio.load(html)
    const specs: ProductSpecs = {}
    $(".features-container-body .d-flex").each((_, el) => {
      const cells = $(el).children("div")
      if (cells.length < 2) return
      const key = $(cells[0]).text().replace(/:\s*$/, "").trim()
      const value = $(cells[1]).text().trim()
      if (key && value) specs[key] = value
    })
    return Object.keys(specs).length > 0 ? specs : null
  },
}
