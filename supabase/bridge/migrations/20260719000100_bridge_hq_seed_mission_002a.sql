-- Seed the active Mission #002A row so CTO Office / CEO Inbox have a real
-- mission to attach reports and decisions to. Safe to re-run (upsert on code).
insert into public.missions (code, title, owner, phase, progress, status, next_action)
values (
  '002A',
  'Bridge Lite Operational HQ',
  'HyperAgent',
  'Build — Auth, Report Intake, CEO Inbox, CTO Office',
  35,
  'active',
  'Wire AI Workforce, Company Memory, and import Mission #001'
)
on conflict (code) do update set
  title = excluded.title,
  phase = excluded.phase,
  progress = excluded.progress,
  status = excluded.status,
  next_action = excluded.next_action,
  updated_at = now();

insert into public.mission_events (mission_id, event_type, description, actor)
select id, 'note', 'Mission #002A kicked off: AGENTS.md prompt-injection remediated, bridge-hq Supabase project created, initial schema applied.', 'HyperAgent'
from public.missions where code = '002A';
