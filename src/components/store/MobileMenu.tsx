"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useTranslations, useLocale } from "next-intl"
import { localized } from "@/lib/localeName"
import { useAuthModal } from "@/lib/authModalContext"

type Category = { id: string; slug: string; nameEn: string; name: string }

export default function MobileMenu({
  isOpen,
  onClose,
  categories,
  isLoggedIn,
  userName,
  userEmail,
  userRole,
  wishlistCount,
  wishlistHref,
}: {
  isOpen: boolean
  onClose: () => void
  categories: Category[]
  isLoggedIn: boolean
  userName?: string | null
  userEmail?: string | null
  userRole?: string
  wishlistCount: number
  wishlistHref: string
}) {
  const t = useTranslations("Nav")
  const locale = useLocale()
  const pathname = usePathname()
  const authModal = useAuthModal()
  const [catOpen, setCatOpen] = useState(false)

  // Close on route change
  useEffect(() => {
    onClose()
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  // Close on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [isOpen, onClose])

  const userInitial = (userName ?? userEmail ?? "U").charAt(0).toUpperCase()
  const isWishlistActive =
    pathname === "/wishlist" || pathname.startsWith("/account/wishlist")

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-[300px] max-w-[85vw] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100 shrink-0">
          <Link href="/" onClick={onClose} className="text-lg font-bold text-blue-600 tracking-tight">
            AutoMarket
          </Link>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User section */}
        {isLoggedIn ? (
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-bold">{userInitial}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{userName ?? "User"}</p>
                <p className="text-xs text-gray-400 truncate">{userEmail}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { onClose(); authModal.open("login") }}
                className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-center"
              >
                {t("signIn")}
              </button>
              <button
                onClick={() => { onClose(); authModal.open("register") }}
                className="rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors text-center"
              >
                {t("register")}
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          {/* Main links */}
          <div className="px-3 space-y-0.5">
            <NavLink href="/" icon={HomeIcon} label={t("home")} active={pathname === "/"} />
            <NavLink href="/shop" icon={ShopIcon} label={t("shop")} active={pathname.startsWith("/shop")} />
            <NavLink href="/flash-sales" icon={SalesIcon} label={t("sales")} active={pathname.startsWith("/flash-sales")} />
            <NavLink href="/vendors" icon={VendorsIcon} label={t("vendors")} active={pathname.startsWith("/vendors")} />
            {!isLoggedIn && (
              <NavLink
                href={wishlistHref}
                icon={HeartIcon}
                label={t("wishlist")}
                badge={wishlistCount > 0 ? wishlistCount : undefined}
                active={isWishlistActive}
              />
            )}
          </div>

          {/* Categories accordion */}
          <div className="mt-3 pt-3 border-t border-gray-100 px-3">
            <button
              onClick={() => setCatOpen((v) => !v)}
              className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-semibold text-gray-500 uppercase tracking-wider"
            >
              {t("categories")}
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${catOpen ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <div className={`space-y-0.5 overflow-hidden transition-all duration-200 ${catOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  onClick={onClose}
                  className="block px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors pl-6"
                >
                  {localized(locale, cat.name, cat.nameEn)}
                </Link>
              ))}
            </div>
          </div>

          {/* Account links */}
          {isLoggedIn && (
            <div className="mt-3 pt-3 border-t border-gray-100 px-3 space-y-0.5">
              <NavLink
                href={wishlistHref}
                icon={HeartIcon}
                label={t("wishlist")}
                badge={wishlistCount > 0 ? wishlistCount : undefined}
                active={isWishlistActive}
              />
              <NavLink href="/account/orders" icon={OrdersIcon} label={t("orders")} active={pathname.startsWith("/account/orders")} />
              <NavLink href="/account/profile" icon={ProfileIcon} label={t("profile")} active={pathname.startsWith("/account/profile")} />
              {(userRole === "VENDOR" || userRole === "ADMIN") && (
                <NavLink href="/vendor/dashboard" icon={ShopIcon} label={t("myShop")} active={pathname.startsWith("/vendor")} />
              )}
              {userRole === "ADMIN" && (
                <NavLink href="/admin" icon={AdminIcon} label="Admin" active={pathname.startsWith("/admin")} />
              )}
            </div>
          )}
        </nav>

        {/* Footer */}
        {isLoggedIn && (
          <div className="px-5 py-4 border-t border-gray-100 shrink-0">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-2.5 w-full text-sm text-red-600 hover:text-red-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              {t("signOut")}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

/* ─── NavLink helper ─── */

function NavLink({
  href,
  icon: Icon,
  label,
  badge,
  active,
}: {
  href: string
  icon: React.FC<{ className?: string }>
  label: string
  badge?: number
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-blue-50 text-blue-700"
          : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {badge}
        </span>
      )}
    </Link>
  )
}

/* ─── Icons ─── */

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  )
}

function ShopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
    </svg>
  )
}

function SalesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  )
}

function VendorsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  )
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  )
}

function OrdersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  )
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  )
}

function AdminIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
