import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getLocale } from "next-intl/server"
import { localized } from "@/lib/localeName"
import { prisma } from "@/lib/prisma"
import ProductGrid from "@/components/store/ProductGrid"
import { getFlashSalesForProducts } from "@/lib/actions/flashSales"
import { getWishlistIds } from "@/lib/actions/wishlist"
import { toProductCardProps } from "@/lib/productCard"

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await props.params
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { name: true, nameEn: true },
  })

  if (!category) return { title: "Category Not Found" }

  const title = `${category.nameEn} | AutoMarket`
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
          vendorId: true,
          images: { take: 1, orderBy: { order: "asc" }, where: { variantId: null }, select: { url: true } },
          vendor: { select: { name: true, slug: true } },
          reviews: { select: { rating: true } },
          variants: { orderBy: { order: "asc" }, select: { id: true, name: true, nameEn: true, price: true, stock: true } },
        },
      },
    },
  })

  if (!category) notFound()

  const [locale, flashSaleMap, wishlistIds] = await Promise.all([
    getLocale(),
    getFlashSalesForProducts(category.products.map((p) => p.id)),
    getWishlistIds(),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          ← Home
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{localized(locale, category.name, category.nameEn)}</h1>
        <p className="mt-1 text-xs text-gray-400">
          {category.products.length}{" "}
          {category.products.length === 1 ? "product" : "products"}
        </p>
      </div>

      <ProductGrid
        products={category.products.map((product) =>
          toProductCardProps(product, {
            flashSale: flashSaleMap.get(product.id) ?? null,
            isWishlisted: wishlistIds.has(product.id),
          })
        )}
        emptyMessage="No products in this category yet."
      />
    </div>
  )
}
