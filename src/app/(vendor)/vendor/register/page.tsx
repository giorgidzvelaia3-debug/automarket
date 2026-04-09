import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import RegisterForm from "./RegisterForm"

export default async function VendorRegisterPage(props: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await props.searchParams

  const session = await auth()

  // Already registered → go straight to dashboard
  const existing = session?.user?.id
    ? await prisma.vendor.findUnique({ where: { userId: session.user.id } })
    : null

  if (existing) redirect("/vendor/dashboard")

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Register Your Shop</h1>
        <p className="mt-1 text-sm text-gray-500">
          Fill in your shop details. Your application will be reviewed by an
          admin before going live.
        </p>
      </div>

      <RegisterForm error={error} />
    </div>
  )
}
