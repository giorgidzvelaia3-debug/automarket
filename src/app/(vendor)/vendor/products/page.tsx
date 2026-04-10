import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import ProductsTable from "./ProductsTable"

export default async function VendorProductsPage() {
  const session = await auth()

  const vendor = await prisma.vendor.findUnique({
    where: { userId: session!.user.id },
    select: { id: true, status: true },
  })

  if (!vendor) redirect("/vendor/register")

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        nameEn: true,
        price: true,
        stock: true,
        status: true,
        category: { select: { nameEn: true } },
        images: { take: 1, orderBy: { order: "asc" }, where: { variantId: null }, select: { url: true } },
      },
    }),
    prisma.category.findMany({
      orderBy: { nameEn: "asc" },
      select: { id: true, nameEn: true },
    }),
  ])

  const canAdd = vendor.status === "APPROVED"

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Products</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {products.length} {products.length === 1 ? "product" : "products"}
          </p>
        </div>
        {canAdd ? (
          <Link
            href="/vendor/products/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <span aria-hidden>+</span>
            Add Product
          </Link>
        ) : (
          <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
            Approval required to add products
          </span>
        )}
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-12 text-sm text-gray-400 text-center">
          {canAdd ? (
            <>
              No products yet.{" "}
              <Link href="/vendor/products/new" className="text-blue-600 hover:underline">
                Add your first product.
              </Link>
            </>
          ) : (
            "You'll be able to add products once your shop is approved."
          )}
        </div>
      ) : (
        <ProductsTable
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            nameEn: p.nameEn,
            price: Number(p.price),
            stock: p.stock,
            status: p.status,
            categoryName: p.category.nameEn,
            imageUrl: p.images[0]?.url,
          }))}
          categories={categories}
        />
      )}
    </div>
  )
}
