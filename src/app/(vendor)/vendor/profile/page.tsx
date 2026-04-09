import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { updateVendorProfile } from "@/lib/actions/vendors"
import VacationModeCard from "./VacationModeCard"
import OrderLimitsCard from "./OrderLimitsCard"

function toLocalDatetime(date: Date | null): string | null {
  if (!date) return null
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"

export default async function VendorProfilePage(props: {
  searchParams: Promise<{ saved?: string }>
}) {
  const { saved } = await props.searchParams
  const session = await auth()

  const vendor = await prisma.vendor.findUnique({
    where: { userId: session!.user.id },
    select: {
      id: true, name: true, slug: true, description: true, phone: true, status: true,
      vacationMode: true, vacationMessage: true, vacationEnd: true,
      minOrderAmount: true, maxOrderAmount: true, minOrderQty: true, maxOrderQty: true,
    },
  })

  if (!vendor) redirect("/vendor/register")

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Shop Profile</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Update your shop&apos;s public information.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {saved && (
          <div className="mb-5 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
            <p className="text-sm text-green-700">Profile saved successfully.</p>
          </div>
        )}

        <form action={updateVendorProfile} className="space-y-5">
          {/* Shop name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Shop name <span className="text-red-400">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={vendor.name}
              className={inputClass}
            />
          </div>

          {/* Slug (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Shop URL <span className="text-gray-400 font-normal">(cannot be changed)</span>
            </label>
            <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
              <span className="px-3.5 py-2.5 text-sm text-gray-400 border-r border-gray-200 shrink-0">
                /shop/
              </span>
              <span className="px-3.5 py-2.5 text-sm font-mono text-gray-400">
                {vendor.slug}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={vendor.description ?? ""}
              placeholder="Tell customers about your shop…"
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={vendor.phone ?? ""}
              placeholder="+995 555 000 000"
              className={inputClass}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>

      <VacationModeCard
        initialEnabled={vendor.vacationMode}
        initialMessage={vendor.vacationMessage}
        initialEnd={toLocalDatetime(vendor.vacationEnd)}
      />

      <OrderLimitsCard
        initialMinAmount={vendor.minOrderAmount ? Number(vendor.minOrderAmount) : null}
        initialMaxAmount={vendor.maxOrderAmount ? Number(vendor.maxOrderAmount) : null}
        initialMinQty={vendor.minOrderQty}
        initialMaxQty={vendor.maxOrderQty}
      />
    </div>
  )
}
