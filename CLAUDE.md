# auth-related — Authentication Learning Playground

## Purpose

This repo is a personal learning space for authentication concepts and techniques, but should use production standards to maximize learning.
Each sub-project or folder explores a specific auth trick, pattern, or vulnerability
to build a solid, hands-on understanding of how auth works (and how it breaks).

## Project Philosophy

- **Production-grade standards, simplified stack.** Implementations may use lighter tools (SQLite instead of PostgreSQL, minimal UI instead of a full frontend) but the code itself must follow production best practices: proper error handling, input validation, secure defaults, separation of concerns, and clean architecture.
- **Learning the right way.** The goal is to build habits that transfer directly to real systems. Taking shortcuts on code quality — even in a demo — trains the wrong instincts.
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
3. Keep the scope minimal — just enough to demonstrate the concept — but write the code itself to production standard: no sloppy error handling, no hardcoded secrets, no skipped validation.

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
- Please give only relevant comments and explainations, README.md like a human generate it, not like AI-generated stuffs
- When explaining auth concepts, prefer concrete examples over abstract descriptions.
- Point out real-world implications (what breaks in prod, known CVEs, spec references) where relevant.
- Keep scope small and focused on the concept, but never compromise on code quality. Simpler stack (e.g. SQLite, plain HTML) is fine; sloppy code is not.
- Apply production best practices by default: validate inputs, handle errors explicitly, use secure defaults, avoid hardcoded secrets, structure code cleanly. Call out any deliberate deviation and explain why it's acceptable in the demo context.
