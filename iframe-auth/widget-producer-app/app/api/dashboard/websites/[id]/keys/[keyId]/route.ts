// Revoke an API key by setting revokedAt. The row is kept for audit purposes
// (lastUsedAt, prefix) even after revocation.

import { prisma } from "@/lib/db"
import { withOwner } from "@/lib/authGuard"

type Ctx = { params: Promise<{ id: string; keyId: string }> }

export async function DELETE(_req: Request, ctx: Ctx) {
  return withOwner(async (owner) => {
    const { id, keyId } = await ctx.params

    const key = await prisma.apiKey.findUnique({
      where: { id: keyId },
      include: { website: true },
    })
    if (!key || key.websiteId !== id || key.website.ownerId !== owner.id) {
      return Response.json({ error: "Key not found" }, { status: 404 })
    }
    if (key.revokedAt) {
      return Response.json({ ok: true })
    }

    await prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    })
    return Response.json({ ok: true })
  })
}
