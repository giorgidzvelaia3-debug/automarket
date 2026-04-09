"use client"

import { useState, useTransition } from "react"
import { adminOverrideReturn } from "@/lib/actions/returns"

export default function AdminReturnActions({
  returnId,
  status,
}: {
  returnId: string
  status: string
}) {
  const [open, setOpen] = useState<"approve" | "reject" | "complete" | null>(null)
  const [note, setNote] = useState("")
  const [isPending, startTransition] = useTransition()

  function process(action: "approve" | "reject" | "complete") {
    startTransition(async () => {
      await adminOverrideReturn(returnId, action, note)
      setOpen(null)
      setNote("")
    })
  }

  return (
    <>
      <div className="flex items-center gap-1.5 justify-end">
        {status !== "APPROVED" && (
          <button
            type="button"
            onClick={() => setOpen("approve")}
            className="text-xs font-semibold text-green-600 hover:underline"
          >
            Approve
          </button>
        )}
        {status !== "REJECTED" && (
          <button
            type="button"
            onClick={() => setOpen("reject")}
            className="text-xs font-semibold text-red-500 hover:underline"
          >
            Reject
          </button>
        )}
        {status === "APPROVED" && (
          <button
            type="button"
            onClick={() => setOpen("complete")}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            Complete
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setOpen(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900">
              Admin Override — {open.charAt(0).toUpperCase() + open.slice(1)}
            </h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="Admin note…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={() => setOpen(null)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
              <button
                type="button"
                onClick={() => process(open)}
                disabled={isPending}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending ? "Processing…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
