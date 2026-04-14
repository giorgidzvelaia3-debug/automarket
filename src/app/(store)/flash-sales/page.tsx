import Link from "next/link"
import Image from "next/image"
import { optimizeImageUrl } from "@/lib/imageUtils"
import { prisma } from "@/lib/prisma"
import CountdownTimer from "@/components/store/CountdownTimer"

export default async function FlashSalesPage() {
  const now = new Date()
  const sales = await prisma.flashSale.findMany({
    where: {
      status: "ACTIVE",
      startTime: { lte: now },
      endTime: { gte: now },
    },
    orderBy: { endTime: "asc" },
    include: {
      vendor: { select: { name: true, slug: true } },
      category: { select: { nameEn: true, name: true } },
      items: {
        include: {
          product: {
            select: {
              id: true,
              slug: true,
              name: true,
              nameEn: true,
              stock: true,
              images: { take: 4, orderBy: { order: "asc" }, where: { variantId: null }, select: { url: true } },
            },
          },
        },
      },
    },
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Flash Sales</h1>
        <p className="mt-1 text-sm text-gray-500">{sales.length} active sale{sales.length !== 1 ? "s" : ""}</p>
      </div>

      {sales.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-4xl mb-4">⚡</p>
          <p className="text-sm text-gray-500 mb-6">No active flash sales right now. Check back soon!</p>
          <Link href="/shop" className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
            Browse Shop
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {sales.map((sale) => (
            <div key={sale.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Sale header */}
              <div className="bg-gradient-to-r from-red-600 to-orange-500 px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-bold text-lg">{sale.titleEn}</p>
                    {sale.saleMode === "CATEGORY" && sale.category && (
                      <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                        {sale.category.nameEn}
                        {sale.categoryDiscount && ` -${sale.categoryDiscountType === "PERCENTAGE" ? `${Number(sale.categoryDiscount)}%` : `₾${Number(sale.categoryDiscount)}`}`}
                      </span>
                    )}
                  </div>
                  <p className="text-white/70 text-sm">{sale.title}</p>
                  <Link href={`/vendors/${sale.vendor.slug}`} className="text-white/60 text-xs hover:text-white/80 transition-colors">
                    by {sale.vendor.name}
                  </Link>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-xs mb-1">Ends in</p>
                  <div className="bg-white/20 rounded-lg px-3 py-1.5">
                    <CountdownTimer endTime={sale.endTime.toISOString()} />
                  </div>
                </div>
              </div>

              {/* Products grid */}
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {sale.items.map((item) => {
                    const discountPct = item.discountType === "PERCENTAGE"
                      ? Number(item.discountValue)
                      : Math.round((1 - Number(item.salePrice) / Number(item.originalPrice)) * 100)
                    return (
                      <Link
                        key={item.id}
                        href={`/products/${item.product.slug}`}
                        className="group rounded-xl border border-gray-200 bg-white overflow-hidden hover:border-red-300 hover:shadow-sm transition-all"
                      >
                        <div className="relative aspect-square bg-gray-100 overflow-hidden">
                          {item.product.images[0] ? (
                            <Image
                              src={optimizeImageUrl(item.product.images[0].url, 300)}
                              alt={item.product.nameEn}
                              fill
                              sizes="150px"
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full"><span className="text-gray-300 text-2xl">□</span></div>
                          )}
                          <span className="absolute top-1.5 left-1.5 rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            -{discountPct}%
                          </span>
                        </div>
                        <div className="p-2.5">
                          <p className="text-xs font-medium text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">{item.product.name}</p>
                          <div className="mt-1.5 flex items-baseline gap-1.5">
                            <span className="text-sm font-bold text-red-600">₾{Number(item.salePrice).toFixed(2)}</span>
                            <span className="text-[10px] text-gray-400 line-through">₾{Number(item.originalPrice).toFixed(2)}</span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
