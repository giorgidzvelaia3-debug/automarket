import Link from "next/link"
import { redirect } from "next/navigation"
import { auth, signOut } from "@/lib/auth"
import SidebarNav from "@/components/SidebarNav"

const navLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/vendors", label: "Vendors" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/returns", label: "Returns" },
  { href: "/admin/flash-sales", label: "Flash Sales" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/withdrawals", label: "Withdrawals" },
  { href: "/admin/earnings", label: "Earnings" },
  { href: "/admin/commission", label: "Commission" },
  { href: "/admin/banners", label: "Banners" },
  { href: "/admin/settings", label: "Settings" },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login")
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
            Admin
          </span>
        </div>

        {/* Nav */}
        <SidebarNav links={navLinks} />

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
              className="w-full text-left text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  )
}
