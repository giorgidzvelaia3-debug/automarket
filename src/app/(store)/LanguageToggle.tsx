"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"

export default function LanguageToggle({ locale }: { locale: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function setLocale(next: string) {
    document.cookie = `LOCALE=${next};path=/;max-age=31536000;SameSite=Lax`
    startTransition(() => router.refresh())
  }

  return (
    <div className={`flex items-center gap-0.5 text-xs font-medium ${isPending ? "opacity-50" : ""}`}>
      <button
        onClick={() => setLocale("en")}
        className={`px-1.5 py-0.5 rounded transition-colors ${
          locale === "en"
            ? "text-blue-600 bg-blue-50"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        EN
      </button>
      <span className="text-gray-300">/</span>
      <button
        onClick={() => setLocale("ka")}
        className={`px-1.5 py-0.5 rounded transition-colors ${
          locale === "ka"
            ? "text-blue-600 bg-blue-50"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        KA
      </button>
    </div>
  )
}
