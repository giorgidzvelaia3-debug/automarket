"use client"

import { useState, useTransition } from "react"
import { updateBuyerProfile } from "@/lib/actions/account"

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-base sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"

export default function ProfileForm({
  name: initialName,
  email,
}: {
  name: string
  email: string
}) {
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError("")
    startTransition(async () => {
      try {
        await updateBuyerProfile(formData)
        setStatus("saved")
        setTimeout(() => setStatus("idle"), 3000)
      } catch (e) {
        setError((e as Error).message)
        setStatus("error")
        setTimeout(() => setStatus("idle"), 3000)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      {status === "saved" && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3">
          <p className="text-sm text-green-700">Profile saved successfully.</p>
        </div>
      )}

      {/* Basic info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900">Basic Information</h2>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
            Full Name
          </label>
          <input id="name" name="name" type="text" required defaultValue={initialName} className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email <span className="text-gray-400 font-normal">(cannot be changed)</span>
          </label>
          <input type="email" value={email} readOnly className={`${inputClass} bg-gray-50 text-gray-400 cursor-not-allowed`} />
        </div>
      </div>

      {/* Password change */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900">Change Password</h2>
        <p className="text-xs text-gray-500">Leave blank to keep your current password.</p>

        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
            Current Password
          </label>
          <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" className={inputClass} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
              New Password
            </label>
            <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={8} className={inputClass} />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirm Password
            </label>
            <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} className={inputClass} />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
          status === "saved" ? "bg-green-600" : status === "error" ? "bg-red-600" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isPending ? "Saving…" : status === "saved" ? "Saved!" : "Save Changes"}
      </button>
    </form>
  )
}
