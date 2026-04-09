import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import FlashSaleForm from "../FlashSaleForm"

export default async function NewFlashSalePage() {
  const session = await auth()
  const vendor = await prisma.vendor.findUnique({
    where: { userId: session!.user.id },
    select: { id: true, status: true },
  })
  if (!vendor) redirect("/vendor/register")
  if (vendor.status !== "APPROVED") redirect("/vendor/dashboard")

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { vendorId: vendor.id, status: "ACTIVE" },
      orderBy: { nameEn: "asc" },
      select: {
        id: true,
        name: true,
        nameEn: true,
        price: true,
        categoryId: true,
        images: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
      },
    }),
    prisma.category.findMany({
      where: { products: { some: { vendorId: vendor.id, status: "ACTIVE" } } },
      orderBy: { nameEn: "asc" },
      select: {
        id: true,
        nameEn: true,
        name: true,
        _count: { select: { products: { where: { vendorId: vendor.id, status: "ACTIVE" } } } },
      },
    }),
  ])

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/vendor/flash-sales" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← Flash Sales</Link>
        <h1 className="mt-2 text-xl font-bold text-gray-900">Create Flash Sale</h1>
      </div>
      <FlashSaleForm
        products={products.map((p) => ({ id: p.id, name: p.name, nameEn: p.nameEn, price: Number(p.price), categoryId: p.categoryId, imageUrl: p.images[0]?.url }))}
        categories={categories.map((c) => ({ id: c.id, nameEn: c.nameEn, name: c.name, productCount: c._count.products }))}
      />
    </div>
  )
}
