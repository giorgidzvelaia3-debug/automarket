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
import { getAllDescendantIds } from "@/lib/categoryTree"

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await props.params
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { name: true, nameEn: true, parent: { select: { nameEn: true } } },
  })

  if (!category) return { title: "Category Not Found" }

  const title = category.parent
    ? `${category.nameEn} - ${category.parent.nameEn} | AutoMarket`
    : `${category.nameEn} | AutoMarket`
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
      parentId: true,
      parent: { select: { id: true, name: true, nameEn: true, slug: true } },
      children: {
        orderBy: { nameEn: "asc" },
        select: { id: true, name: true, nameEn: true, slug: true },
      },
    },
  })

  if (!category) notFound()

  const isParent = !category.parentId
  const allCategories = await prisma.category.findMany({
    select: { id: true, name: true, nameEn: true, slug: true, icon: true, parentId: true },
  })

  // For parent categories: include all subcategory products
  const categoryIds = isParent
    ? getAllDescendantIds(allCategories as any, category.id)
    : [category.id]

  // If subcategory, get siblings for navigation
  const siblings = category.parentId
    ? await prisma.category.findMany({
        where: { parentId: category.parentId },
        orderBy: { nameEn: "asc" },
        select: { id: true, name: true, nameEn: true, slug: true },
      })
    : []

  const products = await prisma.product.findMany({
    where: { status: "ACTIVE", categoryId: { in: categoryIds } },
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
      images: { take: 4, orderBy: { order: "asc" }, where: { variantId: null }, select: { url: true } },
      vendor: { select: { name: true, slug: true } },
      reviews: { select: { rating: true } },
      variants: { orderBy: { order: "asc" }, select: { id: true, name: true, nameEn: true, price: true, stock: true } },
    },
  })

  const [locale, flashSaleMap, wishlistIds] = await Promise.all([
    getLocale(),
    getFlashSalesForProducts(products.map((p) => p.id)),
    getWishlistIds(),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
        <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
        <span>/</span>
        {category.parent ? (
          <>
            <Link
              href={`/categories/${category.parent.slug}`}
              className="hover:text-gray-600 transition-colors"
            >
              {localized(locale, category.parent.name, category.parent.nameEn)}
            </Link>
            <span>/</span>
            <span className="text-gray-600 font-medium">
              {localized(locale, category.name, category.nameEn)}
            </span>
          </>
        ) : (
          <span className="text-gray-600 font-medium">
            {localized(locale, category.name, category.nameEn)}
          </span>
        )}
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {localized(locale, category.name, category.nameEn)}
        </h1>
        <p className="mt-1 text-xs text-gray-400">
          {products.length} {products.length === 1 ? "product" : "products"}
        </p>
      </div>

      {/* Subcategory chips (for parent categories) */}
      {isParent && category.children.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href={`/categories/${slug}`}
            className="px-3 py-1.5 text-xs font-medium rounded-full bg-blue-600 text-white"
          >
            All
          </Link>
          {category.children.map((sub) => (
            <Link
              key={sub.id}
              href={`/categories/${sub.slug}`}
              className="px-3 py-1.5 text-xs font-medium rounded-full border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              {localized(locale, sub.name, sub.nameEn)}
            </Link>
          ))}
        </div>
      )}

      {/* Sibling subcategory navigation (for subcategories) */}
      {!isParent && siblings.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {category.parent && (
            <Link
              href={`/categories/${category.parent.slug}`}
              className="px-3 py-1.5 text-xs font-medium rounded-full border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              All {localized(locale, category.parent.name, category.parent.nameEn)}
            </Link>
          )}
          {siblings.map((sib) => (
            <Link
              key={sib.id}
              href={`/categories/${sib.slug}`}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                sib.id === category.id
                  ? "bg-blue-600 text-white"
                  : "border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              {localized(locale, sib.name, sib.nameEn)}
            </Link>
          ))}
        </div>
      )}

      <ProductGrid
        products={products.map((product) =>
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
