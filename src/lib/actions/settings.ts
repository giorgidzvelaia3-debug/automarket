"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/authHelpers"

const SETTING_KEYS = ["siteName", "siteDescription", "contactEmail", "contactPhone"] as const

export async function updateSettings(formData: FormData) {
  await requireAdmin()

  const entries = SETTING_KEYS.map((key) => ({
    key,
    value: (formData.get(key) as string | null)?.trim() ?? "",
  }))

  await prisma.$transaction(
    entries.map(({ key, value }) =>
      prisma.siteSettings.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )
  )

  revalidatePath("/admin/settings")
}

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.siteSettings.findMany()
  const map: Record<string, string> = {}
  for (const row of rows) {
    map[row.key] = row.value
  }
  return map
}
