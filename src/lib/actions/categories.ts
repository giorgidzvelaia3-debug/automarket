"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/authHelpers"

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function invalidateCategories() {
  revalidatePath("/admin/categories")
  revalidatePath("/")
  revalidatePath("/shop")
  revalidatePath("/categories")
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

  invalidateCategories()
  redirect("/admin/categories")
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAdmin()

  const name = (formData.get("name") as string).trim()
  const nameEn = (formData.get("nameEn") as string).trim()
  const rawSlug = (formData.get("slug") as string).trim()
  const parentId = (formData.get("parentId") as string) || null

  const slug = rawSlug || toSlug(nameEn)

  // Prevent circular reference: can't set parent to self or own descendant
  if (parentId) {
    const children = await prisma.category.findMany({
      where: { parentId: id },
      select: { id: true },
    })
    const descendantIds = new Set([id, ...children.map((c) => c.id)])
    if (descendantIds.has(parentId)) {
      redirect(`/admin/categories/${id}/edit?error=Cannot+set+parent+to+self+or+own+subcategory`)
    }
  }

  // Check slug uniqueness (excluding self)
  const existing = await prisma.category.findUnique({ where: { slug } })
  if (existing && existing.id !== id) {
    redirect(`/admin/categories/${id}/edit?error=Slug+%22${encodeURIComponent(slug)}%22+already+exists`)
  }

  await prisma.category.update({
    where: { id },
    data: {
      name,
      nameEn,
      slug,
      parentId: parentId || null,
    },
  })

  invalidateCategories()
  redirect("/admin/categories")
}

export async function deleteCategory(id: string) {
  await requireAdmin()

  const category = await prisma.category.findUnique({
    where: { id },
    select: {
      parentId: true,
      _count: { select: { children: true, products: true } },
    },
  })

  if (!category) throw new Error("Category not found")

  // Reassign child categories to the deleted category's parent (or top-level)
  if (category._count.children > 0) {
    await prisma.category.updateMany({
      where: { parentId: id },
      data: { parentId: category.parentId },
    })
  }

  // Reassign products to parent category (if exists), otherwise block
  if (category._count.products > 0) {
    if (!category.parentId) {
      throw new Error(
        `Cannot delete: ${category._count.products} products are assigned to this top-level category. Reassign them first.`
      )
    }
    await prisma.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: category.parentId },
    })
  }

  await prisma.category.delete({ where: { id } })

  invalidateCategories()
}
