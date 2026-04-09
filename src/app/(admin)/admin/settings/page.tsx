import { getSettings, updateSettings } from "@/lib/actions/settings"

export default async function AdminSettingsPage() {
  const settings = await getSettings()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Site Settings</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Global settings for your marketplace
        </p>
      </div>

      <form action={updateSettings} className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div>
            <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 mb-1">
              Site Name
            </label>
            <input
              id="siteName"
              name="siteName"
              type="text"
              defaultValue={settings.siteName ?? "AutoMarket"}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Site Description
            </label>
            <textarea
              id="siteDescription"
              name="siteDescription"
              rows={3}
              defaultValue={settings.siteDescription ?? "Multi-vendor automotive marketplace"}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email
            </label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              defaultValue={settings.contactEmail ?? ""}
              placeholder="support@automarket.ge"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              id="contactPhone"
              name="contactPhone"
              type="tel"
              defaultValue={settings.contactPhone ?? ""}
              placeholder="+995 5XX XXX XXX"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Save Settings
        </button>
      </form>
    </div>
  )
}
