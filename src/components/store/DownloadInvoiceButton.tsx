"use client"

import { useState } from "react"
import { generateOrderInvoice, type InvoiceData } from "@/lib/generateInvoice"

export default function DownloadInvoiceButton({
  order,
  variant = "full",
}: {
  order: InvoiceData
  variant?: "icon" | "full"
}) {
  const [loading, setLoading] = useState(false)

  function handleDownload() {
    setLoading(true)
    try {
      generateOrderInvoice(order)
    } finally {
      setTimeout(() => setLoading(false), 500)
    }
  }

  const icon = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className="p-1.5 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
        title="Download Invoice"
      >
        {icon}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50"
    >
      {icon}
      {loading ? "Generating..." : "Invoice PDF"}
    </button>
  )
}
