import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canRequestReturn } from "@/lib/actions/returns"
import { optimizeImageUrl } from "@/lib/imageUtils"
import DownloadInvoiceButton from "@/components/store/DownloadInvoiceButton"

const statusStyles: Record<string, string> = {
  PENDING:   "bg-amber-50  text-amber-700  border-amber-200",
  CONFIRMED: "bg-blue-50   text-blue-700   border-blue-200",
  SHIPPED:   "bg-purple-50 text-purple-700 border-purple-200",
  DELIVERED: "bg-green-50  text-green-700  border-green-200",
  CANCELLED: "bg-red-50    text-red-600    border-red-200",
}

const statusSteps = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"] as const

export default async function BuyerOrderDetailPage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      total: true,
      couponCode: true,
      couponDiscount: true,
      address: true,
      note: true,
      createdAt: true,
      buyerId: true,
      orderItems: {
        select: {
          id: true,
          quantity: true,
          price: true,
          variantName: true,
          vendorEarning: true,
          product: {
            select: {
              name: true,
              nameEn: true,
              slug: true,
              // nameEn used for PDF invoice fallback
              images: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
            },
          },
          vendor: { select: { name: true, slug: true } },
        },
      },
    },
  })

  if (!order || order.buyerId !== session.user.id) notFound()

  const returnCheck = await canRequestReturn(id)
  const currentStep = statusSteps.indexOf(order.status as (typeof statusSteps)[number])

  const subtotal = order.orderItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  )

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/account/orders" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
        ← My Orders
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Order #{order.id.slice(-8).toUpperCase()}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {order.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DownloadInvoiceButton
            order={{
              orderId: order.id,
              createdAt: order.createdAt.toISOString(),
              buyerName: (order.address ?? "").split(",")[0]?.trim() || "Customer",
              buyerPhone: (order.address ?? "").split(",")[3]?.trim() || "",
              buyerAddress: order.address ?? "",
              vendorName: order.orderItems[0]?.vendor.name ?? "AutoMarket",
              items: order.orderItems.map((item) => ({
                productName: item.product.name,
                productNameEn: item.product.nameEn,
                variantName: item.variantName,
                quantity: item.quantity,
                unitPrice: Number(item.price),
                total: Number(item.price) * item.quantity,
              })),
              subtotal,
              couponCode: order.couponCode,
              couponDiscount: order.couponDiscount ? Number(order.couponDiscount) : null,
              grandTotal: Number(order.total),
            }}
          />
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusStyles[order.status]}`}>
            {order.status}
          </span>
        </div>
      </div>

      {/* Status timeline */}
      {order.status !== "CANCELLED" && (
        <div className="mt-6 flex items-center gap-0">
          {statusSteps.map((step, i) => {
            const isCompleted = i <= currentStep
            const isCurrent = i === currentStep
            return (
              <div key={step} className="flex-1 flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shrink-0 ${
                  isCompleted ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500"
                } ${isCurrent ? "ring-2 ring-green-300" : ""}`}>
                  {isCompleted ? "✓" : i + 1}
                </div>
                {i < statusSteps.length - 1 && (
                  <div className={`flex-1 h-0.5 ${i < currentStep ? "bg-green-600" : "bg-gray-200"}`} />
                )}
              </div>
            )
          })}
        </div>
      )}
      {order.status !== "CANCELLED" && (
        <div className="flex mt-1">
          {statusSteps.map((step) => (
            <div key={step} className="flex-1 text-center">
              <p className="text-[10px] text-gray-500">{step.charAt(0) + step.slice(1).toLowerCase()}</p>
            </div>
          ))}
        </div>
      )}

      {/* Items */}
      <div className="mt-8 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Items</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {order.orderItems.map((item) => (
            <div key={item.id} className="flex items-center gap-4 px-5 py-4">
              <Link href={`/products/${item.product.slug}`} className="shrink-0">
                <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden">
                  {item.product.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={optimizeImageUrl(item.product.images[0].url, 112)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="flex items-center justify-center h-full text-gray-300 text-lg">□</span>
                  )}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.product.slug}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors truncate block">
                  {item.product.name}
                </Link>
                <p className="text-xs text-gray-400 truncate">{item.product.nameEn}</p>
                {item.variantName && <p className="text-xs text-blue-600 font-medium mt-0.5">{item.variantName}</p>}
                <p className="text-xs text-gray-500 mt-0.5">
                  by <Link href={`/vendors/${item.vendor.slug}`} className="text-blue-600 hover:underline">{item.vendor.name}</Link>
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-gray-900">₾{(Number(item.price) * item.quantity).toFixed(2)}</p>
                <p className="text-xs text-gray-400">₾{Number(item.price).toFixed(2)} × {item.quantity}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 bg-white rounded-xl border border-gray-200 p-5 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="text-gray-900">₾{subtotal.toFixed(2)}</span>
        </div>
        {order.couponCode && order.couponDiscount && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Coupon ({order.couponCode})</span>
            <span className="text-green-600">-₾{Number(order.couponDiscount).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-semibold border-t border-gray-100 pt-2">
          <span className="text-gray-900">Total</span>
          <span className="text-gray-900">₾{Number(order.total).toFixed(2)}</span>
        </div>
      </div>

      {/* Delivery address */}
      {order.address && (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Delivery Address</h3>
          <p className="text-sm text-gray-700">{order.address}</p>
          {order.note && <p className="mt-2 text-xs text-gray-500">Note: {order.note}</p>}
        </div>
      )}

      {/* Actions */}
      {returnCheck.canReturn && (
        <div className="mt-4">
          <Link
            href={`/account/orders/${order.id}/return`}
            className="inline-flex items-center rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
          >
            Request Return
          </Link>
        </div>
      )}
    </div>
  )
}
