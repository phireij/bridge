# Mission #002A — Bridge Lite Operational HQ: Handoff Package

Formal handoff for CTO and Hermes review. Portable copy of the Bridge working doc's handoff package (also available as a Hyperagent document for Philip).

## 1. Architecture Summary

Bridge Lite Operational HQ is the auth-gated, database-backed layer added to Bridge v0.1 (a Next.js 16 App Router / TypeScript-strict / Tailwind v4 / shadcn dashboard shell) on branch `feat/bridge-lite-hq` (draft PR #3 into `feat/bridge-v0.1`).

The existing data-access-layer contract from v0.1 was preserved throughout: page components only ever call getters in `src/lib/data/index.ts`; only the getter bodies changed from seed arrays to live Supabase queries. No page outside CEO Inbox, CTO Office, Mission Control, AI Workforce, and Company Memory required any change.

New surfaces:
- `src/lib/supabase/bridge-client.ts` / `bridge-server.ts` — browser and server Supabase clients scoped to the dedicated `bridge-hq` project.
- `src/middleware.ts` — refreshes the Supabase session cookie and redirects unauthenticated visitors to `/login`. All `/api/*` routes are excluded from this cookie-based gate — they authenticate their own callers via `Authorization: Bearer <token>` instead (see section 4).
- `src/lib/auth/session.ts` — `getCurrentProfile()`, the single place pages/actions resolve the signed-in user's role.
- `src/app/(app)/layout.tsx` — gates the entire dashboard shell: no session → redirect (via middleware); session with `role='unassigned'` → a "pending access" screen instead of the dashboard.
- `src/app/login/*` — email/password sign-in (no SMTP/magic-link dependency).
- `src/app/api/reports/route.ts` — the agent-facing Report Intake endpoint.
- `src/app/(app)/reports/new/*` — the human-facing manual fallback for the same workflow.
- `src/app/(app)/missions/page.tsx` — new Mission Control page.
- `src/app/(app)/workforce/page.tsx` and `src/app/(app)/memory/page.tsx` — rewritten/extended to read live data.

Everything here targets the new `bridge-hq` Supabase project exclusively. Nothing in this mission reads or writes `ruby-reservations` or any reservation code path; the Ruby reservation system and its RC1 freeze are untouched throughout.

**Mission #002A-4 additions (Bridge HQ Polish):**
- `src/lib/supabase/bridge-admin.ts` — service-role client (`BRIDGE_SUPABASE_SERVICE_ROLE_KEY`), used exclusively by the credential-rotation action; never used for ordinary reads/writes.
- `src/app/(app)/settings/credentials-*.ts(x)` — CEO-only Agent Credentials panel: rotates HyperAgent's/Hermes' Supabase Auth password via the Admin API, shows the new password exactly once, logs only the rotation event (never the secret).
- `src/components/shared/decision-card.tsx` — the standardized card every CEO Inbox approval now renders through.
- Departments (`departments` table) as first-class entities, with `department_id` on `workforce_status` and `missions`; AI Workforce is now grouped by department, Mission Control shows a Departments summary.

## 2. Database Schema & RLS Summary

Project: `bridge-hq` (id `uwkxcbadxsuqgdrpkwmg`, org `jqyetjxpqgfmfkazzktw`, ap-northeast-1, free tier). Migrations live in `supabase/bridge/migrations/` in the repo (kept physically separate from `supabase/migrations/`, which is ruby-reservations-only).

**Tables** (RLS enabled and closed-by-default on every one):
- `profiles` — one row per Supabase Auth user, `role` enum (`ceo`/`cto`/`hyperagent`/`hermes`/`unassigned`), auto-created by an `on_auth_user_created` trigger with `role='unassigned'`.
- `missions` — code, title, owner, phase, progress, status, next_action, latest_decision.
- `mission_events` — append-only timeline per mission (report/decision/note/blocker entries).
- `reports` — agent, mission_id, summary/evidence/risks/recommendation/requested_decision, related_links, status (submitted/reviewed/actioned), submitted_by.
- `decisions` — the audit trail: report_id, mission_id, actor_id, action (approve/reject/request_revision), notes.
- `workforce_status` — agent_name (unique), role, status, current_task, last_active_at, owner_id (added in the P0/P1 security pass — binds a row to the authenticated account that owns it).
- `company_memory` — category, title, content, mission_id — the Company Memory historical record.

**Key RLS policies (current, post security-corrections):**
- `profiles`: only the row owner can read their own profile (plus CEO/CTO read-all); no self-update policy exists — only `profiles_ceo_manage` (role='ceo') can write `role`. Self-service display-name changes go through the `update_own_display_name(text)` RPC, which cannot touch `role`.
- `reports`: `reports_agent_insert` requires `submitted_by = auth.uid() AND agent::text = current_role()::text` — an agent can only ever submit as itself. `reports_ceo_cto_insert` is separately scoped to ceo/cto, for the manual-fallback-on-behalf-of-an-agent path.
- `decisions`: only `actor_id = auth.uid() AND role='ceo'` may insert directly; in practice all decisions are written through `record_decision()` (see section 4), which enforces the same rule itself before writing anything.
- `workforce_status`: `workforce_own_write` restricts insert/update/delete to `owner_id = auth.uid()` (or CEO/CTO for any row); reads are open to all four internal roles.
- `company_memory`: read by all four internal roles; write by CEO/CTO only.

All cross-table role checks reuse one `SECURITY DEFINER` helper, `current_role()`, which resolves `auth.uid()`'s row in `profiles`.

**Mission #002A-4 additions:**
- `departments` — id, name (unique), description. Read by all four internal roles; write by ceo/cto (`departments_read` / `departments_write`).
- `workforce_status.department_id`, `missions.department_id` — nullable FKs to `departments`.
- `credential_rotations` — audit-only table (agent_name, rotated_by, rotated_at, note). `credential_rotations_ceo_only`: CEO-only, full access. Never stores a secret — the rotated password itself only ever exists in the Admin API response and the CEO's own clipboard.
- Seeded 4 real departments (Executive, Advisory, Engineering & Delivery, Infrastructure & Production Readiness) and backfilled department_id on the existing CEO/CTO/HyperAgent/Hermes workforce rows and the Mission #002A row.

## 3. Authentication & Role Model

Full Supabase Auth (email + password) against `bridge-hq`, entirely separate from Ruby's admin passcode gate and from `ruby-reservations`. Roles: `ceo`, `cto`, `hyperagent`, `hermes`, `unassigned` (default for any new signup, including CEO's own account until manually promoted).

