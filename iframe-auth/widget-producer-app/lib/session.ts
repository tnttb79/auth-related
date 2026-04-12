// Widget session persistence.
// A WidgetSession is an anonymous, transient chat thread tied to a chatbot.
// It is referenced from the browser by an HttpOnly cookie set without Max-Age,
// so the browser drops it on tab close but keeps it across refreshes.

import { cookies } from "next/headers"
import { prisma } from "@/lib/db"

const COOKIE_NAME = "widget_session"
const ONLINE_WINDOW_MS = 30 * 1000

export async function createWidgetSession(chatbotId: string): Promise<string> {
  const session = await prisma.widgetSession.create({ data: { chatbotId } })
  return session.id
}

// Loads the current widget session from the cookie and bumps lastSeenAt so the
// dashboard can tell the visitor is still on the page. Returns null if the
// cookie is missing or points to a deleted row.
export async function getWidgetSession() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(COOKIE_NAME)?.value
  if (!sessionId) return null

  const session = await prisma.widgetSession.findUnique({
    where: { id: sessionId },
    include: { chatbot: true },
  })
  if (!session) return null

  await prisma.widgetSession.update({
    where: { id: sessionId },
    data: { lastSeenAt: new Date() },
  })

  return session
}

export function isSessionOnline(lastSeenAt: Date): boolean {
  return Date.now() - lastSeenAt.getTime() < ONLINE_WINDOW_MS
}

export { COOKIE_NAME, ONLINE_WINDOW_MS }
