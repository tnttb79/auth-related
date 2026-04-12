// API key helpers.
// Raw keys are never stored: we keep sha256(key) in the DB and a short prefix
// (first 10 chars) so the dashboard can identify a row without revealing the secret.

import { createHash, randomBytes } from "node:crypto"

const KEY_PREFIX = "wpk_live_"
const RAW_BYTE_LENGTH = 32
const DISPLAY_PREFIX_LENGTH = KEY_PREFIX.length + 8

export type GeneratedApiKey = {
  raw: string
  hash: string
  prefix: string
}

export function generateApiKey(): GeneratedApiKey {
  const random = randomBytes(RAW_BYTE_LENGTH).toString("base64url")
  const raw = `${KEY_PREFIX}${random}`
  return {
    raw,
    hash: hashApiKey(raw),
    prefix: raw.slice(0, DISPLAY_PREFIX_LENGTH),
  }
}

export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex")
}
