"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

type NavLink = { href: string; label: string }

export default function SidebarNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {links.map(({ href, label }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/")
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
