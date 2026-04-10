import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ products: [], categories: [] })
  }

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { nameEn: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        slug: true,
        name: true,
        nameEn: true,
        price: true,
        images: { take: 1, orderBy: { order: "asc" }, where: { variantId: null }, select: { url: true } },
        vendor: { select: { name: true } },
      },
    }),
    prisma.category.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { nameEn: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 3,
      select: { slug: true, name: true, nameEn: true },
    }),
  ])

  return NextResponse.json({
    products: products.map((p) => ({
      slug: p.slug,
      name: p.name,
      nameEn: p.nameEn,
      price: Number(p.price),
      image: p.images[0]?.url ?? null,
      vendorName: p.vendor.name,
    })),
    categories: categories.map((c) => ({
      slug: c.slug,
      name: c.name,
      nameEn: c.nameEn,
    })),
  })
}
