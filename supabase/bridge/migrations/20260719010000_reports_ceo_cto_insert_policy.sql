-- Mission #002A fix: the manual Report Intake fallback form (/reports/new)
-- is usable by any assigned internal role per the mission brief, but the
-- original reports_agent_insert policy only granted INSERT to hyperagent/
-- hermes. CEO/CTO logging a report on an agent's behalf were blocked by RLS
-- (silent 500 on submit). Add the missing grant.
create policy reports_ceo_cto_insert on public.reports for insert
  with check (submitted_by = auth.uid() and public.current_role() in ('ceo', 'cto'));
