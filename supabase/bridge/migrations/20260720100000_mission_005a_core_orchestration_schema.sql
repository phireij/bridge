-- Mission #005A — Bridge Core Orchestration (MVP slice). Applies to bridge-hq only.
--
-- Design notes (per CEO directive: maintainability, simplicity, auditability,
-- scalability, clear ownership; avoid clever complexity; reuse over parallel
-- systems; no new secret-management subsystem):
-- - No API keys are ever stored here. ai_provider_checks stores only the
--   *result* of an on-demand connection check (health/timestamp/model) —
--   never a key, never even a key fragment.
-- - Delegation reuses the existing missions/mission_events/reports/decisions
--   tables from Mission #002A — approving a proposal creates a `missions`
--   row exactly like any other mission, so it shows up in Mission Control
--   for free. No parallel "delegation" table.
-- - actor/message_type columns on message_bus_events are free text (not
--   enums) so a future CMO agent or provider doesn't require a migration —
--   same reasoning the mission_events.event_type column already uses.

create type public.ceo_request_status as enum (
  'submitted',
  'analyzing',
  'proposed',
  'approved',
  'rejected',
  'delegated',
  'in_progress',
  'completed'
);

create type public.message_bus_status as enum ('pending', 'delivered', 'failed', 'retrying');

-- One row per CEO request submitted entirely inside Bridge.
create table public.ceo_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  raw_text text not null,
  status public.ceo_request_status not null default 'submitted',
  mission_id uuid references public.missions(id) on delete set null,
  submitted_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The Bridge CTO Agent's analysis of a request — one or more per request
-- (a retry produces a new row rather than overwriting the prior attempt,
-- so the full reasoning history stays auditable).
create table public.cto_proposals (
  id uuid primary key default gen_random_uuid(),
  ceo_request_id uuid not null references public.ceo_requests(id) on delete cascade,
  provider text not null, -- 'openai' | 'gemini' | 'kimi' | ...
  model text not null,
  proposal_text text not null,
  recommended_delegation text not null check (recommended_delegation in ('hyperagent', 'hermes', 'both')),
  risk_notes text,
  estimated_cost_usd numeric(10, 4),
  generated_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- The AI Message Bus: every AI-to-AI (and CEO-to-AI) hop is one row here.
-- This *is* the "complete history / audit trail / searchability" the
-- mission asks for — not a separate log system.
create table public.message_bus_events (
  id uuid primary key default gen_random_uuid(),
  ceo_request_id uuid references public.ceo_requests(id) on delete cascade,
  from_actor text not null, -- 'ceo' | 'bridge_cto_agent' | 'executive_assistant' | 'hyperagent' | 'hermes'
  to_actor text not null,
  message_type text not null, -- 'request_submitted' | 'proposal_ready' | 'approved' | 'rejected' | 'delegated' | 'report_returned' | ...
  summary text not null,
  status public.message_bus_status not null default 'pending',
  retry_count smallint not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Notification Center. Populated at each Message Bus milestone.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  ceo_request_id uuid references public.ceo_requests(id) on delete cascade,
  recipient_role public.hq_role not null,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- On-demand AI provider connection status. No secrets — only check results.
create table public.ai_provider_checks (
  provider_id text primary key, -- 'openai' | 'gemini' | 'kimi'
  active_model text,
  healthy boolean,
  last_error text,
  checked_by uuid references public.profiles(id),
  checked_at timestamptz not null default now()
);

alter table public.ceo_requests enable row level security;
alter table public.cto_proposals enable row level security;
alter table public.message_bus_events enable row level security;
alter table public.notifications enable row level security;
alter table public.ai_provider_checks enable row level security;

-- ceo_requests: only the CEO submits; all four internal roles read; all four
-- can advance status (analyzing/delegated/in_progress/completed are written
-- by the Bridge CTO Agent / Executive Assistant / HyperAgent / Hermes acting
-- under their own Supabase Auth accounts, not just the CEO).
create policy ceo_requests_read on public.ceo_requests for select
  using (public.current_role() in ('ceo', 'cto', 'hyperagent', 'hermes'));
create policy ceo_requests_insert on public.ceo_requests for insert
  with check (submitted_by = auth.uid() and public.current_role() = 'ceo');
create policy ceo_requests_update on public.ceo_requests for update
  using (public.current_role() in ('ceo', 'cto', 'hyperagent', 'hermes'));

-- cto_proposals: generated by any internal role (matches cto_briefs' shape
-- from Mission #003A — HyperAgent/Hermes may also need to generate one
-- programmatically, not just a human CEO/CTO); read by all four; immutable
-- once written (no update policy — a retry is a new row).
create policy cto_proposals_read on public.cto_proposals for select
  using (public.current_role() in ('ceo', 'cto', 'hyperagent', 'hermes'));
create policy cto_proposals_insert on public.cto_proposals for insert
  with check (
    (generated_by = auth.uid() or generated_by is null)
    and public.current_role() in ('ceo', 'cto', 'hyperagent', 'hermes')
  );

-- message_bus_events: all four roles read, insert, and update (advancing
-- status/retry_count as delivery is attempted) — this is infrastructure
-- plumbing all four roles participate in, not a CEO-only decision surface.
create policy message_bus_events_read on public.message_bus_events for select
  using (public.current_role() in ('ceo', 'cto', 'hyperagent', 'hermes'));
create policy message_bus_events_insert on public.message_bus_events for insert
  with check (public.current_role() in ('ceo', 'cto', 'hyperagent', 'hermes'));
create policy message_bus_events_update on public.message_bus_events for update
  using (public.current_role() in ('ceo', 'cto', 'hyperagent', 'hermes'));

-- notifications: all four roles read (so e.g. HyperAgent can see it was
-- notified of a delegation); insert by all four; a recipient marks their own
-- notification read, or ceo/cto can manage any (admin visibility).
create policy notifications_read on public.notifications for select
  using (public.current_role() in ('ceo', 'cto', 'hyperagent', 'hermes'));
create policy notifications_insert on public.notifications for insert
  with check (public.current_role() in ('ceo', 'cto', 'hyperagent', 'hermes'));
create policy notifications_update on public.notifications for update
  using (
    public.current_role() = recipient_role
    or public.current_role() in ('ceo', 'cto')
  );

-- ai_provider_checks: all four roles read; only ceo/cto can trigger a check
-- (matches who owns provider/infra configuration decisions elsewhere in
-- this schema, e.g. engineering_standards_write).
create policy ai_provider_checks_read on public.ai_provider_checks for select
  using (public.current_role() in ('ceo', 'cto', 'hyperagent', 'hermes'));
create policy ai_provider_checks_write on public.ai_provider_checks for all
  using (public.current_role() in ('ceo', 'cto'))
  with check (public.current_role() in ('ceo', 'cto'));
