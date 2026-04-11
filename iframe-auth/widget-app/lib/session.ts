// Session persistence for the widget producer app.
// Session rows live in SQLite and are referenced by an HttpOnly cookie.

import { cookies } from "next/headers"
import { prisma } from "@/lib/db"

const SESSION_TTL_HOURS = 24
const COOKIE_NAME = "session"

// Persists a new session row and returns its primary key for cookie storage.
export async function createSession({
  userId,
  chatbotId,
}: {
  userId: string
  chatbotId: string
}): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000)
  const session = await prisma.session.create({
    data: { userId, chatbotId, expiresAt },
  })
  return session.id
}

// Resolves the current session from the cookie and rejects missing or expired rows.
export async function getSession() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(COOKIE_NAME)?.value
  if (!sessionId) return null

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { chatbot: true },
  })

  if (!session) return null
  if (session.expiresAt < new Date()) return null

  return session
}

export { COOKIE_NAME }
