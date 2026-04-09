"use client"

import { approveVendor, suspendVendor } from "@/lib/actions/vendors"

export default function VendorActions({
  id,
  status,
}: {
  id: string
  status: "PENDING" | "APPROVED" | "SUSPENDED"
}) {
  const approveWithId = approveVendor.bind(null, id)
  const suspendWithId = suspendVendor.bind(null, id)

  return (
    <div className="flex items-center justify-end gap-2">
      {status !== "APPROVED" && (
        <form action={approveWithId}>
          <button
            type="submit"
            className="text-xs font-medium text-green-600 hover:text-green-800 transition-colors"
          >
            Approve
          </button>
        </form>
      )}
      {status !== "SUSPENDED" && (
        <form action={suspendWithId}>
          <button
            type="submit"
            className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
          >
            Suspend
          </button>
        </form>
      )}
    </div>
  )
}
