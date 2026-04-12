// Get / delete a single website. Ownership is verified against the logged-in
// owner — never trust the URL param alone.

import { prisma } from "@/lib/db"
import { withOwner } from "@/lib/authGuard"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  return withOwner(async (owner) => {
    const { id } = await ctx.params
    const website = await prisma.website.findUnique({
      where: { id },
      include: { chatbot: true },
    })
    if (!website || website.ownerId !== owner.id) {
      return Response.json({ error: "Website not found" }, { status: 404 })
    }
    return Response.json({ website })
  })
}

export async function DELETE(_req: Request, ctx: Ctx) {
  return withOwner(async (owner) => {
    const { id } = await ctx.params
    const website = await prisma.website.findUnique({ where: { id } })
    if (!website || website.ownerId !== owner.id) {
      return Response.json({ error: "Website not found" }, { status: 404 })
    }
    await prisma.website.delete({ where: { id } })
    return Response.json({ ok: true })
  })
}
