"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useLocale } from "next-intl"
import { localized } from "@/lib/localeName"
import { optimizeImageUrl } from "@/lib/imageUtils"

type Suggestion = {
  slug: string
  name: string
  nameEn: string
  price: number
  image: string | null
}

export default function SearchBar({
  defaultValue = "",
  placeholder = "Search parts, brands, vendors…",
  className = "",
}: {
  defaultValue?: string
  placeholder?: string
  className?: string
}) {
  const locale = useLocale()
  const [query, setQuery] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const router = useRouter()

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`)
        const data: Suggestion[] = await res.json()
        setSuggestions(data)
        setOpen(data.length > 0)
        setActiveIndex(-1)
      } catch {
        setSuggestions([])
      }
    }, 250)

    return () => clearTimeout(timerRef.current)
  }, [query])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      router.push(`/products/${suggestions[activeIndex].slug}`)
    } else if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full rounded-xl px-4 py-3 text-base sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 border border-gray-200"
          />

          {/* Suggestions dropdown */}
          {open && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50">
              {suggestions.map((s, i) => (
                <Link
                  key={s.slug}
                  href={`/products/${s.slug}`}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    i === activeIndex ? "bg-blue-50" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                    {s.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={optimizeImageUrl(s.image, 64)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-300 text-sm">□</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{localized(locale, s.name, s.nameEn)}</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-700 shrink-0">
                    ₾{s.price.toFixed(2)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
        <button
          type="submit"
          className="rounded-xl bg-blue-600 text-white font-semibold px-5 py-3 text-sm hover:bg-blue-700 transition-colors shrink-0"
        >
          Search
        </button>
      </form>
    </div>
  )
}
