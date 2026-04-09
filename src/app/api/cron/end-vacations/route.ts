import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const result = await prisma.vendor.updateMany({
    where: {
      vacationMode: true,
      vacationEnd: { not: null, lt: now },
    },
    data: {
      vacationMode: false,
      vacationMessage: null,
      vacationEnd: null,
    },
  })

  return NextResponse.json({ success: true, count: result.count })
}
