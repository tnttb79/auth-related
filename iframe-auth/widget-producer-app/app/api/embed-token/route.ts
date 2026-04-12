// Issues a short-lived embed token after authenticating the caller by API key.
// Backend-to-backend: the browser never sees this endpoint directly.

import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { hashApiKey } from "@/lib/apiKey"
import { signEmbedToken } from "@/lib/token"

export async function POST(req: NextRequest) {
  const rawKey = req.headers.get("x-api-key")
  if (!rawKey) {
    return Response.json({ error: "Missing x-api-key header" }, { status: 401 })
  }

  // Lookup by hash — the DB never holds the raw key.
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: hashApiKey(rawKey) },
    include: { website: { include: { chatbot: true } } },
  })
  if (!apiKey || apiKey.revokedAt) {
    return Response.json({ error: "Invalid API key" }, { status: 401 })
  }

  const chatbot = apiKey.website.chatbot
  if (!chatbot) {
    return Response.json(
      { error: "Website has no chatbot provisioned" },
      { status: 409 },
    )
  }

  // Fire-and-forget lastUsedAt bump. No need to block the response.
  prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {})

  const token = await signEmbedToken({
    chatbotId: chatbot.id,
    websiteId: apiKey.websiteId,
  })
  return Response.json({ token, chatbotId: chatbot.id })
}
