-- Mission #002A-4 — Bridge HQ Polish. Applies to bridge-hq only.

-- ── Departments as first-class entities ──────────────────────────────────
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

alter table public.workforce_status add column if not exists department_id uuid references public.departments(id);
alter table public.missions add column if not exists department_id uuid references public.departments(id);

alter table public.departments enable row level security;

create policy departments_read on public.departments for select
  using (public.current_role() in ('ceo', 'cto', 'hyperagent', 'hermes'));
create policy departments_write on public.departments for all
  using (public.current_role() in ('ceo', 'cto'))
  with check (public.current_role() in ('ceo', 'cto'));

-- Seed real departments (no fictional roster) and attach existing workforce rows.
insert into public.departments (name, description) values
  ('Executive', 'CEO — company direction, approvals, decisions.'),
  ('Advisory', 'External CTO — technical strategy and release sign-off.'),
  ('Engineering & Delivery', 'HyperAgent — builds and ships Bridge features.'),
  ('Infrastructure & Production Readiness', 'Hermes — infra review, security, rollback readiness.')
on conflict (name) do nothing;

update public.workforce_status set department_id = (select id from public.departments where name = 'Executive') where agent_name = 'CEO';
update public.workforce_status set department_id = (select id from public.departments where name = 'Advisory') where agent_name = 'CTO';
update public.workforce_status set department_id = (select id from public.departments where name = 'Engineering & Delivery') where agent_name = 'HyperAgent';
update public.workforce_status set department_id = (select id from public.departments where name = 'Infrastructure & Production Readiness') where agent_name = 'Hermes';

update public.missions set department_id = (select id from public.departments where name = 'Engineering & Delivery') where code = '002A';

-- ── Credential rotation audit (no secrets ever stored here) ─────────────
create table public.credential_rotations (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null,
  rotated_by uuid references public.profiles(id),
  rotated_at timestamptz not null default now(),
  note text
);

alter table public.credential_rotations enable row level security;

create policy credential_rotations_ceo_only on public.credential_rotations for all
  using (public.current_role() = 'ceo')
  with check (public.current_role() = 'ceo');
