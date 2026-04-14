"use client"

import { useState, useTransition } from "react"
import { requestWithdrawal } from "@/lib/actions/withdrawal"

export default function WithdrawalForm({ availableBalance }: { availableBalance: number }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<"BANK_TRANSFER" | "PAYPAL" | "CASH" | "OTHER">("BANK_TRANSFER")
  const [note, setNote] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function submit() {
    setError("")
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) {
      setError("Enter a valid amount")
      return
    }
    startTransition(async () => {
      try {
        await requestWithdrawal(amt, method, note)
        setOpen(false)
        setAmount("")
        setNote("")
      } catch (e) {
        setError((e as Error).message)
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={availableBalance < 50}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Request Withdrawal
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Request Withdrawal</h2>
              <p className="text-xs text-gray-500 mt-1">Available: ₾{availableBalance.toFixed(2)} • Min: ₾50</p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">{error}</div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Amount (₾)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="50"
                max={availableBalance}
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as never)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              >
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="PAYPAL">PayPal</option>
                <option value="CASH">Cash</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Note (Bank details / PayPal email)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="IBAN, account holder name, etc."
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={isPending}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isPending ? "Submitting…" : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
