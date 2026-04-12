# 2026-04-11 - Fix: `POST /api/dashboard/login` fails with Prisma `P2021` (`Owner` table missing)

## Symptom

- Dashboard login endpoint returned HTTP 500.
- Prisma error:
  - `The table main.Owner does not exist in the current database`
  - source call: `prisma.owner.upsert(...)` in `app/api/dashboard/login/route.ts`

## Root cause

There was a SQLite path mismatch between Prisma runtime and migration/config resolution:

- Runtime and CLI/config were not consistently targeting the same database file.
- A nested DB file (`prisma/prisma/dev.db`) existed and had the expected tables, while the app path could point elsewhere depending on config/env.
- This caused migrations to exist, but the DB actually used at request time did not contain `Owner`.

## Fix applied

Aligned schema, Prisma config, runtime resolution, and env fallback to the same relative URL convention (`file:./dev.db`), and made runtime resolution explicitly map relative SQLite paths to the schema directory.

### Files changed

- `widget-producer-app/prisma/schema.prisma`
  - `url = "file:./prisma/dev.db"` -> `url = "file:./dev.db"`
- `widget-producer-app/prisma.config.ts`
  - `url: env("DATABASE_URL") ?? "file:./prisma/dev.db"` -> `... "file:./dev.db"`
- `widget-producer-app/lib/db.ts`
  - fallback URL -> `file:./dev.db`
  - relative path resolution changed from:
    - `path.join(process.cwd(), relative)`
    - to `path.join(process.cwd(), "prisma", relative)`
  - this ensures runtime resolves relative SQLite paths against `./prisma`, matching schema location expectations.
- `widget-producer-app/.env`
  - `DATABASE_URL="file:./prisma/dev.db"` -> `DATABASE_URL="file:./dev.db"`

## Database recovery steps used

After aligning paths, Prisma detected drift in the corrected DB (older `Customer`/`Session` tables), so a reset was required in dev:

```bash
npx prisma migrate reset --force --skip-generate
```

Migration applied:

- `20260412004617_dashboard`

## Verification

- Confirmed `Owner` table exists in `widget-producer-app/prisma/dev.db`.
- The original `P2021` root cause was resolved at DB layer.

## Important notes for future debugging

- If Prisma says migration is in sync but runtime still reports missing tables, verify which physical SQLite file each layer is using.
- Check all four places together:
  - `prisma/schema.prisma`
  - `prisma.config.ts`
  - runtime Prisma client URL logic (`lib/db.ts`)
  - `.env` / `.env.local` values
- If stale nested DB files exist (`prisma/prisma/dev.db`), they can hide path mistakes.
- `migrate reset` is safe only for local dev DBs and destroys local data.
