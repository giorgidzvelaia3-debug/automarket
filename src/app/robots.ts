import type { MetadataRoute } from "next"

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/vendor/", "/api/", "/account/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
