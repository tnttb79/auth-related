# iframe-auth

A small technical demo of how an embeddable chat widget can authenticate inside a cross-origin iframe without exposing long-lived credentials to the browser — plus a tiny owner dashboard to drive it.

## Repository layout

| Folder | Role |
| --- | --- |
| **`widget-producer-app/`** | Hosts the iframe UI at `/widget`, the owner dashboard at `/dashboard`, the producer APIs (`/api/embed-token`, `/api/widget-session`, `/api/chat`, `/api/chat/messages`, `/api/dashboard/*`), and the SQLite database. |
| **`widget-consumer-app/`** | A third-party site that embeds the producer's iframe. Keeps the producer API key on its server and proxies `GET /api/get-embed-token` to the producer. |

Two folders ⇒ two origins in local dev (`localhost:3000` for the producer, `localhost:3001` for the consumer).

## Architecture overview

![Architecture overview — widget consumer vs widget producer](./architecture-overview.png)

## What this demo is proving

Rendering an iframe is the easy part. The hard part is getting auth into that iframe without:

- putting secrets in the URL
- giving the browser a reusable producer API key
- trusting stale authorization state
- relying on frontend-only checks

The flow uses a two-step credential model:

1. The widget consumer backend authenticates to the widget producer with an API key.
2. The producer returns a short-lived embed token (60s JWT).
3. The browser passes that token into the iframe with `postMessage` — never through the URL.
4. The iframe exchanges the token for a producer-managed session cookie.
5. Later chat requests use the cookie, not the token.

The API key stays on the consumer server. The short-lived token stays out of URLs and history.

## The dashboard

`widget-producer-app` also hosts a little dashboard at `/dashboard` where a site owner can:

- "log in" by typing a name (toy — see the banner on every page)
- register websites (each one auto-provisions a chatbot)
- create and revoke API keys (raw key shown once, sha256 hash stored at rest)
- watch incoming chat sessions in real time
- reply to online sessions — stale ones are read-only

Sessions are intentionally anonymous and ephemeral. There is no visitor identity: the widget session cookie is a browser session cookie (no `Max-Age`), so it dies when the tab closes but survives refresh. While the widget is open, it polls the producer every 2 seconds; those polls double as heartbeats. The dashboard marks a session **online** when it has been seen in the last 30 seconds, and **stale** otherwise. Stale sessions older than an hour are cleaned up lazily the next time the dashboard lists them.

## End-to-end flow

1. Browser on the consumer page calls `widget-consumer-app/api/get-embed-token`.
2. That route makes a backend-to-backend call to `widget-producer-app/api/embed-token` with `x-api-key`.
3. Producer hashes the incoming key, looks it up, verifies it's not revoked, resolves the website and chatbot, and signs a 60-second JWT.
4. The consumer page renders the iframe.
5. The iframe loads `widget-producer-app/widget` and sends `READY` to the parent.
6. The parent replies with `AUTH` containing the embed token in a `postMessage`.
7. The iframe posts the token to `widget-producer-app/api/widget-session`.
8. The producer verifies the JWT, re-checks that the chatbot still belongs to the website, creates a `WidgetSession` row, and sets an HttpOnly session cookie.
9. `widget-producer-app/api/chat` authenticates later requests by reading that cookie and bumping `lastSeenAt`.
10. The dashboard, polling `/api/dashboard/websites/:id/sessions`, sees the new session appear with an **online** pill.

## Why the flow is split this way

### Why not put the token in the iframe URL?

`src="/widget?token=..."` leaks the token through browser history, access logs, address-bar copy/paste, and referrer handling. `postMessage` keeps it in memory with an explicit `targetOrigin`.

### Why exchange the JWT for a cookie-backed session?

The embed token is just a bootstrap credential proving the consumer backend recently authorized this load. After that, a normal server-side session is easier to expire, revoke, inspect, and evolve than repeatedly trusting a browser-held JWT.

### Why re-check chatbot ownership after verifying the JWT?

Signature verification only proves the token was valid at sign time. It doesn't prove the underlying database relationship is still valid *now*. Re-checking prevents a token from surviving a later reassignment or deletion.

### Why hash API keys?

Storing raw keys in the DB means a leaked database dump hands every consumer full access. Storing `sha256(key)` and only the first few characters (prefix) means a dump reveals nothing usable, just row metadata. The raw value is only shown once, in a modal, right after creation.

## Security choices shown here

| Decision | Reason |
| --- | --- |
| API key usage is server-to-server only | Browser never receives producer credentials |
| API keys hashed at rest (sha256) | DB dump doesn't reveal usable secrets |
| Raw key shown once | Forces safe storage in a secret manager |
| Embed token expires in 60 seconds | Limits replay value if intercepted |
| `postMessage` checks `origin` and uses `targetOrigin` | Prevents broad message delivery |
| Widget session cookie is `HttpOnly` | JS can't read or exfiltrate it |
| Widget session cookie has no `Max-Age` | Dies on tab close; matches ephemeral chat model |
| `SameSite=None; Secure` in production | Required for cross-site iframe cookies |
| Local HTTP dev falls back to `SameSite=Lax` | Browsers reject `SameSite=None` without `Secure` |
| Dashboard re-verifies ownership on every resource | Never trust URL params alone |

## Environment variables (local)

**Widget producer** (`widget-producer-app/.env.local`):

- `EMBED_SECRET` — symmetric key for signing embed JWTs
- `NEXT_PUBLIC_CONSUMER_APP_ORIGIN` — origin of the consumer app, used by the widget for `postMessage` checks

