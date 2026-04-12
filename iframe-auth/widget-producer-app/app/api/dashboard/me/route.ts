import { withOwner } from "@/lib/authGuard"

export async function GET() {
  return withOwner(async (owner) =>
    Response.json({ id: owner.id, name: owner.name }),
  )
}
