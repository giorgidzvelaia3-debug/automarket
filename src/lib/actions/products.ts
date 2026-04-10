"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireApprovedVendor() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "VENDOR") {
    throw new Error("Unauthorized")
  }

  const vendor = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
    select: { id: true, status: true },
  })

  if (!vendor) throw new Error("Vendor profile not found")
  if (vendor.status !== "APPROVED") throw new Error("Vendor not approved")

  return vendor
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function createProduct(formData: FormData) {
  const vendor = await requireApprovedVendor()

  const name          = (formData.get("name") as string).trim()
  const nameEn        = (formData.get("nameEn") as string).trim()
  const rawSlug       = (formData.get("slug") as string).trim()
  const description   = (formData.get("description") as string | null)?.trim() || null
  const descriptionEn = (formData.get("descriptionEn") as string | null)?.trim() || null
  const price         = (formData.get("price") as string).trim()
  const stock         = parseInt(formData.get("stock") as string, 10) || 0
  const categoryId    = formData.get("categoryId") as string
  const imageUrl      = (formData.get("imageUrl") as string | null)?.trim() || null

  const slug = rawSlug || toSlug(nameEn)

  const existing = await prisma.product.findUnique({ where: { slug } })
  if (existing) {
    redirect(
      `/vendor/products/new?error=Slug+%22${encodeURIComponent(slug)}%22+is+already+taken`
    )
  }

  const product = await prisma.product.create({
    data: {
      vendorId: vendor.id,
      categoryId,
      name,
      nameEn,
      slug,
      description,
      descriptionEn,
      price,
      stock,
      status: "DRAFT",
    },
  })

  if (imageUrl) {
    await prisma.productImage.create({
      data: { productId: product.id, url: imageUrl, order: 0 },
    })
  }

  revalidatePath("/vendor/products")
  redirect(`/vendor/products/${product.id}/edit`)
}

export async function updateProduct(id: string, formData: FormData) {
  const vendor = await requireApprovedVendor()

  const product = await prisma.product.findUnique({
    where: { id },
    select: { vendorId: true, images: { select: { id: true }, take: 1, orderBy: { order: "asc" } } },
  })

  if (!product || product.vendorId !== vendor.id) {
    throw new Error("Product not found")
  }

  const name          = (formData.get("name") as string).trim()
  const nameEn        = (formData.get("nameEn") as string).trim()
  const description   = (formData.get("description") as string | null)?.trim() || null
  const descriptionEn = (formData.get("descriptionEn") as string | null)?.trim() || null
  const price         = (formData.get("price") as string).trim()
  const stock         = parseInt(formData.get("stock") as string, 10) || 0
  const categoryId    = formData.get("categoryId") as string
  const imageUrl      = (formData.get("imageUrl") as string | null)?.trim() || null

  await prisma.product.update({
    where: { id },
    data: { name, nameEn, description, descriptionEn, price, stock, categoryId },
  })

  if (imageUrl) {
    if (product.images[0]) {
      await prisma.productImage.update({
        where: { id: product.images[0].id },
        data: { url: imageUrl },
      })
    } else {
      await prisma.productImage.create({
        data: { productId: id, url: imageUrl, order: 0 },
      })
    }
  }

  revalidatePath("/vendor/products")
  redirect("/vendor/products")
}

export async function updateProductStatus(
  id: string,
  status: "ACTIVE" | "INACTIVE" | "DRAFT"
) {
  const vendor = await requireApprovedVendor()

  const product = await prisma.product.findUnique({
    where: { id },
    select: { vendorId: true },
  })

  if (!product || product.vendorId !== vendor.id) {
    throw new Error("Product not found")
  }

  await prisma.product.update({ where: { id }, data: { status } })
  revalidatePath("/vendor/products")
}

async function requireImageOwnership(imageId: string) {
  const vendor = await requireApprovedVendor()
  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
    select: { productId: true, product: { select: { vendorId: true } } },
  })
  if (!image || image.product.vendorId !== vendor.id) throw new Error("Not found")
  return { vendor, productId: image.productId }
}

