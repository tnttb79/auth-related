// Chat endpoint for the embedded widget.
// Requests are authorized by the session cookie created during the token exchange flow.

import { NextRequest } from "next/server"
import { getSession } from "@/lib/session"

export async function POST(req: NextRequest) {
  // Session lookup also enforces expiry and loads the chatbot tied to this conversation.
  const session = await getSession()
  if (!session) {
    return Response.json({ error: "Unauthorized — no valid session" }, { status: 401 })
  }

  const body = await req.json()
  const { message } = body

  if (!message || typeof message !== "string") {
    return Response.json({ error: "message is required" }, { status: 400 })
  }

  // Placeholder response until a model is connected to customer-specific site context.
  return Response.json({
    message: `Hello from ${session.chatbot.name}! You said: "${message}". LLM integration coming soon.`,
  })
}
