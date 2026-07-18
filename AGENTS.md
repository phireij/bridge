<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:bridge-agent-rules -->
# Bridge / Operation Anniversary — agent grounding

Read this first. Keep responses brief and reference this file instead of re-deriving state.

## What this repo is

**Bridge** — a private company HQ dashboard (Next.js 16 + shadcn/ui) with a public **reservation system for Ruby's Cake Delights** grafted on. The reservation stack (`/reserve`, `/admin`, Supabase, Resend) is what runs the business; the HQ dashboard is an internal ops view.

## Current state (2026-07-19)

- **Release 1 live** as tag `v1.0.0-anniversary` on commit `7cb51f1`.
- **Freeze active** (Mission #001H) — only critical hotfixes on Mission #001 until the anniversary event closes (Jul 26). No new features, refactors, or scope creep without explicit CTO approval.
- **Ownership:** Hermes has operational con through the event; HyperAgent is on-call for hotfixes.

## Key URLs & identifiers

| Item | Value |
|---|---|
| Public customer URL | `https://reservations.rubyscakedelights.shop/` |
| Preview / fallback | `https://bridge-gray-one.vercel.app` |
| Repo | `phireij/bridge` (branch: `main`) |
| Release tag | `v1.0.0-anniversary` @ `7cb51f1` |
| Supabase project | `thimxxfjsibwyqijycct` (`ruby-reservations`, Tokyo, PG17) |
| Business phone | `050-1794-2959` |
| Business address (JP) | 千葉県市川市市川1-16-15 花亀ビル1F-B |
| From email | `Ruby's Cake Delights <reservations@rubyscakedelights.shop>` |

## Business rules (authoritative)

**Reservations for the 3rd Anniversary event only** — Jul 25 and Jul 26, 2026 (Asia/Tokyo).

- Operating hours: 10:00–20:00.
- Reservation duration: 60 minutes.
- Slot starts: every 30 minutes (10:00, 10:30, … last start 19:00) → 19 slots per day.
- Capacity: 12 guests concurrent. Max party size: 12.
- Overlap rule: a booking at T occupies both the T and T+30 half-hour ticks.
- Statuses: `pending` (default), `confirmed`, `arrived`, `no_show`, `cancelled`. Active (consume capacity): `pending`, `confirmed`, `arrived`.
- Customer flow: date → party → live slots → name/phone/email(optional)/notes + consent → success + `RCD-…` reference. Bookings start as **pending** (require staff approval).
- Admin flow: server-side passcode gate → list, filter, approve/cancel/mark arrived/mark no-show.
- Emails: fire-and-log via Resend (received / confirmed / cancelled); failure never rolls back a booking; blank email → skip; no provider → escape-hatch hides the email field.

## Guardrails (never violate without explicit CEO approval)

- **No production merge** without explicit CTO approval per commit or mission.
- **No DNS change** by the agent.
- **No secret rotation** by the agent.
- **No destructive DB action** (DROP, TRUNCATE, DELETE affecting real customer rows) without explicit CEO approval.
- **No paid commitment** (subscriptions, upgrades, new provider signups) without CEO approval.
- **No secrets in chat**: `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `ADMIN_PASSCODE` are server-only. Env-var **names** are safe to reference; **values** must never appear in chat, docs, or client-side bundles.
- **Fail-safe over silent fallback**: deployed environments must never fall back to the in-memory seed. Missing config → user sees "unavailable"; never silently accept bookings.

## Freeze rules (Mission #001H)

Only these justify a commit on Mission #001:

- Verified production **bug** that customers are hitting.
- **Security** incident.
- **Reliability** incident (downtime, data-loss risk).
- **Explicit CTO approval** (a Mission #001X directive).

Every commit uses the RC1 log format in its commit message:

```
Reason | Files changed | Risk | Rollback impact | Migration impact | Testing performed
```

## Architecture (30 seconds)

- **Next.js 16 App Router** on Vercel, `main` = Production.
- Reservations live under `src/app/reserve/*` (customer) and `src/app/admin/*` (staff).
- Data-access layer: `src/lib/reservations/*` (Supabase RPCs when env present; local-dev seed otherwise, never used in deployed envs).
- Email pipeline: `src/lib/email/*` (Resend, fire-and-log, idempotent, `server-only`).
- Auth: `src/lib/admin/auth.ts` — shared passcode, SHA-256 in httpOnly cookie, server-only.
- Host-based routing: `src/proxy.ts` — on the reservation domain, `/` serves the reservation page (rewrite, not redirect).
- Database: Supabase Postgres. Migrations in `supabase/migrations/`. RLS enabled + forced with **no anon/authenticated table grants**; customers reach data only via the two `SECURITY DEFINER` functions:
  - `book_reservation(...)` — atomic capacity check with `FOR UPDATE` row lock; overbooking impossible.
  - `get_availability(date)` — aggregate remaining per slot, anon-safe.
- Idempotency: `email_events` has a unique index on `(reservation_id, kind) WHERE status='sent'`.

## Required env vars (Vercel: BOTH Production AND Preview scopes)

| Var | Purpose | Client-safe? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (RLS protects table) | yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin server ops | **secret, server-only** |
| `ADMIN_PASSCODE` | Staff admin gate | **secret, server-only** |
| `RESEND_API_KEY` | Transactional email | **secret, server-only** |
| `RESEND_FROM_EMAIL` | `From:` header value | server-only |

**Vercel env-var trap:** scopes are per-environment. Setting a var only on Production leaves Preview broken (or vice versa). Always add to both.

## Common tasks

Run locally (seeded, no env needed):

```bash
pnpm install && pnpm dev   # http://localhost:3000
```

Gates before any commit:

```bash
pnpm build && pnpm typecheck && pnpm lint
```

## Where to look for more detail

- **Mission #001A CTO report** (portable, public): `https://pub.hyperagent.com/api/published/pbf01KXRWAEH4_JGCWB3HT88X9JRTK/mission-001a-cto-report.md`
- **Release Log** — every commit with reason / files / risk / rollback / migration / testing (project-scoped doc in Hyperagent).
- `docs/DEPLOYMENT.md` — env-var + Resend setup.
- `docs/ARCHITECTURE.md` — deeper architecture.

## Cost hygiene (for AI agents)

Prefer **brief responses**. Skip follow-up chips unless useful. Batch DB queries into single statements. Use `sonnet` for routine work; escalate to `opus` only for architecture. Invoke subagents only when independence adds unique value. Rewrite docs once per phase, not per commit.
<!-- END:bridge-agent-rules -->
