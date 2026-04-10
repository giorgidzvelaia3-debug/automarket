import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import CartItemRow from "./CartItemRow"
import GuestCartPage from "./GuestCartPage"

export default async function CartPage() {
  const session = await auth()

  // Guest cart — rendered entirely on the client
  if (!session?.user?.id) {
    return <GuestCartPage />
  }

  const items = await prisma.cartItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      quantity: true,
      variantId: true,
      price: true,
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          nameEn: true,
          price: true,
          stock: true,
          images: { take: 1, orderBy: { order: "asc" }, where: { variantId: null }, select: { url: true } },
        },
      },
      variant: {
        select: { id: true, name: true, nameEn: true, price: true, stock: true },
      },
      vendor: {
        select: {
          id: true, name: true, slug: true,
          minOrderAmount: true, maxOrderAmount: true,
          minOrderQty: true, maxOrderQty: true,
        },
      },
    },
  })

  // Serialize Decimal fields for client components.
  // unitPrice = stored cart price (with flash sale discount) ?? variant ?? product
  const serializedItems = items.map((item) => {
    const fallback = item.variant ? Number(item.variant.price) : Number(item.product.price)
    const unitPrice = item.price != null ? Number(item.price) : fallback
    return {
      ...item,
      unitPrice,
      originalUnitPrice: fallback,
      product: { ...item.product, price: Number(item.product.price) },
      variant: item.variant
        ? { ...item.variant, price: Number(item.variant.price) }
        : null,
      vendor: {
        ...item.vendor,
        minOrderAmount: item.vendor.minOrderAmount ? Number(item.vendor.minOrderAmount) : null,
        maxOrderAmount: item.vendor.maxOrderAmount ? Number(item.vendor.maxOrderAmount) : null,
      },
    }
  })

  if (serializedItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-4xl mb-4">🛒</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
        <p className="text-sm text-gray-500 mb-6">კალათა ცარიელია</p>
        <Link
          href="/vendors"
          className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Browse Products
        </Link>
      </div>
    )
  }

  // Group by vendor
  const byVendor = new Map<
    string,
    { vendor: (typeof serializedItems)[0]["vendor"]; items: typeof serializedItems }
  >()

  for (const item of serializedItems) {
    const key = item.vendor.id
    if (!byVendor.has(key)) {
      byVendor.set(key, { vendor: item.vendor, items: [] })
    }
    byVendor.get(key)!.items.push(item)
  }

  const grandTotal = serializedItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  )

  // Compute limit violations per vendor
  type LimitWarning = { type: "warning" | "error"; message: string }
  function computeWarnings(vendor: (typeof serializedItems)[0]["vendor"], total: number, qty: number): LimitWarning[] {
    const warnings: LimitWarning[] = []
    if (vendor.minOrderAmount && total < vendor.minOrderAmount) {
      warnings.push({ type: "warning", message: `${vendor.name}-ის მინიმალური შეკვეთაა ₾${vendor.minOrderAmount.toFixed(2)} (ახლა: ₾${total.toFixed(2)})` })
    }
    if (vendor.maxOrderAmount && total > vendor.maxOrderAmount) {
      warnings.push({ type: "error", message: `${vendor.name}-ის მაქსიმალური შეკვეთაა ₾${vendor.maxOrderAmount.toFixed(2)}` })
    }
    if (vendor.minOrderQty && qty < vendor.minOrderQty) {
      warnings.push({ type: "warning", message: `${vendor.name}-ის მინიმალური რაოდენობაა ${vendor.minOrderQty} (ახლა: ${qty})` })
    }
    if (vendor.maxOrderQty && qty > vendor.maxOrderQty) {
      warnings.push({ type: "error", message: `${vendor.name}-ის მაქსიმალური რაოდენობაა ${vendor.maxOrderQty}` })
    }
    return warnings
  }

  let hasViolations = false
  for (const { vendor, items: vItems } of byVendor.values()) {
    const total = vItems.reduce((s, i) => s + (i.variant?.price ?? i.product.price) * i.quantity, 0)
    const qty = vItems.reduce((s, i) => s + i.quantity, 0)
    if (computeWarnings(vendor, total, qty).length > 0) {
      hasViolations = true
      break
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        Cart / კალათა{" "}
        <span className="text-base font-normal text-gray-400">
          ({serializedItems.length} {serializedItems.length === 1 ? "item" : "items"})
        </span>
      </h1>

      <div className="space-y-6">
        {Array.from(byVendor.values()).map(({ vendor, items: vendorItems }) => {
          const vendorTotal = vendorItems.reduce(
            (sum, item) => sum + item.unitPrice * item.quantity,
            0
          )
          const vendorQty = vendorItems.reduce((s, i) => s + i.quantity, 0)
          const warnings = computeWarnings(vendor, vendorTotal, vendorQty)

          return (
            <div key={vendor.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Vendor header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
                <Link
                  href={`/vendors/${vendor.slug}`}
                  className="text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
                >
                  {vendor.name}
                </Link>
                <span className="text-xs text-gray-400">
                  Subtotal: ₾{vendorTotal.toFixed(2)}
                </span>
              </div>

              {/* Limit warnings */}
              {warnings.length > 0 && (
                <div className="px-5 py-2 space-y-1.5 border-b border-gray-100">
                  {warnings.map((w, i) => (
                    <div
                      key={i}
                      className={`text-xs font-medium px-3 py-2 rounded-lg ${
                        w.type === "error"
                          ? "bg-red-50 border border-red-200 text-red-700"
                          : "bg-amber-50 border border-amber-200 text-amber-800"
                      }`}
                    >
                      {w.type === "error" ? "❌" : "⚠️"} {w.message}
                    </div>
                  ))}
                </div>
              )}

              {/* Items */}
              <div className="divide-y divide-gray-100">
                {vendorItems.map((item) => (
                  <CartItemRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Grand total + checkout */}
      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <span className="text-base font-semibold text-gray-900">Grand Total / სულ</span>
          <span className="text-2xl font-extrabold text-gray-900">₾{grandTotal.toFixed(2)}</span>
        </div>
        {hasViolations && (
          <p className="text-xs text-red-600 mb-3 text-center">
            გადახედე ვენდორების შეკვეთის ლიმიტებს გადახდისთვის
          </p>
        )}
        <Link
          href={hasViolations ? "#" : "/checkout"}
          aria-disabled={hasViolations}
          className={`block w-full rounded-lg px-5 py-3 text-center text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            hasViolations
              ? "bg-gray-300 cursor-not-allowed pointer-events-none"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Proceed to Checkout →
        </Link>
      </div>
    </div>
  )
}
