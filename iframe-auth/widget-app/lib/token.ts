// Signing and verification helpers for short-lived embed tokens.
// These JWTs bootstrap the iframe session and are not meant to be stored long-term.

import { SignJWT, jwtVerify } from "jose"

const EMBED_TOKEN_TTL_SECONDS = 60

function getSecret(): Uint8Array {
  const secret = process.env.EMBED_SECRET
  if (!secret) throw new Error("EMBED_SECRET env var is not set")
  return new TextEncoder().encode(secret)
}

export type EmbedTokenPayload = {
  userId: string
  chatbotId: string
  customerId: string
}

// Signs the bootstrap token that binds a user to a chatbot and customer.
export async function signEmbedToken(payload: EmbedTokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${EMBED_TOKEN_TTL_SECONDS}s`)
    .sign(getSecret())
}

// Verifies signature and expiry before the token is exchanged for a session cookie.
export async function verifyEmbedToken(token: string): Promise<EmbedTokenPayload> {
  const { payload } = await jwtVerify(token, getSecret())
  return payload as unknown as EmbedTokenPayload
}
