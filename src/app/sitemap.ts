import type { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, vendors, categories] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, createdAt: true },
    }),
    prisma.vendor.findMany({
      where: { status: "APPROVED" },
      select: { slug: true, createdAt: true },
    }),
    prisma.category.findMany({
      select: { slug: true },
    }),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/vendors`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/search`, changeFrequency: "daily", priority: 0.6 },
  ]

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/products/${p.slug}`,
    lastModified: p.createdAt,
    changeFrequency: "weekly",
    priority: 0.9,
  }))

  const vendorPages: MetadataRoute.Sitemap = vendors.map((v) => ({
    url: `${BASE_URL}/vendors/${v.slug}`,
    lastModified: v.createdAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE_URL}/categories/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  return [...staticPages, ...productPages, ...vendorPages, ...categoryPages]
}
