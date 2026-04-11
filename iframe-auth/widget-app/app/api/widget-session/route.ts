// Exchanges a short-lived embed token for a server-side session.
// The request comes from the iframe after the parent page passes auth data over postMessage.

import { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/db"
import { verifyEmbedToken } from "@/lib/token"
import { createSession, COOKIE_NAME } from "@/lib/session"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { embedToken } = body

  if (!embedToken) {
    return Response.json({ error: "embedToken is required" }, { status: 400 })
  }

  let payload
  try {
    payload = await verifyEmbedToken(embedToken)
  } catch {
    return Response.json({ error: "Invalid or expired embed token" }, { status: 401 })
  }

  // Re-check ownership against the database so a stale token cannot authorize a moved bot.
  const chatbot = await prisma.chatbot.findUnique({ where: { id: payload.chatbotId } })
  if (!chatbot) {
    return Response.json({ error: "Chatbot not found" }, { status: 404 })
  }
  if (chatbot.customerId !== payload.customerId) {
    return Response.json({ error: "Chatbot does not belong to this customer" }, { status: 403 })
  }

  const sessionId = await createSession({
    userId: payload.userId,
    chatbotId: payload.chatbotId,
  })

  const cookieStore = await cookies()
  const isProd = process.env.NODE_ENV === "production"
  cookieStore.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    // Cross-site iframe cookies need SameSite=None + Secure in production.
    // Local HTTP development cannot use that combination, so fall back to Lax.
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 24 * 60 * 60, // 24 hours
  })

  return Response.json({ ok: true })
}
