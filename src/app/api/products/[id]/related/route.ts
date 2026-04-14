import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getFlashSalesForProductsCached } from "@/lib/cache/flashSales"
import { toProductCardProps } from "@/lib/productCard"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id },
    select: { categoryId: true, vendorId: true },
  })
  if (!product) return NextResponse.json({ similar: [], vendor: [] })

  const select = {
    id: true, slug: true, name: true, nameEn: true, price: true, stock: true,
    createdAt: true, vendorId: true,
    images: { take: 4, orderBy: { order: "asc" as const }, where: { variantId: null }, select: { url: true } },
    category: { select: { nameEn: true, name: true } },
    vendor: { select: { name: true, slug: true } },
    reviews: { select: { rating: true } },
    variants: { orderBy: { order: "asc" as const }, select: { id: true, name: true, nameEn: true, price: true, stock: true } },
  }

  const [similarProducts, vendorProducts] = await Promise.all([
    prisma.product.findMany({
      where: { categoryId: product.categoryId, status: "ACTIVE", id: { not: id } },
      take: 8, orderBy: { createdAt: "desc" }, select,
    }),
    prisma.product.findMany({
      where: { vendorId: product.vendorId, status: "ACTIVE", id: { not: id } },
      take: 8, orderBy: { createdAt: "desc" }, select,
    }),
  ])

  const allIds = [...similarProducts.map((p) => p.id), ...vendorProducts.map((p) => p.id)]
  const flashSaleMap = allIds.length > 0 ? await getFlashSalesForProductsCached(allIds) : new Map()

  const toProps = (p: (typeof similarProducts)[number]) =>
    toProductCardProps(p, { flashSale: flashSaleMap.get(p.id) ?? null })

  return NextResponse.json(
    { similar: similarProducts.map(toProps), vendor: vendorProducts.map(toProps) },
    { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" } }
  )
}
