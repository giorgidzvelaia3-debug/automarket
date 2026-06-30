import { NextRequest, NextResponse } from "next/server"
import { runSync, runAllEnabledSources } from "@/lib/scraping/runSync"

export const dynamic = "force-dynamic"
export const maxDuration = 300

// Triggered by Vercel Cron (sends `Authorization: Bearer $CRON_SECRET`) or by an
// external scheduler (sends `x-cron-secret`). Accepts either.
function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  if (request.headers.get("x-cron-secret") === secret) return true
  if (request.headers.get("authorization") === `Bearer ${secret}`) return true
  return false
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Optional ?source=amboli to sync just one source; default = all enabled.
  const source = request.nextUrl.searchParams.get("source")
  if (source) {
    const result = await runSync(source)
    return NextResponse.json({ success: result.status !== "FAILED", results: { [source]: result } })
  }

  const results = await runAllEnabledSources()
  return NextResponse.json({ success: true, results })
}
