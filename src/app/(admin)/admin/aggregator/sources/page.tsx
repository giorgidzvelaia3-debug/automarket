import { prisma } from "@/lib/prisma"
import { runSyncNow, toggleSource } from "@/lib/actions/aggregator"

function timeAgo(date: Date | null): string {
  if (!date) return "never"
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default async function SourcesPage() {
  const sources = await prisma.source.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { offers: true } },
      syncRuns: { orderBy: { startedAt: "desc" }, take: 1 },
    },
  })

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Aggregator Sources</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          External retailers scraped for price comparison. Run a sync to pull the latest offers.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <th className="px-6 py-3">Source</th>
              <th className="px-6 py-3">Kind</th>
              <th className="px-6 py-3 text-right">Offers</th>
              <th className="px-6 py-3">Last sync</th>
              <th className="px-6 py-3">Last run</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sources.map((s) => {
              const lastRun = s.syncRuns[0]
              return (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="font-medium text-gray-900">{s.name}</div>
                    <code className="text-xs text-gray-500">{s.slug}</code>
                    {!s.enabled && (
                      <span className="ml-2 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                        disabled
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{s.kind}</code>
                  </td>
                  <td className="px-6 py-3 text-right text-gray-600">{s._count.offers}</td>
                  <td className="px-6 py-3 text-gray-600">{timeAgo(s.lastSyncedAt)}</td>
                  <td className="px-6 py-3 text-gray-600">
                    {lastRun ? (
                      <span
                        className={
                          lastRun.status === "SUCCESS"
                            ? "text-green-600"
                            : lastRun.status === "FAILED"
                            ? "text-red-600"
                            : "text-amber-600"
                        }
                      >
                        {lastRun.status}
                        {lastRun.status !== "RUNNING" && (
                          <span className="text-gray-400">
                            {" "}
                            ({lastRun.offersSeen} seen, {lastRun.offersNew} new)
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <form action={toggleSource}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="enabled" value={String(s.enabled)} />
                        <button
                          type="submit"
                          className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
                        >
                          {s.enabled ? "Disable" : "Enable"}
                        </button>
                      </form>
                      <form action={runSyncNow}>
                        <input type="hidden" name="slug" value={s.slug} />
                        <button
                          type="submit"
                          disabled={!s.enabled}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Run sync now
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              )
            })}
            {sources.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                  No sources yet. Seed them with{" "}
                  <code className="bg-gray-100 px-1 rounded">npx tsx prisma/seedSources.ts</code>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        A sync may take a minute (polite delays between page requests). The button posts a server
        action and refreshes when done.
      </p>
    </div>
  )
}
