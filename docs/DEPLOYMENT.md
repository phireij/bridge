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
| `RESEND_API_KEY` | **secret, server-only** | Transactional email sends (received / confirmed / cancelled) |
| `RESEND_FROM_EMAIL` | server-only | Verified `From:` (bare email or "Display <email>") |
| `RESEND_REPLY_TO` | server-only (optional) | Reply-to override; defaults to the `From:` |

No secret is prefixed `NEXT_PUBLIC_`. `store.ts`, `supabase/admin.ts`, and the
`lib/email/*` modules import `server-only`, so a client import is a build error.

## Transactional email (Resend)

- Fire-and-log: email sends happen AFTER a successful booking / admin status
  change and are wrapped in try/catch. **A failed or missing send never rolls
  back a reservation.** All attempts are recorded to the `email_events` table
  (kind ∈ received/confirmed/cancelled; status ∈ sent/failed/skipped_blank/no_provider).
- Idempotent per `(reservation_id, kind)`: a unique index on `status='sent'`
  makes a duplicate send a no-op.
- Never sends when the customer's email is blank.
- **Escape hatch:** on a deployed environment without `RESEND_API_KEY` +
  `RESEND_FROM_EMAIL`, the `/reserve` page hides the email input entirely and
  server actions strip any email — per CTO policy, don't collect what we can't use.

Resend setup: verify the sending domain in Resend (SPF, DKIM, MX for bounces);
create an API key with **Sending access** only; add both env vars in Vercel for
**Preview and Production**.

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
