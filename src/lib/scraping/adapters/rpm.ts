import * as cheerio from "cheerio"
import type { ScrapedOffer, SourceAdapter, SourceLike } from "../types"
import { fetchHtml, politeDelay } from "../http"

// rpm.ge runs WooCommerce on the Porto theme. Each product card:
//   .product-col
//     .post-title a[href]          (name + product URL)
//     .tb-woo-price .amount         ("60,00 ₾")
//     img[data-src]                 (real image is lazy-loaded in data-src)
// Pagination is WooCommerce path-based: ".../dzravis-zeti/page/2/".

function parsePrice(text: string | undefined): number | undefined {
  if (!text) return undefined
  // Georgian WooCommerce uses comma as the decimal separator ("60,00 ₾").
  const m = text.replace(/\s/g, "").match(/(\d+(?:,\d{2})?)/)
  if (!m) return undefined
  const n = Number(m[1].replace(",", "."))
  return Number.isFinite(n) && n > 0 ? n : undefined
}

function absolute(baseUrl: string, url: string | undefined): string | undefined {
  if (!url) return undefined
  try {
    return new URL(url, baseUrl).toString()
  } catch {
    return undefined
  }
}

// Strip WooCommerce thumbnail size suffix ("-300x300.jpg" → ".jpg") for full-res.
function fullResImage(url: string | undefined): string | undefined {
  if (!url) return undefined
  return url.replace(/-\d+x\d+(\.[a-z]+)(?:\?.*)?$/i, "$1")
}

function pageUrl(categoryUrl: string, page: number): string {
  if (page <= 1) return categoryUrl
  const base = categoryUrl.endsWith("/") ? categoryUrl : `${categoryUrl}/`
  return `${base}page/${page}/`
}

export const rpmAdapter: SourceAdapter = {
  slug: "rpm",
  kind: "STATIC_HTML",

  async *scrape(source: SourceLike): AsyncGenerator<ScrapedOffer> {
    const config = source.config ?? {}
    const categoryUrls = config.categoryUrls ?? []
    const pagesMax = config.pagesMax ?? 25

    for (const categoryUrl of categoryUrls) {
      for (let page = 1; page <= pagesMax; page++) {
        const url = pageUrl(categoryUrl, page)
        let html: string
        try {
          html = await fetchHtml(url)
        } catch {
          break
        }

        const $ = cheerio.load(html)
        const cards = $(".product-col")
        if (cards.length === 0) break

        let yielded = 0
        for (const el of cards.toArray()) {
          const card = $(el)
          const link = card.find(".post-title a").first()
          const rawName = (link.text() || card.find(".post-title").first().text()).trim().replace(/\s+/g, " ")
          const href = absolute(source.baseUrl, link.attr("href") || card.find("a").first().attr("href"))
          if (!rawName || !href) continue

          const price = parsePrice(card.find(".tb-woo-price .amount, .tb-woo-price").first().text())
          if (price === undefined) continue

          const img = card.find("img").first()
          const sourceImageUrl = fullResImage(
            absolute(source.baseUrl, img.attr("data-src") || img.attr("data-lazy-src") || img.attr("src"))
          )

          yielded++
          yield {
            rawName,
            sourceUrl: href,
            sourceImageUrl: sourceImageUrl?.startsWith("data:") ? undefined : sourceImageUrl,
            price,
            availability: "UNKNOWN",
          }
        }

        if (yielded === 0) break
        await politeDelay()
      }
    }
  },
}
