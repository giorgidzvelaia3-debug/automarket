import { prisma } from "@/lib/prisma"

function duration(start: Date, end: Date | null): string {
  if (!end) return "—"
  const s = Math.round((end.getTime() - start.getTime()) / 1000)
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
}

export default async function SyncLogPage() {
  const runs = await prisma.syncRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 50,
    include: { source: { select: { name: true } } },
  })

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Sync Log</h1>
        <p className="mt-0.5 text-sm text-gray-500">Last {runs.length} sync runs.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <th className="px-6 py-3">Source</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Started</th>
              <th className="px-6 py-3">Duration</th>
              <th className="px-6 py-3 text-right">Seen</th>
              <th className="px-6 py-3 text-right">New</th>
              <th className="px-6 py-3 text-right">Updated</th>
              <th className="px-6 py-3 text-right">Missing</th>
              <th className="px-6 py-3 text-right">Proposals</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {runs.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3 font-medium text-gray-900">{r.source.name}</td>
                <td className="px-6 py-3">
                  <span
                    className={
                      r.status === "SUCCESS"
                        ? "text-green-600"
                        : r.status === "FAILED"
                        ? "text-red-600"
                        : r.status === "RUNNING"
                        ? "text-blue-600"
                        : "text-amber-600"
                    }
                  >
                    {r.status}
                  </span>
                  {r.error && (
                    <span className="block text-xs text-red-400 truncate max-w-xs" title={r.error}>
                      {r.error}
                    </span>
                  )}
                </td>
                <td className="px-6 py-3 text-gray-500 text-xs">
                  {r.startedAt.toLocaleString()}
                </td>
                <td className="px-6 py-3 text-gray-600">{duration(r.startedAt, r.finishedAt)}</td>
                <td className="px-6 py-3 text-right text-gray-600">{r.offersSeen}</td>
                <td className="px-6 py-3 text-right text-gray-600">{r.offersNew}</td>
                <td className="px-6 py-3 text-right text-gray-600">{r.offersUpdated}</td>
                <td className="px-6 py-3 text-right text-gray-600">{r.offersMissing}</td>
                <td className="px-6 py-3 text-right text-gray-600">{r.proposalsCreated}</td>
              </tr>
            ))}
            {runs.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-sm text-gray-400">
                  No sync runs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
