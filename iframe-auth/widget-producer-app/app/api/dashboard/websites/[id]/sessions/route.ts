// List widget sessions for a website, newest heartbeat first.
// Performs lazy cleanup of sessions older than STALE_CLEANUP_MS so the POC DB
// doesn't grow unbounded. Each row carries an isOnline flag based on lastSeenAt.

import { prisma } from "@/lib/db"
import { withOwner } from "@/lib/authGuard"
import { ONLINE_WINDOW_MS } from "@/lib/session"

const STALE_CLEANUP_MS = 60 * 60 * 1000 // 1 hour

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  return withOwner(async (owner) => {
    const { id } = await ctx.params

    const website = await prisma.website.findUnique({
      where: { id },
      include: { chatbot: true },
    })
    if (!website || website.ownerId !== owner.id) {
      return Response.json({ error: "Website not found" }, { status: 404 })
    }
    if (!website.chatbot) {
      return Response.json({ sessions: [] })
    }

    // Lazy cleanup — cheap and keeps the list focused on recent activity.
    await prisma.widgetSession.deleteMany({
      where: {
        chatbotId: website.chatbot.id,
        lastSeenAt: { lt: new Date(Date.now() - STALE_CLEANUP_MS) },
      },
    })

    const rows = await prisma.widgetSession.findMany({
      where: { chatbotId: website.chatbot.id },
      orderBy: { lastSeenAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { body: true, role: true, createdAt: true },
        },
        _count: { select: { messages: true } },
      },
    })

    const now = Date.now()
    const sessions = rows.map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      lastSeenAt: s.lastSeenAt,
      isOnline: now - s.lastSeenAt.getTime() < ONLINE_WINDOW_MS,
      messageCount: s._count.messages,
      lastMessage: s.messages[0] ?? null,
    }))

    return Response.json({ sessions })
  })
}
