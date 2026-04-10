import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canRequestReturn } from "@/lib/actions/returns"
import ReturnForm from "./ReturnForm"

export default async function RequestReturnPage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      buyerId: true,
      total: true,
      createdAt: true,
      orderItems: {
        select: {
          id: true,
          quantity: true,
          price: true,
          vendorId: true,
          product: {
            select: {
              name: true,
              nameEn: true,
              images: { take: 1, orderBy: { order: "asc" }, where: { variantId: null }, select: { url: true } },
            },
          },
          vendor: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!order || order.buyerId !== session.user.id) notFound()

  const check = await canRequestReturn(id)
  if (!check.canReturn) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/account/orders" className="text-xs text-gray-400 hover:text-gray-600">
          ← Back to Orders
        </Link>
        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-5 py-4">
          <p className="text-sm font-semibold text-red-700">Cannot request return</p>
          <p className="text-xs text-red-600 mt-1">{check.reason}</p>
        </div>
      </div>
    )
  }

  // Group items by vendor — create one return per vendor
  // For simplicity, take the first vendor's items
  const firstVendorId = order.orderItems[0]?.vendor.id
  const vendorItems = order.orderItems.filter((i) => i.vendor.id === firstVendorId)

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/account/orders" className="text-xs text-gray-400 hover:text-gray-600">
        ← Back to Orders
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">Request Return</h1>
      <p className="mt-1 text-sm text-gray-500">
        Order #{order.id.slice(-8).toUpperCase()} · {order.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
      </p>

      <div className="mt-6">
        <ReturnForm
          orderId={order.id}
          vendorId={firstVendorId!}
          items={vendorItems.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            price: Number(item.price),
            name: item.product.name,
            nameEn: item.product.nameEn,
            imageUrl: item.product.images[0]?.url ?? null,
          }))}
        />
      </div>
    </div>
  )
}
