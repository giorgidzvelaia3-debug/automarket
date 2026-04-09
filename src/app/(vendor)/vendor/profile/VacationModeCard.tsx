"use client"

import { useState, useTransition } from "react"
import { setVacationMode } from "@/lib/actions/vacation"

export default function VacationModeCard({
  initialEnabled,
  initialMessage,
  initialEnd,
}: {
  initialEnabled: boolean
  initialMessage: string | null
  initialEnd: string | null
}) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [message, setMessage] = useState(initialMessage ?? "")
  const [endDate, setEndDate] = useState(initialEnd ?? "")
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle")
  const [isPending, startTransition] = useTransition()

  function save() {
    startTransition(async () => {
      try {
        await setVacationMode(enabled, message, endDate || undefined)
        setStatus("saved")
        setTimeout(() => setStatus("idle"), 2000)
      } catch {
        setStatus("error")
        setTimeout(() => setStatus("idle"), 2000)
      }
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Vacation Mode</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Temporarily disable orders while you&apos;re away
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEnabled(!enabled)}
          className={`w-12 h-7 rounded-full transition-colors relative ${enabled ? "bg-amber-500" : "bg-gray-300"}`}
        >
          <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "left-[26px]" : "left-1"}`} />
        </button>
      </div>

      {/* Status indicator */}
      <div>
        {enabled ? (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-xs text-amber-800 font-medium">
            ⚠️ On Vacation{endDate && ` until ${new Date(endDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`}
          </div>
        ) : (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-xs text-green-800 font-medium">
            ✓ Active — accepting orders
          </div>
        )}
      </div>

      {enabled && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
              Message to customers
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Be back on April 15th!"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
              Auto-end date <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
            status === "saved" ? "bg-green-600 text-white" : status === "error" ? "bg-red-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isPending ? "Saving…" : status === "saved" ? "Saved!" : status === "error" ? "Error" : "Save"}
        </button>
      </div>
    </div>
  )
}
