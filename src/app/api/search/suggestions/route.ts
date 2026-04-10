import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json([])
  }

  const products = await prisma.product.findMany({
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
    },
  })

  return NextResponse.json(
    products.map((p) => ({
      slug: p.slug,
      name: p.name,
      nameEn: p.nameEn,
      price: Number(p.price),
      image: p.images[0]?.url ?? null,
    }))
  )
}
