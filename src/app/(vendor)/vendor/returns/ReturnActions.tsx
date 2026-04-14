"use client"

import { useState, useTransition } from "react"
import { vendorProcessReturn, markReturnCompleted } from "@/lib/actions/returns"

export default function ReturnActions({
  returnId,
  status,
}: {
  returnId: string
  status: string
}) {
  const [open, setOpen] = useState<"approve" | "reject" | null>(null)
  const [note, setNote] = useState("")
  const [isPending, startTransition] = useTransition()

  function process(action: "approve" | "reject") {
    startTransition(async () => {
      await vendorProcessReturn(returnId, action, note)
      setOpen(null)
      setNote("")
    })
  }

  function complete() {
    startTransition(async () => {
      await markReturnCompleted(returnId)
    })
  }

  if (status === "PENDING") {
    return (
      <>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen("approve")}
            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => setOpen("reject")}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
          >
            Reject
          </button>
        </div>

        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setOpen(null)}>
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-900">
                {open === "approve" ? "Approve Return" : "Reject Return"}
              </h3>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder="Note to buyer…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={() => setOpen(null)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
                <button
                  type="button"
                  onClick={() => process(open)}
                  disabled={isPending}
                  className={`rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                    open === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {isPending ? "Processing…" : open === "approve" ? "Approve" : "Reject"}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  if (status === "APPROVED") {
    return (
      <button
        type="button"
        onClick={complete}
        disabled={isPending}
        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {isPending ? "…" : "Mark Completed"}
      </button>
    )
  }

  return null
}