**Widget consumer** (`widget-consumer-app/.env.local`):

- `YOURCHAT_API_KEY` — generated from the producer dashboard (see below). The consumer backend sends it to the producer.
- `NEXT_PUBLIC_WIDGET_ORIGIN` — where the producer is running

> `CHATBOT_ID` is no longer needed on the consumer — the producer derives the chatbot from the API key itself.

## Local development

First-time setup after clone:

```bash
cd widget-producer-app
npx prisma migrate dev
npm run dev
```

```bash
# another terminal
cd widget-consumer-app
npm run dev
```

Then:

1. Open `http://localhost:3000/dashboard/login` and pick a name.
2. Add a website (any name + domain, e.g. `acme` / `acme.test`).
3. Create an API key, copy the value from the modal, and paste it into `widget-consumer-app/.env.local` as `YOURCHAT_API_KEY`. Restart the consumer.
4. Open `http://localhost:3001`. The widget should load; your session will appear in the dashboard with an **online** pill.
5. Send a message from the widget, reply from the dashboard — you should see the reply in the widget within ~2s.
6. Close the widget tab, wait 30+ seconds, refresh the dashboard: the session flips to **stale**, and the reply composer is disabled.

## Cookie behavior on localhost

Production iframe cookies normally need `SameSite=None` and `Secure`, which means HTTPS. That combination doesn't work on `http://localhost`, so the demo relaxes the cookie policy in development. If you want to test closer to production, run both apps over local HTTPS with [`mkcert`](https://github.com/FiloSottile/mkcert).

## Data model

The producer uses Prisma with SQLite. The database file lives at `widget-producer-app/prisma/dev.db` and is gitignored; migrations under `prisma/migrations/` are committed.

- `Owner` — dashboard account (name-only toy auth)
- `OwnerSession` — DB-backed cookie session for the dashboard login
- `Website` — owned by an `Owner`; has one `Chatbot` and any number of `ApiKey`s
- `Chatbot` — one per `Website` (POC)
- `ApiKey` — sha256-hashed; raw value shown only at creation
- `WidgetSession` — anonymous chat thread; `lastSeenAt` drives online/stale status
- `Message` — `role` is `"visitor"` or `"owner"`

## App-level implementation details

### Producer app (`widget-producer-app`)

This app owns the iframe UI, dashboard UI, auth/session lifecycle, and all persisted state.

**Public widget APIs**

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/embed-token` | POST | Backend-to-backend. Hashes `x-api-key`, validates the key, and signs a 60-second JWT bound to that website's chatbot. |
| `/api/widget-session` | POST | Verifies the embed JWT, re-checks chatbot ownership, creates a `WidgetSession`, and sets the HttpOnly widget cookie. |
| `/api/chat` | POST | Requires widget session cookie, stores visitor message, and updates `lastSeenAt`. |
| `/api/chat/messages?since=<iso>` | GET | Polled by the widget every ~2s to fetch new messages and act as a heartbeat. |

**Dashboard APIs** (all under `/api/dashboard/*`, all require owner session)

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/dashboard/login` | POST | Upsert owner by name and create dashboard session cookie. |
| `/api/dashboard/logout` | POST | Destroy dashboard session. |
| `/api/dashboard/me` | GET | Return current owner identity for auth checks. |
| `/api/dashboard/websites` | GET / POST | List websites or create one (+ default chatbot). |
| `/api/dashboard/websites/[id]` | GET / DELETE | Read or delete one owned website. |
| `/api/dashboard/websites/[id]/keys` | GET / POST | List keys (metadata) or mint a new key (raw shown once). |
| `/api/dashboard/websites/[id]/keys/[keyId]` | DELETE | Revoke key via `revokedAt` (audit row remains). |
| `/api/dashboard/websites/[id]/sessions` | GET | List sessions with online/stale state + lazy stale cleanup. |
| `/api/dashboard/sessions/[sessionId]/messages` | GET / POST | Read full thread and post owner reply (only while online). |

### Consumer app (`widget-consumer-app`)

This app simulates a third-party customer website. It has no DB and no long-lived visitor auth state.

1. Loads an iframe pointing to producer `/widget`.
2. Calls its own backend (`/api/get-embed-token`) to exchange server-side API key for short-lived embed token.
3. Waits for iframe `READY`, then sends `AUTH` with token via `postMessage`.
4. Hands off to the producer; widget chat lifecycle is producer-managed.

## What this demo is not (yet)

Deliberate shortcuts the code takes — all listed so they can be replaced next:

- **Polling instead of streaming.** The widget polls `/api/chat/messages` every 2s and the dashboard polls sessions every 3s. Fine for a POC, wasteful in production.
- **No LLM.** `/api/chat` persists the visitor's message and stops. A real build would call a model and pass the website owner's content as context.
- **No rate limiting.** The chat and embed-token endpoints happily accept any volume.
- **Toy login.** Anyone can "sign in" as anyone by typing a name. A real auth system — email/password or OAuth — goes here.

## Possible enhancements (next TODOs)

- Replace polling with WebSocket/SSE for chat messages and dashboard session presence.
- Add proper owner auth (passwordless email, OAuth, or passkeys) and role-based authorization checks.
- Introduce rate limits and abuse controls on embed-token, chat, and message-listing endpoints.
- Add API key management improvements: expiry, scoped permissions, rotation reminders, and optional IP allowlists.
- Add observability: structured logs, request IDs, and security audit events (login, key create/revoke, session exchange failures).
