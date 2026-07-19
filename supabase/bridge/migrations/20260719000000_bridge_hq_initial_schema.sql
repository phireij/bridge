-- Bridge Lite Operational HQ — initial schema (Mission #002A)
-- Applies to the dedicated `bridge-hq` Supabase project only. Never apply to
-- ruby-reservations.

create type public.hq_role as enum ('ceo', 'cto', 'hyperagent', 'hermes', 'unassigned');
create type public.report_agent as enum ('hyperagent', 'hermes');
create type public.report_status as enum ('submitted', 'reviewed', 'actioned');
create type public.decision_action as enum ('approve', 'reject', 'request_revision');
create type public.mission_status as enum ('active', 'blocked', 'complete', 'archived');

-- One row per authenticated user. Role starts 'unassigned'; CEO promotes manually.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role public.hq_role not null default 'unassigned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.missions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, -- e.g. '002A'
  title text not null,
  owner text not null,
  phase text not null default 'planning',
  progress smallint not null default 0 check (progress between 0 and 100),
  status public.mission_status not null default 'active',
  next_action text,
  latest_decision text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mission_events (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  event_type text not null, -- e.g. 'report', 'decision', 'status_change', 'note'
  description text not null,
  actor text not null,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  agent public.report_agent not null,
  mission_id uuid references public.missions(id) on delete set null,
  summary text not null,
  evidence text,
  risks text,
  recommendation text,
  requested_decision text,
  related_links jsonb not null default '[]'::jsonb,
  status public.report_status not null default 'submitted',
  submitted_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports(id) on delete set null,
  mission_id uuid references public.missions(id) on delete set null,
  actor_id uuid not null references public.profiles(id),
  action public.decision_action not null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.workforce_status (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null unique, -- 'HyperAgent', 'Hermes', 'CTO', 'CEO'
  role text not null,
  status text not null default 'idle',
  current_task text,
  last_active_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.company_memory (
  id uuid primary key default gen_random_uuid(),
  category text not null, -- mission_decision | release_approval | architecture_decision | launch_certificate | operating_rule | lesson_learned
  title text not null,
  content text not null,
  mission_id uuid references public.missions(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Auto-create a profile (role 'unassigned') when a new auth user signs up.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email), 'unassigned');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS: closed by default, internal-only.
alter table public.profiles enable row level security;
alter table public.missions enable row level security;
alter table public.mission_events enable row level security;
alter table public.reports enable row level security;
alter table public.decisions enable row level security;
alter table public.workforce_status enable row level security;
alter table public.company_memory enable row level security;

create function public.current_role() returns public.hq_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable security definer set search_path = public;

-- Every authenticated internal user can read their own profile; CEO/CTO can read all.
create policy profiles_self_read on public.profiles for select
  using (id = auth.uid() or public.current_role() in ('ceo', 'cto'));
create policy profiles_self_update on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_ceo_manage on public.profiles for all
  using (public.current_role() = 'ceo');

-- Missions/mission_events: CEO+CTO full access, agents read-only.
create policy missions_read on public.missions for select
  using (public.current_role() in ('ceo', 'cto', 'hyperagent', 'hermes'));
create policy missions_write on public.missions for insert with check (public.current_role() in ('ceo', 'cto'));
create policy missions_update on public.missions for update using (public.current_role() in ('ceo', 'cto'));

create policy mission_events_read on public.mission_events for select
  using (public.current_role() in ('ceo', 'cto', 'hyperagent', 'hermes'));
create policy mission_events_insert on public.mission_events for insert
  with check (public.current_role() in ('ceo', 'cto', 'hyperagent', 'hermes'));

-- Reports: agents can insert their own; CEO/CTO can read/update all; agents can read own.
create policy reports_agent_insert on public.reports for insert
  with check (submitted_by = auth.uid() and public.current_role() in ('hyperagent', 'hermes'));
create policy reports_read on public.reports for select
  using (public.current_role() in ('ceo', 'cto') or submitted_by = auth.uid());
create policy reports_ceo_cto_update on public.reports for update
  using (public.current_role() in ('ceo', 'cto'));

-- Decisions: CEO only writes; CEO/CTO read.
create policy decisions_ceo_insert on public.decisions for insert
  with check (actor_id = auth.uid() and public.current_role() = 'ceo');
create policy decisions_read on public.decisions for select
  using (public.current_role() in ('ceo', 'cto'));

-- Workforce status: all internal roles read; only the agent itself or CEO/CTO update.
create policy workforce_read on public.workforce_status for select
  using (public.current_role() in ('ceo', 'cto', 'hyperagent', 'hermes'));
create policy workforce_upsert on public.workforce_status for all
  using (public.current_role() in ('ceo', 'cto', 'hyperagent', 'hermes'));

-- Company memory: all internal roles read; CEO/CTO write.
create policy memory_read on public.company_memory for select
  using (public.current_role() in ('ceo', 'cto', 'hyperagent', 'hermes'));
create policy memory_write on public.company_memory for insert with check (public.current_role() in ('ceo', 'cto'));
