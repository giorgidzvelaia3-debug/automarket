import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"

export function getCachedVendor(slug: string, sort: string = "newest") {
  return unstable_cache(
    async () => {
      const orderBy =
        sort === "price_asc"
          ? { price: "asc" as const }
          : sort === "price_desc"
            ? { price: "desc" as const }
            : { createdAt: "desc" as const }

      return prisma.vendor.findUnique({
        where: { slug },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          createdAt: true,
          vacationMode: true,
          vacationMessage: true,
          vacationEnd: true,
          minOrderAmount: true,
          maxOrderAmount: true,
          minOrderQty: true,
          maxOrderQty: true,
          badges: { select: { badge: true } },
          products: {
            where: { status: "ACTIVE" },
            orderBy,
            select: {
              id: true,
              slug: true,
              name: true,
              nameEn: true,
              price: true,
              stock: true,
              createdAt: true,
              images: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
              category: { select: { nameEn: true } },
              reviews: { select: { rating: true } },
              variants: { orderBy: { order: "asc" }, select: { id: true, name: true, nameEn: true, price: true, stock: true } },
            },
          },
        },
      })
    },
    [`vendor-${slug}-${sort}`],
    { revalidate: 300, tags: ["vendors"] }
  )()
}
