"use client"

import { useRouter, useSearchParams } from "next/navigation"

type Vendor = { id: string; name: string; count: number }

export default function VendorFilter({ vendors, current }: { vendors: Vendor[]; current?: string }) {
  const router = useRouter()
  const params = useSearchParams()

  function onChange(vendorId: string) {
    const sp = new URLSearchParams(params.toString())
    if (vendorId) sp.set("vendorId", vendorId)
    else sp.delete("vendorId")
    router.push(`/admin/returns?${sp.toString()}`)
  }

  return (
    <select
      defaultValue={current ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs"
    >
      <option value="">All vendors</option>
      {vendors.map((v) => (
        <option key={v.id} value={v.id}>
          {v.name} ({v.count})
        </option>
      ))}
    </select>
  )
}
