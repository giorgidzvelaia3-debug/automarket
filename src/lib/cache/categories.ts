import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"

export const getCachedCategories = unstable_cache(
  async () => {
    return prisma.category.findMany({
      orderBy: { nameEn: "asc" },
      select: { id: true, name: true, nameEn: true, slug: true, icon: true, parentId: true },
    })
  },
  ["categories"],
  { revalidate: 3600, tags: ["categories"] }
)
