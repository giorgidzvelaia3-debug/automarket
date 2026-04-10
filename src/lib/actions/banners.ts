"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

async function requireAdmin() {
  const { auth } = await import("@/lib/auth")
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")
}

export async function getBanners() {
  return prisma.banner.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  })
}

export async function getAdminBanners() {
  await requireAdmin()
  return prisma.banner.findMany({ orderBy: { order: "asc" } })
}

export async function createBanner(data: {
  title: string
  titleEn?: string
  subtitle?: string
  subtitleEn?: string
  imageUrl: string
  linkUrl?: string
  position: "HERO" | "SIDE_TOP" | "SIDE_BOTTOM"
}) {
  await requireAdmin()

  const maxOrder = await prisma.banner.aggregate({
    where: { position: data.position },
    _max: { order: true },
  })

  await prisma.banner.create({
    data: {
      ...data,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  })

  revalidatePath("/admin/banners")
  revalidatePath("/")
}

export async function updateBanner(
  id: string,
  data: {
    title?: string
    titleEn?: string
    subtitle?: string
    subtitleEn?: string
    imageUrl?: string
    linkUrl?: string
    active?: boolean
    position?: "HERO" | "SIDE_TOP" | "SIDE_BOTTOM"
  }
) {
  await requireAdmin()
  await prisma.banner.update({ where: { id }, data })
  revalidatePath("/admin/banners")
  revalidatePath("/")
}

export async function deleteBanner(id: string) {
  await requireAdmin()
  await prisma.banner.delete({ where: { id } })
  revalidatePath("/admin/banners")
  revalidatePath("/")
}
