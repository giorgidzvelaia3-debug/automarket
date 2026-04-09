import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createOrder } from "@/lib/actions/orders"
import GuestCheckoutPage from "./GuestCheckoutPage"
import CouponInput from "./CouponInput"
import { optimizeImageUrl } from "@/lib/imageUtils"

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"

export default async function CheckoutPage() {
  const session = await auth()

  // Guest checkout — rendered entirely on the client
  if (!session?.user?.id) {
    return <GuestCheckoutPage />
  }

  const rawItems = await prisma.cartItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      quantity: true,
      price: true,
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          nameEn: true,
          price: true,
          stock: true,
          categoryId: true,
          images: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
        },
      },
      variant: { select: { price: true } },
      vendor: { select: { id: true, name: true, slug: true } },
    },
  })

  if (rawItems.length === 0) redirect("/cart")

  // unitPrice = stored cart price (with flash sale) ?? variant ?? product
  const items = rawItems.map((item) => ({
    ...item,
    unitPrice:
      item.price != null
        ? Number(item.price)
        : Number(item.variant?.price ?? item.product.price),
  }))

  // Group by vendor
  const byVendor = new Map<
    string,
    { vendor: (typeof items)[0]["vendor"]; items: typeof items }
  >()
  for (const item of items) {
    const key = item.vendor.id
    if (!byVendor.has(key)) byVendor.set(key, { vendor: item.vendor, items: [] })
    byVendor.get(key)!.items.push(item)
  }

  const total = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  )

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link href="/cart" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          ← Back to Cart
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Checkout</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: form */}
        <div className="lg:col-span-3">
          <form action={createOrder} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <h2 className="text-base font-semibold text-gray-900">Delivery Details</h2>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1.5">
                Full name <span className="text-red-400">*</span>
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                defaultValue={session.user?.name ?? ""}
                placeholder="John Doe"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone <span className="text-red-400">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder="+995 555 000 000"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1.5">
                Address <span className="text-red-400">*</span>
              </label>
              <input
                id="address"
                name="address"
                type="text"
                required
                placeholder="123 Rustaveli Ave"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1.5">
                City <span className="text-red-400">*</span>
              </label>
              <input
                id="city"
                name="city"
                type="text"
                required
                placeholder="Tbilisi"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1.5">
                Note <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="note"
                name="note"
                rows={3}
                placeholder="Any delivery instructions…"
                className={`${inputClass} resize-none`}
              />
            </div>

            <CouponInput
              cartItems={items.map((item) => ({
                productId: item.product.id,
                vendorId: item.vendor.id,
                categoryId: item.product.categoryId,
                price: item.unitPrice,
                quantity: item.quantity,
              }))}
            />

            <div className="pt-2">
              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
              >
                Place Order — ₾{total.toFixed(2)}
              </button>
            </div>
          </form>
        </div>

        {/* Right: order summary */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Order Summary</h2>

          {Array.from(byVendor.values()).map(({ vendor, items: vendorItems }) => (
            <div key={vendor.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-600">{vendor.name}</p>
              </div>
              <div className="divide-y divide-gray-100">
                {vendorItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      {item.product.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={optimizeImageUrl(item.product.images[0].url, 80)}
                          alt={item.product.nameEn}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="flex items-center justify-center h-full text-gray-300 text-lg">□</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-400">×{item.quantity}</p>
                    </div>
                    <p className="text-xs font-semibold text-gray-900 shrink-0">
                      ₾{(item.unitPrice * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">Total</span>
            <span className="text-lg font-extrabold text-gray-900">₾{total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
