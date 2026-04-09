import Link from "next/link"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth, signOut } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import SidebarNav from "@/components/SidebarNav"

const navLinks = [
  { href: "/vendor/dashboard", label: "Dashboard" },
  { href: "/vendor/products", label: "Products" },
  { href: "/vendor/flash-sales", label: "Flash Sales" },
  { href: "/vendor/coupons", label: "Coupons" },
  { href: "/vendor/orders", label: "Orders" },
  { href: "/vendor/returns", label: "Returns" },
  { href: "/vendor/earnings", label: "Earnings" },
  { href: "/vendor/balance", label: "Balance" },
  { href: "/vendor/messages", label: "Messages" },
  { href: "/vendor/profile", label: "Profile" },
]

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user || (session.user.role !== "VENDOR" && session.user.role !== "ADMIN")) {
    redirect("/login")
  }

  const headersList = await headers()
  const pathname = headersList.get("x-pathname") ?? ""

  const vendor = await prisma.vendor.findUnique({
    where: { userId: session.user.id },
    select: { id: true, name: true, status: true },
  })

  // Redirect to registration unless already on that page
  if (!vendor && pathname !== "/vendor/register") {
    redirect("/vendor/register")
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        {/* Brand */}
        <div className="px-6 py-5 border-b border-gray-200">
          <span className="text-base font-bold text-gray-900 tracking-tight">
            AutoMarket
          </span>
          <span className="ml-2 text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
            Vendor
          </span>
        </div>

        {/* Vendor name / registration prompt */}
        {vendor ? (
          <div className="px-6 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-900 truncate">
              {vendor.name}
            </p>
            <span
              className={`mt-0.5 inline-block text-xs ${
                vendor.status === "APPROVED"
                  ? "text-green-600"
                  : vendor.status === "PENDING"
                    ? "text-amber-500"
                    : "text-red-500"
              }`}
            >
              {vendor.status.charAt(0) + vendor.status.slice(1).toLowerCase()}
            </span>
          </div>
        ) : (
          <div className="px-6 py-3 border-b border-gray-100">
            <p className="text-xs text-amber-600 font-medium">
              Complete your registration
            </p>
          </div>
        )}

        {/* Nav */}
        {vendor ? <SidebarNav links={navLinks} /> : null}

        {/* User + logout */}
        <div className="px-4 py-4 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-900 truncate mb-0.5">
            {session.user.name ?? session.user.email}
          </p>
          <p className="text-xs text-gray-400 truncate mb-3">
            {session.user.email}
          </p>
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/login" })
            }}
          >
            <button
              type="submit"
              className="text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  )
}
