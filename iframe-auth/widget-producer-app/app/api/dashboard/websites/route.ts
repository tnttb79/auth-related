// List and create the current owner's websites. Creating a website also
// provisions a single default Chatbot in the same transaction — one chatbot
// per website is the POC shape.

import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { withOwner } from "@/lib/authGuard"

const NAME_MAX = 80
const DOMAIN_PATTERN = /^[a-z0-9.-]{1,253}$/i

export async function GET() {
  return withOwner(async (owner) => {
    const websites = await prisma.website.findMany({
      where: { ownerId: owner.id },
      orderBy: { createdAt: "desc" },
      include: {
        chatbot: true,
        _count: { select: { apiKeys: true } },
      },
    })
    return Response.json({ websites })
  })
}

export async function POST(req: NextRequest) {
  return withOwner(async (owner) => {
    const body = await req.json().catch(() => null)
    const name = typeof body?.name === "string" ? body.name.trim() : ""
    const domain = typeof body?.domain === "string" ? body.domain.trim().toLowerCase() : ""

    if (!name || name.length > NAME_MAX) {
      return Response.json(
        { error: `Name is required (max ${NAME_MAX} characters)` },
        { status: 400 },
      )
    }
    if (!DOMAIN_PATTERN.test(domain)) {
      return Response.json({ error: "Domain looks invalid" }, { status: 400 })
    }

    // Transaction so a website is never created without its chatbot.
    const website = await prisma.$transaction(async (tx) => {
      const w = await tx.website.create({
        data: { ownerId: owner.id, name, domain },
      })
      await tx.chatbot.create({
        data: { websiteId: w.id, name: `${name} bot` },
      })
      return w
    })

    return Response.json({ id: website.id })
  })
}
