-- Mission #004A — CTO Integration & Review Automation. Applies to bridge-hq only.
--
-- Design notes (per CEO directive: maintainability, simplicity, auditability,
-- scalability, clear ownership; avoid clever complexity; reuse over parallel
-- systems):
-- - The CTO Review Package (compiled mission report, PR/commit refs,
--   architecture/schema notes, tests, deployment status, risks, rollback
--   plan, Hermes certification, open questions, recommended decision) is
--   NOT stored — it is generated on demand from live reports, mission_events,
--   decisions, and cto_briefs (see src/lib/review-package.ts). No new
--   parallel "package" table.
-- - The Pre-Review Gate is NOT a database table — it is a pure, deterministic
--   function (src/lib/review-gate.ts), same pattern as the Recommendation
--   Engine from Mission #003A.
-- - The CTO Decision Import parser is NOT AI/opaque parsing — a deterministic,
--   labeled-field parser (src/lib/decision-import.ts). The only genuinely new
--   store this mission needs is the imported decision itself, because it is
--   externally-sourced content (the CTO is an external agent) that must be
--   captured verbatim plus its parsed fields, distinct in shape and lifecycle
--   from the internal `decisions` (CEO approve/reject) and `cto_briefs`
--   (internally-generated) tables.
-- - The Engineering Inbox and Mission Timeline required by this mission are
--   composed reads over existing reports/mission_events/decisions/cto_briefs
--   — no new tables.
-- - Notification-ready events reuse the existing free-text mission_events.event_type
--   column (Mission #002A schema never constrained it to an enum) — new event
--   type strings: 'report_submitted', 'hermes_review_ready',
--   'cto_review_requested', 'cto_decision_imported', 'revision_requested',
--   'ceo_approval_required'. No migration needed for that part.

create type public.cto_approval_status as enum (
  'pending',
  'approved',
  'approved_with_conditions',
  'rejected'
);

-- Captures a CTO decision pasted in from outside Bridge (the CTO is an
-- external ChatGPT agent with no direct access to this system — see
-- AGENTS.md). Stores the raw pasted text verbatim for audit, plus the
-- deterministically parsed fields, and is only ever written after a human
-- has reviewed and confirmed the parsed fields (enforced in the server
-- action, not just in the UI).
create table public.cto_decision_imports (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  cto_brief_id uuid references public.cto_briefs(id) on delete set null,
  raw_text text not null,
  decision text not null,
  conditions text,
  risks text,
  required_actions text,
  confidence text,
  approval_status public.cto_approval_status not null default 'pending',
  imported_by uuid not null references public.profiles(id),
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.cto_decision_imports enable row level security;

-- Read: all four internal roles, matching every other mission-intelligence
-- table in this schema (missions, reports, cto_briefs, etc.) — HyperAgent and
-- Hermes need visibility into CTO decisions that affect their own work.
create policy cto_decision_imports_read on public.cto_decision_imports for select
  using (public.current_role() in ('ceo', 'cto', 'hyperagent', 'hermes'));

-- Insert: only ceo/cto. The CTO decision-import flow exists specifically
-- because the external CTO cannot write to Bridge directly — a human internal
-- role (in practice, the CEO relaying the CTO's message, or a future
-- internal CTO-role account) is the one confirming and saving it. Scoped to
-- imported_by = auth.uid() so the audit trail always names who imported it.
create policy cto_decision_imports_insert on public.cto_decision_imports for insert
  with check (
    imported_by = auth.uid()
    and public.current_role() in ('ceo', 'cto')
  );
