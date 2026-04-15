import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import OrderStatusButton from "@/components/OrderStatusButton"
import DownloadInvoiceButton from "@/components/store/DownloadInvoiceButton"

const statusStyles: Record<string, string> = {
  PENDING:   "bg-amber-50  text-amber-700  border-amber-200",
  CONFIRMED: "bg-blue-50   text-blue-700   border-blue-200",
  SHIPPED:   "bg-purple-50 text-purple-700 border-purple-200",
  DELIVERED: "bg-green-50  text-green-700  border-green-200",
  CANCELLED: "bg-red-50    text-red-600    border-red-200",
}

export default async function VendorOrderDetailPage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const vendor = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
    select: { id: true, status: true },
  })
  if (!vendor) redirect("/vendor/register")
  if (vendor.status !== "APPROVED") redirect("/vendor/dashboard")

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      total: true,
      address: true,
      note: true,
      createdAt: true,
      buyer: { select: { name: true, email: true } },
      orderItems: {
        where: { vendorId: vendor.id },
        select: {
          id: true,
          quantity: true,
          price: true,
          variantName: true,
          vendorEarning: true,
          adminCommission: true,
          commissionRate: true,
          product: {
            select: {
              name: true,
              nameEn: true,
              images: { take: 1, orderBy: { order: "asc" }, where: { variantId: null }, select: { url: true } },
            },
          },
        },
      },
    },
  })

  if (!order || order.orderItems.length === 0) notFound()

  const vendorTotal = order.orderItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity, 0
  )
  const vendorEarning = order.orderItems.reduce(
    (sum, item) => sum + Number(item.vendorEarning), 0
  )
  const commission = order.orderItems.reduce(
    (sum, item) => sum + Number(item.adminCommission), 0
  )

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/vendor/orders" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Orders
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            Order #{order.id.slice(-8).toUpperCase()}
          </h1>
          <div className="flex items-center gap-3">
            <DownloadInvoiceButton
              variant="icon"
              order={{
                orderId: order.id,
                createdAt: order.createdAt.toISOString(),
                buyerName: order.buyer?.name ?? "Guest",
                buyerPhone: "",
                buyerAddress: order.address ?? "",
                vendorName: "My Store",
                items: order.orderItems.map((item) => ({
                  productName: item.product.name,
                  productNameEn: item.product.nameEn,
                  variantName: item.variantName,
                  quantity: item.quantity,
                  unitPrice: Number(item.price),
                  total: Number(item.price) * item.quantity,
                })),
                subtotal: vendorTotal,
                grandTotal: vendorTotal,
              }}
            />
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusStyles[order.status]}`}>
              {order.status}
            </span>
            <OrderStatusButton orderId={order.id} status={order.status} />
          </div>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {order.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {/* Buyer info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Buyer</h2>
        <p className="text-sm font-medium text-gray-900">{order.buyer?.name ?? "Guest"}</p>
        <p className="text-xs text-gray-500">{order.buyer?.email ?? "—"}</p>
        {order.address && <p className="text-xs text-gray-500 mt-2">{order.address}</p>}
        {order.note && <p className="text-xs text-gray-400 mt-1">Note: {order.note}</p>}
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Your Items</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {order.orderItems.map((item) => (
            <div key={item.id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                {item.product.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="flex items-center justify-center h-full text-gray-300">□</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                <p className="text-xs text-gray-400">{item.product.nameEn}</p>
                {item.variantName && <p className="text-xs text-blue-600 font-medium">{item.variantName}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-gray-900">₾{(Number(item.price) * item.quantity).toFixed(2)}</p>
                <p className="text-xs text-gray-400">₾{Number(item.price).toFixed(2)} × {item.quantity}</p>
              </div>
              <div className="text-right shrink-0 w-24">
                <p className="text-xs text-green-600 font-medium">+₾{Number(item.vendorEarning).toFixed(2)}</p>
                <p className="text-[10px] text-gray-400">{Number(item.commissionRate).toFixed(1)}% fee</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Sale Total</span>
          <span className="text-gray-900">₾{vendorTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Platform Commission</span>
          <span className="text-red-600">-₾{commission.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-base font-semibold border-t border-gray-100 pt-2">
          <span className="text-green-700">Your Earning</span>
          <span className="text-green-700">₾{vendorEarning.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
