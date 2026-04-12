import { destroyOwnerSession } from "@/lib/ownerSession"

export async function POST() {
  await destroyOwnerSession()
  return Response.json({ ok: true })
}
