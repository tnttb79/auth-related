// Exchanges a short-lived embed token for a widget session cookie.
// The cookie is set without Max-Age: the browser treats it as a session cookie
// (dies on tab close, survives refresh), matching the "ephemeral chat" model.

import { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/db"
import { verifyEmbedToken } from "@/lib/token"
import { createWidgetSession, COOKIE_NAME } from "@/lib/session"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const embedToken = body?.embedToken
  if (!embedToken || typeof embedToken !== "string") {
    return Response.json({ error: "embedToken is required" }, { status: 400 })
  }

  let payload
  try {
    payload = await verifyEmbedToken(embedToken)
  } catch {
    return Response.json({ error: "Invalid or expired embed token" }, { status: 401 })
  }

  // Re-verify that the chatbot still belongs to the website referenced in the token.
  // JWT signature only proves the binding was valid at sign time.
  const chatbot = await prisma.chatbot.findUnique({
    where: { id: payload.chatbotId },
  })
  if (!chatbot || chatbot.websiteId !== payload.websiteId) {
    return Response.json({ error: "Chatbot not found for this website" }, { status: 403 })
  }

  const sessionId = await createWidgetSession(chatbot.id)

  const cookieStore = await cookies()
  const isProd = process.env.NODE_ENV === "production"
  cookieStore.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    // Cross-site iframes need SameSite=None + Secure; local HTTP dev falls back to Lax.
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    // No maxAge/expires on purpose: this becomes a browser session cookie that dies
    // when the tab closes but survives refresh.
  })

  return Response.json({ ok: true })
}
