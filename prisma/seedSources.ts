import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// Idempotent seed for aggregated-product Sources.
// Run with: npx tsx prisma/seedSources.ts
// Safe to re-run — uses upsert, never deletes existing data.

const sources = [
  {
    slug: "amboli",
    name: "amboli.ge",
    baseUrl: "https://amboli.ge",
    kind: "STATIC_HTML" as const,
    enabled: true,
    config: {
      // The local category that scraped products from these URLs map to.
      defaultCategorySlug: "oils-and-fluids",
      categoryUrls: ["https://amboli.ge/products/dzravis-zeti/"],
      pagesMax: 15,
    },
  },
  {
    slug: "otomotors",
    name: "otomotors.shop",
    baseUrl: "https://otomotors.shop",
    kind: "JS_RENDERED" as const,
    enabled: true,
    config: {
      defaultCategorySlug: "oils-and-fluids",
      categoryUrls: ["https://otomotors.shop/dzravis-zetebi-679"],
      pagesMax: 15,
    },
  },
  {
    slug: "rpm",
    name: "rpm.ge",
    baseUrl: "https://rpm.ge",
    kind: "STATIC_HTML" as const,
    enabled: true,
    config: {
      defaultCategorySlug: "oils-and-fluids",
      categoryUrls: ["https://rpm.ge/product-category/sackheb-sapokhi-masalebi/dzravis-zeti/"],
      pagesMax: 25,
    },
  },
]

async function main() {
  for (const s of sources) {
    await prisma.source.upsert({
      where: { slug: s.slug },
      update: {
        name: s.name,
        baseUrl: s.baseUrl,
        kind: s.kind,
        config: s.config,
      },
      create: s,
    })
    console.log(`✓ source upserted: ${s.slug}`)
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
