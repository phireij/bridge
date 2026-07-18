# Deployment — Ruby Reservations (Operation Anniversary)

## Required environment variables

Set these in Vercel for **both** Production and Preview (env vars are scoped per
environment). The customer booking path needs the two `NEXT_PUBLIC_` values; the
staff admin additionally needs the two server-only secrets.

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Anon key (RLS keeps the table closed) |
| `SUPABASE_SERVICE_ROLE_KEY` | **secret, server-only** | Staff admin reads/writes (bypasses RLS) |
| `ADMIN_PASSCODE` | **secret, server-only** | Staff admin gate |

No secret is prefixed `NEXT_PUBLIC_`. `store.ts` and `supabase/admin.ts` import
`server-only`, so a client import is a build error.

## Fail-safe behavior

The in-memory seed is a **local-dev convenience only**. Any deployed environment
(detected via `VERCEL`) NEVER falls back to memory:

- Customer: if Supabase env is incomplete, `/reserve` shows an "unavailable"
  state and booking is refused — never written to ephemeral storage.
- Admin: with no `ADMIN_PASSCODE` on a deployed env, sign-in is refused (no dev
  default); admin data reads fail safe.
- The admin badge shows **Live · Supabase** only when actually live; it never
  shows "Dev · seeded" on a deployed environment.

## Go live

1. Apply `supabase/migrations/*` to the Supabase project (and `seed.sql` for a
   dev/staging project only).
2. Set the four env vars above (Production + Preview).
3. Redeploy. The DAL switches to Supabase automatically — no code changes.
