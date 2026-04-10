import { getAdminBanners } from "@/lib/actions/banners"
import BannerManager from "./BannerManager"

export default async function AdminBannersPage() {
  const banners = await getAdminBanners()

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Banner Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage homepage hero and side banners</p>
      </div>
      <BannerManager initialBanners={banners} />
    </div>
  )
}
