import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import ProfileForm from "./ProfileForm"

export default async function BuyerProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="mt-0.5 text-sm text-gray-500">Manage your account</p>
      </div>

      <ProfileForm
        name={session.user.name ?? ""}
        email={session.user.email ?? ""}
      />
    </div>
  )
}
