-- Operation Anniversary — transactional email delivery log.
-- ADDITIVE only. No changes to the reservations table or the atomic
-- book_reservation() function. Email is fired-and-logged AFTER a successful
-- booking; a failed or missing send must never affect the reservation.
--
-- Statuses:
--   sent          — Resend accepted the message; provider_id stored
--   failed        — Resend rejected or the call errored; error stored
--   skipped_blank — customer didn't supply an email; nothing sent
--   no_provider   — RESEND_API_KEY not configured on this environment
--
-- Kinds mirror the reservation lifecycle: received, confirmed, cancelled.

create table if not exists public.email_events (
  id             uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  kind           text not null check (kind in ('received','confirmed','cancelled')),
  status         text not null check (status in ('sent','failed','skipped_blank','no_provider')),
  provider_id    text,
  error          text,
  to_email       text,
  created_at     timestamptz not null default now()
);

-- Idempotency: at most one SUCCESSFUL send per (reservation, kind). Failed /
-- skipped rows may repeat freely (e.g. transient outage, retried action).
create unique index if not exists email_events_sent_uidx
  on public.email_events (reservation_id, kind) where status = 'sent';

create index if not exists email_events_reservation_created_idx
  on public.email_events (reservation_id, created_at desc);

-- Closed by default: only the server-side service-role (staff/admin path)
-- reads or writes this. Anon/authenticated have no direct access.
alter table public.email_events enable row level security;
alter table public.email_events force row level security;
revoke all on public.email_events from anon, authenticated;
