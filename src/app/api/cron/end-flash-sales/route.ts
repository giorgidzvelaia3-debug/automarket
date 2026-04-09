import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const result = await prisma.flashSale.updateMany({
    where: {
      status: "ACTIVE",
      endTime: { lt: now },
    },
    data: { status: "ENDED" },
  })

  return NextResponse.json({ success: true, ended: result.count })
}
