// Toy dashboard login: upsert Owner by name, set a cookie session.
// This is intentionally not a real auth system — see README future improvements.

import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { createOwnerSession } from "@/lib/ownerSession"

const NAME_PATTERN = /^[\p{L}\p{N} _.-]{1,40}$/u

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const name = typeof body?.name === "string" ? body.name.trim() : ""

  if (!NAME_PATTERN.test(name)) {
    return Response.json(
      { error: "Name must be 1–40 characters (letters, numbers, space, . _ -)" },
      { status: 400 },
    )
  }

  const owner = await prisma.owner.upsert({
    where: { name },
    update: {},
    create: { name },
  })

  await createOwnerSession(owner.id)

  return Response.json({ id: owner.id, name: owner.name })
}