**Bootstrap problem and its resolution:** RLS gives no user a path to grant themselves `ceo` (by design, and reinforced by the P0 fix). The very first CEO promotion for a brand-new `bridge-hq` project has to happen once via direct database access outside the app (this agent ran one `UPDATE profiles SET role='ceo'` via the Supabase management connection after the CEO created his own Auth account). Every subsequent role assignment goes through the CEO's own account in-app (`profiles_ceo_manage`).

**HyperAgent and Hermes accounts:** created directly as confirmed Supabase Auth users (bypassing GoTrue's signup email — internal service accounts, not human signups) with `role` set immediately to `hyperagent` / `hermes`. Credentials are held only in this agent's sandboxed execution environment for this session, never in chat or committed to the repo. **Action needed from the CEO:** decide where these credentials should live long-term (a secrets manager, or Vercel/CI env vars for whatever eventually calls the API on each agent's behalf) and establish a rotation policy — flagged explicitly by Hermes's own test report as an open condition (see section 8).

**Session model:** browser users (CEO/CTO-as-human) get a cookie session via `@supabase/ssr`, refreshed by `src/middleware.ts`. Agent callers get a bearer access token from `POST /auth/v1/token?grant_type=password` and pass it as `Authorization: Bearer <token>` to `/api/reports` — no cookies involved, and middleware explicitly does not gate `/api/*`.

## 4. Report & Decision Workflow

**Report Intake** — two paths, both writing to the same `reports` table:
1. `POST /api/reports` (`src/app/api/reports/route.ts`) — the real agent path. Validates the `Authorization: Bearer` token against Supabase Auth, then inserts using a client scoped to that token (never the service-role key), so `reports_agent_insert`'s RLS check is what actually enforces identity binding — not the route's own logic.
2. `/reports/new` (manual form) — a CEO/CTO-usable fallback per the mission brief's v0.1 allowance ("a secure internal form or API is acceptable"), for logging a report on an agent's behalf before that agent has (or needs) its own credentialed caller.

**Decision workflow** — `approveReport` / `rejectReport` / `requestRevision` (`src/app/(app)/inbox/actions.ts`) all call one Postgres RPC, `record_decision(report_id, action, notes)`:
- Role-checks `auth.uid()` resolves to `role='ceo'` itself (defense in depth alongside the `decisions` RLS policy).
- Row-locks the target report (`SELECT ... FOR UPDATE`).
- Rejects a report whose `status` is already `actioned` — duplicate-submission protection.
- Inserts the `decisions` row, updates `reports.status` (`approve` → `actioned`, anything else → `reviewed`), inserts a `mission_events` row, and updates `missions.latest_decision` — all four writes in the one transaction the RPC runs in.

This replaced an earlier version that did the same four writes as separate client-driven calls with no locking and no duplicate check — flagged by the CTO's security review and fixed in commit `71e155b`.

## 5. Deployment / Environment Configuration

**Branch / PR:** `feat/bridge-lite-hq` → draft PR #3 into `feat/bridge-v0.1`. Still draft; not merged.

**Preview URL:** https://bridge-git-feat-bridge-lite-hq-phireij-4140s-projects.vercel.app/

**Production:** `bridge-gray-one.vercel.app` (branch `feat/bridge-v0.1`) — confirmed unaffected throughout this mission; no reservation files or ruby-reservations config touched by any commit here.

**Env vars (Preview only, per explicit CEO instruction — Production env vars have deliberately not been touched):**

| Variable | Scope | Set? |
|---|---|---|
| `NEXT_PUBLIC_BRIDGE_SUPABASE_URL` | public | Yes, Preview |
| `NEXT_PUBLIC_BRIDGE_SUPABASE_ANON_KEY` | public | Yes, Preview |
| `BRIDGE_SUPABASE_SERVICE_ROLE_KEY` | secret, server-only | Yes, Preview (not currently used by any route — reserved for future admin operations) |

These are entirely distinct from the `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` variables the Ruby reservation system uses against `ruby-reservations` — see `.env.example` and `AGENTS.md` for the explicit project map.

**Fail-safe behavior:** if `NEXT_PUBLIC_BRIDGE_SUPABASE_URL` is unset on any environment, middleware and the `(app)` layout both no-op the auth gate rather than erroring, and every Bridge-HQ getter returns an empty array/null instead of throwing — mirrors the existing Ruby reservation fail-safe philosophy (never silently fall back to fictional/seed data on a real deployment).

## 6. Known Limitations

- ~~HyperAgent/Hermes credentials had no rotation policy~~ — **resolved in Mission #002A-4**: CEO-only rotation via the Settings > Agent Credentials panel, service-role Admin API, one-time-reveal password, audit-only storage (`credential_rotations`). Policy: rotate every 90 days or immediately on suspected compromise.
- No automated test suite (unit/integration) exists for this branch — verification across all four missions (#002A through #002A-4) was done via live Preview click-throughs and direct authenticated REST calls against `bridge-hq`, not a CI-run test suite. `pnpm build`/`typecheck` could not be run locally in this sandbox (no git credentials to clone the private repo); Vercel's own build step is the only automated gate that has run — green as of commit `eb2e291`.
- `workforce_status` has no automatic staleness/offline detection — an agent that stops checking in still shows its last-known status indefinitely.
- No pagination anywhere yet (reports, mission_events, company_memory) — fine at current volume, will need it before real production load.
- The Company Memory Mission #001 entry is reconstructed from real, verifiable GitHub PR history (PR #1 and PR #2), not from an actual "Mission #001A CTO report" document — this agent does not have access to that report's original content or a working link to it in this sandbox.
- Mobile QA (Mission #002A-4) was done via live 390×844 viewport screenshots of Headquarters, CEO Inbox (including submitting and approving a real Decision Card), Mission Control, and AI Workforce — all render cleanly. The "All missions" table on Mission Control extends beyond the 390px viewport width (consistent with the pre-existing Tech Stack table pattern on CTO Office) — acceptable via horizontal scroll within the card, not a regression introduced this pass, but worth a dedicated responsive-table pass in v0.2 if it bothers CTO/Hermes on review.
- Departments are currently 1:1 with the four existing roles — the data model supports many-to-one but that hasn't been exercised yet since there's only one of each agent.

## 9. Release Candidate Status (Mission #002A-4)

**RC label:** Bridge Lite HQ RC1 (branch `feat/bridge-lite-hq`, latest commit `eb2e291`, Vercel build green).

| Checklist item | Status |
|---|---|
| P0/P1 security corrections (CTO review #002A-2) | Done, negative-tested live |
| Full agent workflow (real HyperAgent + Hermes reports → CTO Office → CEO Inbox → decision → audit trail) | Done, verified live with the CEO's real session |
| Mission Control, AI Workforce, Company Memory on live data | Done, verified live |
| Credential rotation strategy | Done — CEO-only, one-time reveal, audit-only storage; verified live (rotated HyperAgent's real password successfully) |
| Departments as first-class entities | Done — 4 real departments seeded, workforce/missions backfilled, verified live |
| Standardized Decision Card | Done — single `DecisionCard` component, all CEO Inbox items render through it |
| Executive-readability UI polish | Modest pass — clearer priority labels on Decision Cards, no workflow changes |
| Mobile QA | Done — see Known Limitations for the one pre-existing table-overflow note |
| Production/reservation isolation | Confirmed throughout |
| Merge status | **Not merged. PR #3 remains in draft per explicit instruction.** Stopping for final CTO and Hermes review before requesting merge approval. |

## 7. Rollback Procedure

1. Preview only — nothing in Production is affected by any rollback here. PR #3 is draft; `feat/bridge-v0.1` and `main` are untouched.
2. To fully back out: close PR #3 without merging, or `git revert` the commits on `feat/bridge-lite-hq` back to the branch-creation point (896b36f and everything after). No merge has happened, so no shared history needs unwinding.
3. Database rollback: the `bridge-hq` Supabase project is entirely dedicated to this mission — nothing else depends on it. To roll back the schema, either drop the project outright (Supabase dashboard) or run `DROP` statements for the 7 tables + 3 functions + triggers, in dependency order (mission_events/reports/decisions/workforce_status/company_memory before missions/profiles). No data outside `bridge-hq` is ever at risk.
4. Vercel env vars for this Preview can be removed independently at any time without affecting Production — they are scoped to Preview only and were never added to Production per the CEO's explicit instruction.
5. There is no irreversible external side effect from anything in this mission (no emails sent, no third-party API calls, no billing beyond the $0/mo `bridge-hq` free-tier project).

## 8. v0.2 Backlog

- Durable secret storage + rotation policy for HyperAgent/Hermes credentials (flagged by Hermes's own report during the Mission #002A-3 workflow test; currently a `request_revision`/`GO WITH CONDITIONS` item awaiting CEO follow-up).
- Automated test suite (at minimum: the 5 negative-test scenarios this agent ran manually via curl should become a real regression suite, not a one-off verification).
- Pagination for reports / mission_events / company_memory.
- Workforce staleness detection (flag an agent as stale/offline after N minutes without a check-in, rather than showing indefinitely-stale "active").
- Locate or reconstruct the actual Mission #001A CTO report content, if it exists somewhere the CEO has access to, and fold it into the Company Memory entry alongside the PR-history-based summary.
- Formal mobile QA pass on the three new/rewritten pages.
- Merge PR #3 into `feat/bridge-v0.1` once CTO/Hermes sign off — still explicitly blocked pending that review, per this mission's instruction.
