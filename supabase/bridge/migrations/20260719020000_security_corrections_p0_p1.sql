-- Mission #002A — CTO Security Corrections (P0/P1)
-- Applies to bridge-hq only.

-- ── P0: Prevent role self-escalation ─────────────────────────────────────
-- profiles_self_update allowed any authenticated user to UPDATE their own
-- row with no column restriction — including `role`. Remove it entirely.
-- Only the CEO (profiles_ceo_manage, already in place) may assign roles.
drop policy if exists profiles_self_update on public.profiles;

-- Narrow, safe path for a user to change their own display name only.
-- SECURITY DEFINER so it can write despite no self-update policy existing,
-- but it is hard-coded to touch display_name alone — it cannot be used to
-- change role, and it can only ever target auth.uid() (never another user).
create or replace function public.update_own_display_name(new_display_name text)
returns void as $$
begin
  if new_display_name is null or length(trim(new_display_name)) = 0 then
    raise exception 'display_name cannot be empty';
  end if;
  update public.profiles
    set display_name = new_display_name, updated_at = now()
    where id = auth.uid();
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function public.update_own_display_name(text) from public;
grant execute on function public.update_own_display_name(text) to authenticated;

-- ── P1: Bind report identity to authenticated role ───────────────────────
-- The old policy let any hyperagent/hermes session insert with an arbitrary
-- `agent` value (e.g. hyperagent submitting as agent='hermes'). Require the
-- claimed agent to match the caller's own role.
drop policy if exists reports_agent_insert on public.reports;
create policy reports_agent_insert on public.reports for insert
  with check (
    submitted_by = auth.uid()
    and agent::text = public.current_role()::text
  );
-- reports_ceo_cto_insert is unchanged on purpose: the CEO/CTO manual
-- fallback form is explicitly allowed to log a report on behalf of either
-- agent — that is its documented job, not an identity leak.

-- ── P1: Restrict workforce updates to the agent's own record ─────────────
alter table public.workforce_status
  add column if not exists owner_id uuid references public.profiles(id);

drop policy if exists workforce_upsert on public.workforce_status;
create policy workforce_own_write on public.workforce_status for all
  using (owner_id = auth.uid() or public.current_role() in ('ceo', 'cto'))
  with check (owner_id = auth.uid() or public.current_role() in ('ceo', 'cto'));
-- workforce_read (all internal roles, select-only) is untouched.

-- ── P1: Atomic CEO decision RPC ───────────────────────────────────────────
-- Replaces three separate client-driven writes (decisions insert, reports
-- update, mission_events insert + missions update) with one transactional
-- function. Role-checks CEO itself (defense in depth alongside
-- decisions_ceo_insert), row-locks the report, and rejects a report that
-- has already been actioned — duplicate-submission protection.
create or replace function public.record_decision(
  p_report_id uuid,
  p_action public.decision_action,
  p_notes text default null
) returns public.decisions as $$
declare
  v_actor_id uuid := auth.uid();
  v_role public.hq_role := public.current_role();
  v_report public.reports;
  v_decision public.decisions;
  v_next_status public.report_status;
begin
  if v_actor_id is null or v_role <> 'ceo' then
    raise exception 'Only the CEO may record a decision.' using errcode = '42501';
  end if;

  select * into v_report from public.reports where id = p_report_id for update;
  if v_report.id is null then
    raise exception 'Report % not found', p_report_id using errcode = 'P0002';
  end if;
  if v_report.status = 'actioned' then
    raise exception 'Report % has already been actioned — duplicate submission blocked.', p_report_id
      using errcode = '23505';
  end if;

  v_next_status := case when p_action = 'approve' then 'actioned' else 'reviewed' end;

  insert into public.decisions (report_id, mission_id, actor_id, action, notes)
  values (p_report_id, v_report.mission_id, v_actor_id, p_action, p_notes)
  returning * into v_decision;

  update public.reports set status = v_next_status where id = p_report_id;

  if v_report.mission_id is not null then
    insert into public.mission_events (mission_id, event_type, description, actor)
    values (
      v_report.mission_id,
      'decision',
      format('CEO %s a report from %s.%s', replace(p_action::text, '_', ' '), v_report.agent,
        case when p_notes is not null then ' Notes: ' || p_notes else '' end),
      'CEO'
    );
    update public.missions
      set latest_decision = format('%s — %s', replace(p_action::text, '_', ' '), to_char(now(), 'MM/DD/YYYY')),
          updated_at = now()
      where id = v_report.mission_id;
  end if;

  return v_decision;
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function public.record_decision(uuid, public.decision_action, text) from public;
grant execute on function public.record_decision(uuid, public.decision_action, text) to authenticated;
