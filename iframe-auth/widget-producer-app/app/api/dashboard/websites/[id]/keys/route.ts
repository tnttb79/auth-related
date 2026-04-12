// List and create API keys for a website.
// The raw key is returned exactly once at creation; afterwards only the prefix
// and metadata are readable from this endpoint.

import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { withOwner } from "@/lib/authGuard"
import { generateApiKey } from "@/lib/apiKey"

type Ctx = { params: Promise<{ id: string }> }

const LABEL_MAX = 40

async function assertOwnsWebsite(websiteId: string, ownerId: string) {
  const website = await prisma.website.findUnique({ where: { id: websiteId } })
  return website && website.ownerId === ownerId ? website : null
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  return withOwner(async (owner) => {
    const { id } = await ctx.params
    const website = await assertOwnsWebsite(id, owner.id)
    if (!website) {
      return Response.json({ error: "Website not found" }, { status: 404 })
    }

    const keys = await prisma.apiKey.findMany({
      where: { websiteId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        label: true,
        prefix: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
      },
    })
    return Response.json({ keys })
  })
}

export async function POST(req: NextRequest, ctx: Ctx) {
  return withOwner(async (owner) => {
    const { id } = await ctx.params
    const website = await assertOwnsWebsite(id, owner.id)
    if (!website) {
      return Response.json({ error: "Website not found" }, { status: 404 })
    }

    const body = await req.json().catch(() => null)
    const label = typeof body?.label === "string" ? body.label.trim() : ""
    if (!label || label.length > LABEL_MAX) {
      return Response.json(
        { error: `Label is required (max ${LABEL_MAX} characters)` },
        { status: 400 },
      )
    }

    const { raw, hash, prefix } = generateApiKey()
    const created = await prisma.apiKey.create({
      data: { websiteId: id, label, keyHash: hash, prefix },
      select: { id: true, label: true, prefix: true, createdAt: true },
    })

    // This is the only time `raw` will ever leave the server.
    return Response.json({ ...created, raw })
  })
}
