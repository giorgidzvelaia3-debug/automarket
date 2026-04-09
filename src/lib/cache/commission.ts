import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"

export const getCachedCommissionSettings = unstable_cache(
  async () => {
    return prisma.commissionSetting.findMany()
  },
  ["commission-settings"],
  { revalidate: 3600 }
)
