import { getLocale, getTranslations } from "next-intl/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getCachedCategories } from "@/lib/cache/categories"
import CartMerge from "@/components/store/CartMerge"
import WishlistMerge from "@/components/store/WishlistMerge"
import { CompareProvider } from "@/lib/compareContext"
import { CartDrawerProvider } from "@/lib/cartDrawerContext"
import { AuthModalProvider } from "@/lib/authModalContext"
import AuthModal from "@/components/store/AuthModal"
import CompareBar from "@/components/store/CompareBar"
import CartDrawer from "@/components/store/CartDrawer"
import NavigationProgress from "@/components/store/NavigationProgress"
import ScrollToTop from "@/components/store/ScrollToTop"
import { AuthProvider } from "@/lib/authContext"
import { GuestWishlistProvider } from "@/lib/guestWishlist"
import Navbar from "./Navbar"
import Link from "next/link"

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, categories, locale, t] = await Promise.all([
    auth(),
    getCachedCategories(),
    getLocale(),
    getTranslations("Nav"),
  ])

  const isLoggedIn = !!session?.user?.id
  const isBuyer = session?.user?.role === "BUYER"

  const [cartCount, wishlistCount] = await Promise.all([
    isBuyer
      ? prisma.cartItem.count({ where: { userId: session!.user.id } })
      : 0,
    isLoggedIn
      ? prisma.wishlist.count({ where: { userId: session!.user.id } })
      : 0,
  ])

  return (
    <AuthProvider isLoggedIn={isLoggedIn} userId={session?.user?.id ?? null}>
    <AuthModalProvider>
    <CartDrawerProvider>
    <CompareProvider>
    <GuestWishlistProvider>
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavigationProgress />
      <ScrollToTop />
      <Navbar
        categories={categories}
        locale={locale}
        isLoggedIn={isLoggedIn}
        isBuyer={isBuyer}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        userRole={session?.user?.role}
        userName={session?.user?.name}
        userEmail={session?.user?.email}
        vendorsLabel={t("vendors")}
        categoriesLabel={t("categories")}
        signInLabel={t("signIn")}
      />

      {/* Merge guest cart after login */}
      {isLoggedIn && <CartMerge />}
      {isLoggedIn && <WishlistMerge />}

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm font-bold text-blue-600">AutoMarket</p>
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} AutoMarket. All rights reserved.
            </p>
            <nav className="flex items-center gap-4 text-xs text-gray-500">
              <Link href="/vendors" className="hover:text-gray-700 transition-colors">
                {t("vendors")}
              </Link>
            </nav>
          </div>
        </div>
      </footer>

      {/* Compare bar */}
      <CompareBar />

      {/* Cart drawer */}
      <CartDrawer />

      {/* Auth modal */}
      {!isLoggedIn && <AuthModal />}
    </div>
    </GuestWishlistProvider>
    </CompareProvider>
    </CartDrawerProvider>
    </AuthModalProvider>
    </AuthProvider>
  )
}
