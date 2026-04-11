// Issues a short-lived embed token after authenticating the customer by API key.
// This route is intended for backend-to-backend use so the browser never handles the API key.

import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { signEmbedToken } from "@/lib/token"

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key")
  if (!apiKey) {
    return Response.json({ error: "Missing x-api-key header" }, { status: 401 })
  }

  const customer = await prisma.customer.findUnique({ where: { apiKey } })
  if (!customer) {
    return Response.json({ error: "Invalid API key" }, { status: 401 })
  }

  const body = await req.json()
  const { userId, chatbotId } = body

  if (!userId || !chatbotId) {
    return Response.json({ error: "userId and chatbotId are required" }, { status: 400 })
  }

  const chatbot = await prisma.chatbot.findUnique({ where: { id: chatbotId } })
  if (!chatbot || chatbot.customerId !== customer.id) {
    return Response.json(
      { error: "Chatbot not found or does not belong to this customer" },
      { status: 403 }
    )
  }

  // The token is only a bootstrap credential; the iframe trades it for a server-side session.
  const token = await signEmbedToken({
    userId,
    chatbotId,
    customerId: customer.id,
  })

  return Response.json({ token })
}
