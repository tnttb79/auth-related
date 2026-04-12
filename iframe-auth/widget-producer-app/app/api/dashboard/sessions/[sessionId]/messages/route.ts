// Dashboard message thread endpoint. GET returns the full thread (read-only
// even when stale). POST inserts an owner reply, but only while the session is
// still online — stale sessions get 409 so a client race can't resurrect a
// closed conversation.

import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { withOwner } from "@/lib/authGuard"
import { ONLINE_WINDOW_MS } from "@/lib/session"

type Ctx = { params: Promise<{ sessionId: string }> }

async function loadOwnedSession(sessionId: string, ownerId: string) {
  const session = await prisma.widgetSession.findUnique({
    where: { id: sessionId },
    include: { chatbot: { include: { website: true } } },
  })
  if (!session) return null
  if (session.chatbot.website.ownerId !== ownerId) return null
  return session
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  return withOwner(async (owner) => {
    const { sessionId } = await ctx.params
    const session = await loadOwnedSession(sessionId, owner.id)
    if (!session) {
      return Response.json({ error: "Session not found" }, { status: 404 })
    }

    const messages = await prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      select: { id: true, role: true, body: true, createdAt: true },
    })
    const isOnline = Date.now() - session.lastSeenAt.getTime() < ONLINE_WINDOW_MS
    return Response.json({
      messages,
      session: {
        id: session.id,
        lastSeenAt: session.lastSeenAt,
        isOnline,
      },
    })
  })
}

export async function POST(req: NextRequest, ctx: Ctx) {
  return withOwner(async (owner) => {
    const { sessionId } = await ctx.params
    const session = await loadOwnedSession(sessionId, owner.id)
    if (!session) {
      return Response.json({ error: "Session not found" }, { status: 404 })
    }

    const isOnline = Date.now() - session.lastSeenAt.getTime() < ONLINE_WINDOW_MS
    if (!isOnline) {
      return Response.json({ error: "session_stale" }, { status: 409 })
    }

    const body = await req.json().catch(() => null)
    const text = typeof body?.body === "string" ? body.body.trim() : ""
    if (!text) {
      return Response.json({ error: "body is required" }, { status: 400 })
    }

    const message = await prisma.message.create({
      data: { sessionId, role: "owner", body: text },
      select: { id: true, role: true, body: true, createdAt: true },
    })
    return Response.json({ message })
  })
}
