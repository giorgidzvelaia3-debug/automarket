import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"
import { buildCategoryTree } from "@/lib/categoryTree"

export const getCachedCategories = unstable_cache(
  async () => {
    return prisma.category.findMany({
      orderBy: { nameEn: "asc" },
      select: { id: true, name: true, nameEn: true, slug: true, icon: true, parentId: true },
    })
  },
  ["categories"],
  { revalidate: 3600 }
)

export const getCachedCategoryTree = unstable_cache(
  async () => {
    const flat = await prisma.category.findMany({
      orderBy: { nameEn: "asc" },
      select: { id: true, name: true, nameEn: true, slug: true, icon: true, parentId: true },
    })
    return buildCategoryTree(flat)
  },
  ["category-tree"],
  { revalidate: 3600 }
)
