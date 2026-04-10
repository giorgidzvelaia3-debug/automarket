import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import EditProductForm from "./EditProductForm"
import VariantEditor from "../../VariantEditor"
import ProductImageManager from "../../ProductImageManager"

export default async function EditProductPage(props: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const [{ id }, { error }, session] = await Promise.all([
    props.params,
    props.searchParams,
    auth(),
  ])

  const vendor = await prisma.vendor.findUnique({
    where: { userId: session!.user.id },
    select: { id: true, status: true },
  })

  if (!vendor) redirect("/vendor/register")
  if (vendor.status !== "APPROVED") redirect("/vendor/dashboard")

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        vendorId: true,
        name: true,
        nameEn: true,
        slug: true,
        description: true,
        descriptionEn: true,
        price: true,
        stock: true,
        categoryId: true,
        images: { orderBy: { order: "asc" }, where: { variantId: null }, select: { id: true, url: true, order: true } },
        variants: {
          orderBy: { order: "asc" },
          select: {
            id: true, name: true, nameEn: true, price: true, stock: true, sku: true,
            images: { orderBy: { order: "asc" }, select: { id: true, url: true } },
          },
        },
      },
    }),
    prisma.category.findMany({
      orderBy: { nameEn: "asc" },
      select: { id: true, nameEn: true, name: true },
    }),
  ])

  if (!product || product.vendorId !== vendor.id) notFound()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/vendor/products"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Products
        </Link>
        <h1 className="mt-2 text-xl font-bold text-gray-900">Edit Product</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Slug cannot be changed after creation.
        </p>
      </div>

      <EditProductForm
        product={{
          ...product,
          price: Number(product.price),
          hasVariants: product.variants.length > 0,
        }}
        categories={categories}
        error={error}
      />

      <ProductImageManager
        productId={product.id}
        initialImages={product.images}
      />

      <VariantEditor
        productId={product.id}
        initialVariants={product.variants.map((v) => ({
          id: v.id,
          name: v.name,
          nameEn: v.nameEn,
          price: String(Number(v.price)),
          stock: v.stock,
          sku: v.sku ?? "",
          images: v.images ?? [],
        }))}
      />
    </div>
  )
}
