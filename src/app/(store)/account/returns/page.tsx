import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getBuyerReturnRequests } from "@/lib/actions/returns"

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-blue-50 text-blue-700 border-blue-200",
  REJECTED: "bg-red-50 text-red-600 border-red-200",
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
}

const reasonLabels: Record<string, string> = {
  DEFECTIVE: "Defective",
  WRONG_ITEM: "Wrong item",
  NOT_AS_DESCRIBED: "Not as described",
  CHANGED_MIND: "Changed mind",
  OTHER: "Other",
}

export default async function BuyerReturnsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const returns = await getBuyerReturnRequests()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Returns</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {returns.length} return request{returns.length !== 1 ? "s" : ""}
        </p>
      </div>

      {returns.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-4xl mb-4">📦</p>
          <p className="text-sm text-gray-500 mb-6">No return requests yet.</p>
          <Link href="/account/orders" className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
            View Orders
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map((req) => (
            <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-gray-500">#{req.id.slice(-8).toUpperCase()}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      req.type === "RETURN" ? "bg-green-50 text-green-700 border border-green-200" : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}>
                      {req.type}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${statusStyles[req.status]}`}>
                      {req.status.charAt(0) + req.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Order #{req.orderId.slice(-8).toUpperCase()} · {req.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Vendor: <Link href={`/vendors/${req.vendor.slug}`} className="text-blue-600 hover:underline">{req.vendor.name}</Link>
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-1 mb-3">
                {req.items.map((it) => (
                  <p key={it.id} className="text-xs text-gray-700">
                    {it.orderItem.product.name} <span className="text-gray-400">×{it.quantity}</span>
                  </p>
                ))}
              </div>

              {/* Reason + description */}
              <div className="text-xs">
                <p><span className="font-semibold text-gray-700">Reason:</span> <span className="text-gray-600">{reasonLabels[req.reason]}</span></p>
                {req.description && (
                  <p className="mt-1 text-gray-600">{req.description}</p>
                )}
              </div>

              {/* Images */}
              {req.images.length > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  {req.images.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={url} alt="" className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
                  ))}
                </div>
              )}

              {/* Vendor note */}
              {req.vendorNote && (
                <div className="mt-3 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
                  <p className="text-[10px] font-semibold text-blue-700 uppercase">Vendor Note</p>
                  <p className="text-xs text-blue-800 mt-0.5">{req.vendorNote}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