export async function addProductImage(productId: string, url: string, variantId?: string) {
  const vendor = await requireApprovedVendor()
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { vendorId: true },
  })
  if (!product || product.vendorId !== vendor.id) throw new Error("Not found")

  const maxOrder = await prisma.productImage.aggregate({
    where: { productId, variantId: variantId ?? null },
    _max: { order: true },
  })

  const created = await prisma.productImage.create({
    data: { productId, url, order: (maxOrder._max.order ?? -1) + 1, variantId: variantId ?? null },
    select: { id: true, url: true, order: true, variantId: true },
  })

  revalidatePath(`/vendor/products/${productId}/edit`)
  return created
}

export async function deleteProductImage(imageId: string) {
  const { productId } = await requireImageOwnership(imageId)
  await prisma.productImage.delete({ where: { id: imageId } })
  revalidatePath(`/vendor/products/${productId}/edit`)
}

export async function setMainProductImage(imageId: string) {
  const { productId } = await requireImageOwnership(imageId)

  // Get all images for the product to renumber
  const images = await prisma.productImage.findMany({
    where: { productId },
    orderBy: { order: "asc" },
    select: { id: true },
  })

  await prisma.$transaction(async (tx) => {
    // Set picked image to 0
    await tx.productImage.update({ where: { id: imageId }, data: { order: 0 } })
    // Re-index the rest starting from 1
    let i = 1
    for (const img of images) {
      if (img.id === imageId) continue
      await tx.productImage.update({ where: { id: img.id }, data: { order: i } })
      i++
    }
  })

  revalidatePath(`/vendor/products/${productId}/edit`)
}

export async function deleteProduct(id: string) {
  const vendor = await requireApprovedVendor()

  // Ensure the product belongs to this vendor
  const product = await prisma.product.findUnique({
    where: { id },
    select: { vendorId: true },
  })

  if (!product || product.vendorId !== vendor.id) {
    throw new Error("Product not found")
  }

  await prisma.product.delete({ where: { id } })
  revalidatePath("/vendor/products")
}

// ─── Bulk Actions ─────────────────────────────────────────────────────────

async function verifyVendorOwnership(productIds: string[]) {
  const vendor = await requireApprovedVendor()
  const count = await prisma.product.count({
    where: { id: { in: productIds }, vendorId: vendor.id },
  })
  if (count !== productIds.length) throw new Error("Unauthorized — some products don't belong to you")
  return vendor
}

export async function bulkUpdateProducts(
  productIds: string[],
  updates: {
    status?: "ACTIVE" | "INACTIVE"
    categoryId?: string
  }
) {
  if (productIds.length === 0) return
  await verifyVendorOwnership(productIds)

  const data: Record<string, unknown> = {}
  if (updates.status) data.status = updates.status
  if (updates.categoryId) data.categoryId = updates.categoryId

  if (Object.keys(data).length === 0) return

  await prisma.product.updateMany({
    where: { id: { in: productIds } },
    data,
  })

  revalidatePath("/vendor/products")
}

export async function bulkDeleteProducts(productIds: string[]) {
  if (productIds.length === 0) return
  await verifyVendorOwnership(productIds)

  await prisma.product.deleteMany({
    where: { id: { in: productIds } },
  })

  revalidatePath("/vendor/products")
}

export async function adminBulkUpdateProducts(
  productIds: string[],
  updates: { status?: "ACTIVE" | "INACTIVE" }
) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")
  if (productIds.length === 0) return

  const data: Record<string, unknown> = {}
  if (updates.status) data.status = updates.status
  if (Object.keys(data).length === 0) return

  await prisma.product.updateMany({
    where: { id: { in: productIds } },
    data,
  })

  revalidatePath("/admin/products")
}

export async function adminBulkDeleteProducts(productIds: string[]) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")
  if (productIds.length === 0) return

  await prisma.product.deleteMany({
    where: { id: { in: productIds } },
  })

  revalidatePath("/admin/products")
}
