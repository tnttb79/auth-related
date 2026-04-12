// Guard helper for dashboard API routes.
// Throws a Response (401) if no owner is logged in. Route handlers should catch
// the thrown Response and return it directly — see withOwner() below for the
// idiomatic wrapper.

import { getOwner } from "@/lib/ownerSession"

type Owner = NonNullable<Awaited<ReturnType<typeof getOwner>>>

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized")
  }
}

export async function requireOwner(): Promise<Owner> {
  const owner = await getOwner()
  if (!owner) throw new UnauthorizedError()
  return owner
}

// Wraps a handler so UnauthorizedError becomes a 401 response automatically.
export async function withOwner<T>(
  handler: (owner: Owner) => Promise<T>,
): Promise<T | Response> {
  try {
    const owner = await requireOwner()
    return await handler(owner)
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    throw err
  }
}
