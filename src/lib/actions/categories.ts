"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function createCategory(formData: FormData) {
  await requireAdmin()

  const name = (formData.get("name") as string).trim()
  const nameEn = (formData.get("nameEn") as string).trim()
  const rawSlug = (formData.get("slug") as string).trim()
  const parentId = (formData.get("parentId") as string) || null

  const slug = rawSlug || toSlug(nameEn)

  const exists = await prisma.category.findUnique({ where: { slug } })
  if (exists) {
    redirect(`/admin/categories/new?error=Slug+%22${encodeURIComponent(slug)}%22+already+exists`)
  }

  await prisma.category.create({
    data: {
      name,
      nameEn,
      slug,
      parentId: parentId || undefined,
    },
  })

  revalidatePath("/admin/categories")
  redirect("/admin/categories")
}

export async function deleteCategory(id: string) {
  await requireAdmin()

  await prisma.category.delete({ where: { id } })

  revalidatePath("/admin/categories")
}
