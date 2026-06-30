import { prisma } from "@/lib/prisma"
import { confirmProposal, rejectProposal } from "@/lib/actions/aggregator"

export default async function MatchesPage() {
  const proposals = await prisma.matchProposal.findMany({
    where: { status: "PENDING" },
    orderBy: { confidence: "desc" },
    include: {
      offer: { include: { source: { select: { name: true } } } },
      aggregatedProduct: { select: { name: true, slug: true } },
    },
  })

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Match Review Queue</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {proposals.length} pending proposal{proposals.length === 1 ? "" : "s"}. Confirm to group an
          offer under a canonical product (enables price comparison), or reject to leave it separate.
        </p>
      </div>

      <div className="space-y-3">
        {proposals.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                    p.confidence >= 90
                      ? "bg-green-50 text-green-700"
                      : p.confidence >= 70
                      ? "bg-amber-50 text-amber-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {p.confidence}% match
                </span>
                <span className="text-xs text-gray-400">{p.offer.source.name}</span>
                <code className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                  {p.matchKey}
                </code>
              </div>

              <p className="font-medium text-gray-900 truncate">{p.offer.rawName}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {p.offer.brand ?? "?"} · {p.offer.viscosity ?? "?"} · {p.offer.volume ?? "?"} ·{" "}
                <span className="text-gray-700">{p.offer.price.toString()} ₾</span>
              </p>

              <p className="text-xs text-gray-500 mt-2">
                {p.aggregatedProductId ? (
                  <>
                    → merge into existing:{" "}
                    <span className="font-medium text-gray-700">{p.aggregatedProduct?.name}</span>
                  </>
                ) : (
                  <>
                    → create new canonical:{" "}
                    <span className="font-medium text-gray-700">{p.proposedName}</span>
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <form action={confirmProposal}>
                <input type="hidden" name="proposalId" value={p.id} />
                <button
                  type="submit"
                  className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
                >
                  Confirm
                </button>
              </form>
              <form action={rejectProposal}>
                <input type="hidden" name="proposalId" value={p.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Reject
                </button>
              </form>
            </div>
          </div>
        ))}

        {proposals.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-12 text-center text-sm text-gray-400">
            No pending proposals. Run a sync to discover matches.
          </div>
        )}
      </div>
    </div>
  )
}
