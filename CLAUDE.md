# auth-related — Authentication Learning Playground

## Purpose

This repo is a personal learning space for authentication concepts and techniques.
Each sub-project or folder explores a specific auth trick, pattern, or vulnerability
to build a solid, hands-on understanding of how auth works (and how it breaks).

## Project Philosophy

- **Learning with production quality.** Code here is written to understand, even it's not to ship. but we need to understand production standard as well.
- **Document the "why".** Every technique should have a comment or README explaining what it demonstrates and why it matters.
- **Security-aware.** Even though this is a learning repo, note when a pattern is dangerous in production and why.
- **Incremental.** Each concept lives in its own folder so ideas stay isolated and easy to revisit.

## Repo Structure Convention

```
auth-related/
├── <concept-name>/       # One folder per auth concept or experiment
│   ├── README.md         # What this demonstrates, key takeaways
│   └── ...               # Implementation files
└── CLAUDE.md
```

## Concepts Tracked So Far

| Folder         | Topic                                                                      | Status      |
| -------------- | -------------------------------------------------------------------------- | ----------- |
| `iframe-auth/` | Auth flows inside iframes (cross-origin considerations, postMessage, etc.) | In progress |

## When Adding a New Concept

1. Create a new folder named after the concept (kebab-case).
2. Add a `README.md` explaining:
   - What the concept is
   - Why it's tricky or interesting
   - Key takeaways / lessons learned
   - References (specs, articles, CVEs if relevant)
3. Keep implementation minimal — just enough to demonstrate the idea.

## Auth Topics of Interest (potential future folders)

- Session management (cookies, sliding expiry, fixation)
- JWT — signing, verification, common pitfalls (alg:none, key confusion)
- OAuth 2.0 / OIDC flows (code, implicit, PKCE)
- CSRF — attack and mitigations
- CORS and credentialed requests
- Iframe auth and postMessage
- Passkeys / WebAuthn
- Token storage (localStorage vs cookie tradeoffs)
- Refresh token rotation
- MFA patterns (TOTP, WebAuthn, backup codes)

## Notes for Claude

- This is a solo learning project — explanations should focus on building intuition.
- When explaining auth concepts, prefer concrete examples over abstract descriptions.
- Point out real-world implications (what breaks in prod, known CVEs, spec references) where relevant.
- Do not over-engineer — keep demos small and focused on the concept being explored.
