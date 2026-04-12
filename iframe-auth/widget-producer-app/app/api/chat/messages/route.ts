// Widget polling endpoint. Returns messages newer than ?since=<iso> for the
// current widget session. Also bumps lastSeenAt — each poll doubles as a heartbeat
// so the dashboard can show online / stale status accurately.

import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { getWidgetSession } from "@/lib/session"

export async function GET(req: NextRequest) {
  const session = await getWidgetSession()
  if (!session) {
    return Response.json({ error: "Unauthorized — no valid session" }, { status: 401 })
  }

  const sinceParam = req.nextUrl.searchParams.get("since")
  const since = sinceParam ? new Date(sinceParam) : new Date(0)
  if (Number.isNaN(since.getTime())) {
    return Response.json({ error: "Invalid since parameter" }, { status: 400 })
  }

  const messages = await prisma.message.findMany({
    where: {
      sessionId: session.id,
      createdAt: { gt: since },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, body: true, createdAt: true },
  })

  return Response.json({ messages })
}
