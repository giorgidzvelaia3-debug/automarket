import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"

export const getCachedProduct = unstable_cache(
  async (slug: string) => {
    const product = await prisma.product.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        nameEn: true,
        description: true,
        descriptionEn: true,
        price: true,
        stock: true,
        status: true,
        categoryId: true,
        vendorId: true,
        images: { orderBy: { order: "asc" }, select: { id: true, url: true } },
        category: { select: { nameEn: true, name: true, slug: true } },
        vendor: { select: { name: true, slug: true, description: true } },
        variants: {
          orderBy: { order: "asc" },
          select: { id: true, name: true, nameEn: true, price: true, stock: true },
        },
      },
    })

    if (!product) return null

    // Serialize Decimal fields so cache stores plain numbers
    return {
      ...product,
      price: Number(product.price),
      variants: product.variants.map((v) => ({
        ...v,
        price: Number(v.price),
      })),
    }
  },
  ["product-detail"],
  { revalidate: 300 }
)

export const getCachedProductMeta = unstable_cache(
  async (slug: string) => {
    return prisma.product.findUnique({
      where: { slug },
      select: {
        name: true,
        nameEn: true,
        descriptionEn: true,
        vendor: { select: { name: true } },
        images: { take: 1, orderBy: { order: "asc" }, where: { variantId: null }, select: { url: true } },
      },
    })
  },
  ["product-meta"],
  { revalidate: 300 }
)
