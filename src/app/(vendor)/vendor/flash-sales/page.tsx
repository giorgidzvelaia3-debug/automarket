import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { deleteFlashSale } from "@/lib/actions/flashSales"

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-700 border-green-200",
  ENDED: "bg-gray-50 text-gray-600 border-gray-200",
  REJECTED: "bg-red-50 text-red-600 border-red-200",
}

export default async function VendorFlashSalesPage() {
  const session = await auth()
  const vendor = await prisma.vendor.findUnique({
    where: { userId: session!.user.id },
    select: { id: true, status: true },
  })
  if (!vendor) redirect("/vendor/register")
  if (vendor.status !== "APPROVED") redirect("/vendor/dashboard")

  const sales = await prisma.flashSale.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  })

  const now = new Date()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Flash Sales</h1>
          <p className="mt-0.5 text-sm text-gray-500">{sales.length} sales</p>
        </div>
        <Link
          href="/vendor/flash-sales/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Create Flash Sale
        </Link>
      </div>

      {sales.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">No flash sales yet.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Period</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Items</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.map((sale) => {
                const isLive = sale.status === "ACTIVE" && sale.startTime <= now && sale.endTime >= now
                const isPast = sale.endTime < now
                return (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{sale.titleEn}</p>
                      <p className="text-xs text-gray-400">{sale.title}</p>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">
                      <p>{sale.startTime.toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                      <p>→ {sale.endTime.toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </td>
                    <td className="px-5 py-3 text-center">{sale._count.items}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusStyles[sale.status]}`}>
                        {isLive ? "Live" : isPast ? "Ended" : sale.status.charAt(0) + sale.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {sale.status !== "ENDED" && !isPast && (
                          <Link href={`/vendor/flash-sales/${sale.id}/edit`} className="text-xs text-blue-600 hover:underline">Edit</Link>
                        )}
                        <form action={async () => { "use server"; await deleteFlashSale(sale.id) }}>
                          <button type="submit" className="text-xs text-red-500 hover:underline">Delete</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
