import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import ReturnActions from "./ReturnActions"

const ALL_STATUSES = ["PENDING", "APPROVED", "REJECTED", "COMPLETED"] as const

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

export default async function VendorReturnsPage(props: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await auth()
  const vendor = await prisma.vendor.findUnique({
    where: { userId: session!.user.id },
    select: { id: true, status: true },
  })
  if (!vendor) redirect("/vendor/register")
  if (vendor.status !== "APPROVED") redirect("/vendor/dashboard")

  const { status: filter } = await props.searchParams

  const [returns, allReturns] = await Promise.all([
    prisma.returnRequest.findMany({
      where: {
        vendorId: vendor.id,
        ...(filter && (ALL_STATUSES as readonly string[]).includes(filter) ? { status: filter as never } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        buyer: { select: { name: true, email: true } },
        items: {
          include: {
            orderItem: {
              select: { quantity: true, product: { select: { name: true, nameEn: true } } },
            },
          },
        },
      },
    }),
    prisma.returnRequest.findMany({
      where: { vendorId: vendor.id },
      select: { status: true },
    }),
  ])

  const counts = {
    total: allReturns.length,
    pending: allReturns.filter((r) => r.status === "PENDING").length,
    approved: allReturns.filter((r) => r.status === "APPROVED").length,
    rejected: allReturns.filter((r) => r.status === "REJECTED").length,
    completed: allReturns.filter((r) => r.status === "COMPLETED").length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Returns</h1>
        <p className="mt-0.5 text-sm text-gray-500">{counts.total} total return requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{counts.pending}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-gray-500">Approved</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{counts.approved}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-gray-500">Rejected</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{counts.rejected}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-xs text-gray-500">Completed</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{counts.completed}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <Link href="/vendor/returns" className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!filter ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>All</Link>
        {ALL_STATUSES.map((s) => (
          <Link key={s} href={`/vendor/returns?status=${s}`} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === s ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>

      {returns.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">No return requests.</div>
      ) : (
        <div className="space-y-4">
          {returns.map((req) => (
            <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-5">
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
                  <p className="mt-1 text-xs text-gray-500">
                    From <span className="font-medium text-gray-700">{req.buyer.name ?? req.buyer.email}</span>
                    {" · "}
                    Order #{req.orderId.slice(-8).toUpperCase()}
                    {" · "}
                    {req.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                <ReturnActions returnId={req.id} status={req.status} />
              </div>

              <div className="bg-gray-50 rounded-lg p-3 space-y-1 mb-3">
                {req.items.map((it) => (
                  <p key={it.id} className="text-xs text-gray-700">
                    {it.orderItem.product.name} <span className="text-gray-400">×{it.quantity}</span>
                  </p>
                ))}
              </div>

              <div className="text-xs">
                <p><span className="font-semibold text-gray-700">Reason:</span> <span className="text-gray-600">{reasonLabels[req.reason]}</span></p>
                {req.description && <p className="mt-1 text-gray-600">{req.description}</p>}
              </div>

              {req.images.length > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  {req.images.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={url} alt="" className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
                  ))}
                </div>
              )}

              {req.vendorNote && (
                <div className="mt-3 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
                  <p className="text-[10px] font-semibold text-blue-700 uppercase">Your Note</p>
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
