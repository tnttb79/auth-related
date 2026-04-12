// Dashboard owner session: a DB-backed, HttpOnly cookie.
// Mirrors the shape of lib/session.ts but is for the dashboard login flow,
// not the widget chat session.

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const OWNER_SESSION_TTL_DAYS = 7;
const OWNER_COOKIE_NAME = "owner_session";

export async function createOwnerSession(ownerId: string): Promise<string> {
  const expiresAt = new Date(
    Date.now() + OWNER_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  );
  const session = await prisma.ownerSession.create({
    data: { ownerId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(OWNER_COOKIE_NAME, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: OWNER_SESSION_TTL_DAYS * 24 * 60 * 60,
  });

  return session.id;
}

export async function getOwner() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(OWNER_COOKIE_NAME)?.value;
  if (!sessionId) return null;

  const session = await prisma.ownerSession.findUnique({
    where: { id: sessionId },
    include: { owner: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) return null;

  return session.owner;
}

export async function destroyOwnerSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(OWNER_COOKIE_NAME)?.value;
  if (sessionId) {
    await prisma.ownerSession
      .delete({ where: { id: sessionId } })
      .catch(() => {});
  }
  cookieStore.delete(OWNER_COOKIE_NAME);
}

export { OWNER_COOKIE_NAME };
