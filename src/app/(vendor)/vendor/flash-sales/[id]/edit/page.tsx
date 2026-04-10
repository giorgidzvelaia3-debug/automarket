import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import FlashSaleForm from "../../FlashSaleForm"

function toLocalDatetime(date: Date): string {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

export default async function EditFlashSalePage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params
  const session = await auth()
  const vendor = await prisma.vendor.findUnique({
    where: { userId: session!.user.id },
    select: { id: true, status: true },
  })
  if (!vendor) redirect("/vendor/register")

  const sale = await prisma.flashSale.findUnique({
    where: { id },
    include: {
      items: { select: { productId: true, discountType: true, discountValue: true, maxQuantity: true } },
    },
  })
  if (!sale || sale.vendorId !== vendor.id) notFound()

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
        images: { take: 1, orderBy: { order: "asc" }, where: { variantId: null }, select: { url: true } },
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
        <h1 className="mt-2 text-xl font-bold text-gray-900">Edit Flash Sale</h1>
      </div>
      <FlashSaleForm
        saleId={sale.id}
        products={products.map((p) => ({ id: p.id, name: p.name, nameEn: p.nameEn, price: Number(p.price), categoryId: p.categoryId, imageUrl: p.images[0]?.url }))}
        categories={categories.map((c) => ({ id: c.id, nameEn: c.nameEn, name: c.name, productCount: c._count.products }))}
        existingData={{
          title: sale.title,
          titleEn: sale.titleEn,
          startTime: toLocalDatetime(sale.startTime),
          endTime: toLocalDatetime(sale.endTime),
          saleMode: sale.saleMode,
          categoryId: sale.categoryId ?? undefined,
          categoryDiscount: sale.categoryDiscount ? String(Number(sale.categoryDiscount)) : undefined,
          categoryDiscountType: sale.categoryDiscountType ?? undefined,
          items: sale.items.map((item) => ({
            productId: item.productId,
            discountType: item.discountType,
            discountValue: String(Number(item.discountValue)),
            maxQuantity: item.maxQuantity ? String(item.maxQuantity) : "",
          })),
        }}
      />
    </div>
  )
}
