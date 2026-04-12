// Short-lived embed token.
// Binds an iframe load to a specific chatbot (and the API key holder's website).
// Not a long-term credential — the iframe trades it for a session cookie.

import { SignJWT, jwtVerify } from "jose"

const EMBED_TOKEN_TTL_SECONDS = 60

function getSecret(): Uint8Array {
  const secret = process.env.EMBED_SECRET
  if (!secret) throw new Error("EMBED_SECRET env var is not set")
  return new TextEncoder().encode(secret)
}

export type EmbedTokenPayload = {
  chatbotId: string
  websiteId: string
}

export async function signEmbedToken(payload: EmbedTokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${EMBED_TOKEN_TTL_SECONDS}s`)
    .sign(getSecret())
}

export async function verifyEmbedToken(token: string): Promise<EmbedTokenPayload> {
  const { payload } = await jwtVerify(token, getSecret())
  return payload as unknown as EmbedTokenPayload
}
