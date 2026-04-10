"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useAuthModal } from "@/lib/authModalContext"
import { registerUser } from "@/lib/actions/auth"

export default function AuthModal() {
  const { isOpen, tab, close, setTab } = useAuthModal()
  const t = useTranslations("Auth")

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close()
    }
    if (isOpen) document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [isOpen, close])

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={close}
      />

      {/* Modal */}
      <div
        className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-200 ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div
          className="bg-white rounded-2xl shadow-xl w-full max-w-sm relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={close}
            className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 transition-colors z-10"
            aria-label={t("close")}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="pt-6 px-6 pb-0 text-center">
            <h2 className="text-xl font-bold text-gray-900">{t("appName")}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {tab === "login" ? t("signInTitle") : t("registerTitle")}
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {tab === "login" ? (
              <LoginForm t={t} onSuccess={close} onSwitch={() => setTab("register")} />
            ) : (
              <RegisterForm t={t} onSuccess={() => setTab("login")} onSwitch={() => setTab("login")} />
            )}
          </div>
        </div>
      </div>
    </>
  )
}

/* ─── Login Form ─────────────────────────────────── */

function LoginForm({
  t,
  onSuccess,
  onSwitch,
}: {
  t: ReturnType<typeof useTranslations<"Auth">>
  onSuccess: () => void
  onSwitch: () => void
}) {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const email = form.get("email") as string
    const password = form.get("password") as string

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError(t("loginError"))
      setLoading(false)
    } else {
      onSuccess()
      window.location.reload()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="modal-email" className="block text-sm font-medium text-gray-700 mb-1">
          {t("email")}
        </label>
        <input
          id="modal-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="modal-password" className="block text-sm font-medium text-gray-700 mb-1">
          {t("password")}
        </label>
        <input
          id="modal-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-60"
      >
        {loading ? "…" : t("submitSignIn")}
      </button>

      <p className="text-center text-sm text-gray-500 pt-1">
        {t("noAccount")}{" "}
        <button type="button" onClick={onSwitch} className="text-blue-600 hover:underline font-medium">
          {t("registerLink")}
        </button>
      </p>
    </form>
  )
}

/* ─── Register Form ──────────────────────────────── */

function RegisterForm({
  t,
  onSuccess,
  onSwitch,
}: {
  t: ReturnType<typeof useTranslations<"Auth">>
  onSuccess: () => void
  onSwitch: () => void
}) {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const errorMessages: Record<string, string> = {
    passwords_mismatch: t("passwordsMismatch"),
    password_too_short: t("passwordTooShort"),
    email_exists: t("emailExists"),
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const result = await registerUser({
      name: form.get("name") as string,
      email: form.get("email") as string,
      password: form.get("password") as string,
      confirmPassword: form.get("confirmPassword") as string,
    })

    setLoading(false)

    if (result.success) {
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onSuccess()
      }, 1500)
    } else {
      setError(errorMessages[result.error ?? ""] ?? t("unknownError"))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2.5">
          <p className="text-sm text-green-700">{t("successRegistered")}</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="modal-name" className="block text-sm font-medium text-gray-700 mb-1">
          {t("name")}
        </label>
        <input
          id="modal-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          placeholder="John Doe"
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      <div>
        <label htmlFor="modal-reg-email" className="block text-sm font-medium text-gray-700 mb-1">
          {t("email")}
        </label>
        <input
          id="modal-reg-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      <div>
        <label htmlFor="modal-reg-pass" className="block text-sm font-medium text-gray-700 mb-1">
          {t("password")}
        </label>
        <input
          id="modal-reg-pass"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="••••••••"
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      <div>
        <label htmlFor="modal-reg-confirm" className="block text-sm font-medium text-gray-700 mb-1">
          {t("confirmPassword")}
        </label>
        <input
          id="modal-reg-confirm"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="••••••••"
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-60"
      >
        {loading ? "…" : t("submitRegister")}
      </button>

      <p className="text-center text-sm text-gray-500 pt-1">
        {t("haveAccount")}{" "}
        <button type="button" onClick={onSwitch} className="text-blue-600 hover:underline font-medium">
          {t("signInLink")}
        </button>
      </p>
    </form>
  )
}
