// Widget chat endpoint.
// Persists the visitor message and bumps lastSeenAt (via getWidgetSession).
// The owner dashboard is what actually replies — LLM auto-reply is a future step.

import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { getWidgetSession } from "@/lib/session"

export async function POST(req: NextRequest) {
  const session = await getWidgetSession()
  if (!session) {
    return Response.json({ error: "Unauthorized — no valid session" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const message = body?.message
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return Response.json({ error: "message is required" }, { status: 400 })
  }

  const saved = await prisma.message.create({
    data: {
      sessionId: session.id,
      role: "visitor",
      body: message.trim(),
    },
  })

  return Response.json({ ok: true, messageId: saved.id, createdAt: saved.createdAt })
}
