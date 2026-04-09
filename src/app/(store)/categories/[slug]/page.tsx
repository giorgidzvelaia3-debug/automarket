import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ProductGrid from "@/components/store/ProductGrid"
import { getFlashSalesForProducts } from "@/lib/actions/flashSales"

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await props.params
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { name: true, nameEn: true },
  })

  if (!category) return { title: "Category Not Found" }

  const title = `${category.nameEn} — ${category.name} | AutoMarket`
  const description = `Browse ${category.nameEn} auto parts on AutoMarket`

  return { title, description, openGraph: { title, description } }
}

export default async function CategoryPage(props: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await props.params

  const category = await prisma.category.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      nameEn: true,
      products: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          slug: true,
          name: true,
          nameEn: true,
          price: true,
          stock: true,
          createdAt: true,
          images: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
          vendor: { select: { name: true, slug: true } },
          reviews: { select: { rating: true } },
          variants: { orderBy: { order: "asc" }, select: { id: true, name: true, nameEn: true, price: true, stock: true } },
        },
      },
    },
  })

  if (!category) notFound()

  const flashSaleMap = await getFlashSalesForProducts(category.products.map((p) => p.id))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          ← Home
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{category.name}</h1>
        <p className="mt-0.5 text-sm text-gray-500">{category.nameEn}</p>
        <p className="mt-1 text-xs text-gray-400">
          {category.products.length}{" "}
          {category.products.length === 1 ? "product" : "products"}
        </p>
      </div>

      <ProductGrid
        products={category.products.map((p) => {
          const rc = p.reviews.length
          const avg = rc > 0 ? p.reviews.reduce((s, r) => s + r.rating, 0) / rc : undefined
          return {
            productId: p.id,
            slug: p.slug,
            name: p.name,
            nameEn: p.nameEn,
            price: Number(p.price),
            stock: p.stock,
            imageUrl: p.images[0]?.url,
            vendorName: p.vendor.name,
            vendorSlug: p.vendor.slug,
            avgRating: avg,
            reviewCount: rc > 0 ? rc : undefined,
            createdAt: p.createdAt.toISOString(),
            variants: p.variants?.map((v) => ({ id: v.id, name: v.name, nameEn: v.nameEn, price: Number(v.price), stock: v.stock })),
            flashSale: flashSaleMap.get(p.id) ?? null,
          }
        })}
        emptyMessage="No products in this category yet."
      />
    </div>
  )
}
