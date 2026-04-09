"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"

type Category = { id: string; slug: string; nameEn: string; name: string }

export default function CategoriesDropdown({
  categories,
}: {
  categories: Category[]
}) {
  const t = useTranslations("Nav")
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        aria-expanded={open}
      >
        {t("categories")}
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50">
          {categories.length === 0 ? (
            <p className="px-4 py-2 text-sm text-gray-400">No categories</p>
          ) : (
            categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {cat.nameEn}
                <span className="ml-1 text-xs text-gray-400">/ {cat.name}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
