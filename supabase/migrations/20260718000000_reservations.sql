-- Operation Anniversary — Ruby's Cake Delights reservation schema
-- Idempotent-ish migration for the July 25–26, 2026 anniversary booking MVP.
--
-- Capacity model: 12 guests concurrently. Reservations are 60 minutes, starting
-- every 30 minutes between 10:00 and 19:00 (last start 19:00 → ends 20:00).
-- A 60-min booking starting at T occupies the two 30-min ticks {T, T+30}, so any
-- overlapping reservation shares at least one of those ticks. Overbooking is
-- prevented atomically inside book_reservation() (SECURITY DEFINER + row locks).

-- ── Enums / status ───────────────────────────────────────────────────────────
do $$ begin
  create type reservation_status as enum
    ('pending', 'confirmed', 'cancelled', 'arrived', 'no_show');
exception when duplicate_object then null; end $$;

-- ── Table ────────────────────────────────────────────────────────────────────
create table if not exists public.reservations (
  id               uuid primary key default gen_random_uuid(),
  ref              text unique not null,
  reservation_date date not null,
  start_time       time not null,
  end_time         time not null,
  guests           integer not null check (guests between 1 and 12),
  customer_name    text not null check (length(trim(customer_name)) > 0),
  phone            text not null check (length(trim(phone)) > 0),
  email            text,
  notes            text,
  status           reservation_status not null default 'pending',
  consent          boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- Anniversary window + operating grid guards (defense in depth).
  constraint reservations_date_chk
    check (reservation_date in (date '2026-07-25', date '2026-07-26')),
  constraint reservations_start_chk
    check (start_time >= time '10:00' and start_time <= time '19:00'),
  constraint reservations_grid_chk
    check (extract(minute from start_time)::int in (0, 30)),
  constraint reservations_duration_chk
    check (end_time = start_time + interval '60 minutes')
);

create index if not exists reservations_date_status_idx
  on public.reservations (reservation_date, status);
create index if not exists reservations_date_start_idx
  on public.reservations (reservation_date, start_time);

-- Statuses that consume capacity when checking availability.
create or replace function public.reservation_is_active(s reservation_status)
returns boolean language sql immutable as $$
  select s in ('pending', 'confirmed', 'arrived')
$$;

-- keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_reservations_touch on public.reservations;
create trigger trg_reservations_touch
  before update on public.reservations
  for each row execute function public.touch_updated_at();

-- ── Availability (safe for anon; returns only aggregate counts, no PII) ───────
-- For each 30-min start slot 10:00..19:00, remaining capacity for a NEW 60-min
-- booking = 12 - max(occupancy at slot, occupancy at slot+30).
create or replace function public.get_availability(p_date date)
returns table (start_time time, remaining integer, capacity integer)
language sql
security definer
set search_path = public
as $$
  with slots as (
    select (time '10:00' + (n || ' minutes')::interval)::time as s
    from generate_series(0, 540, 30) as n            -- 10:00 .. 19:00
  ),
  ticks as (  -- occupancy per 30-min tick 10:00..19:30
    select (time '10:00' + (n || ' minutes')::interval)::time as t
    from generate_series(0, 570, 30) as n
  ),
  occ as (
    select tk.t,
      coalesce(sum(r.guests) filter (
        where reservation_is_active(r.status)
          and r.start_time <= tk.t and tk.t < r.end_time
      ), 0)::int as used
    from ticks tk
    left join public.reservations r
      on r.reservation_date = p_date
    group by tk.t
  )
  select s.s as start_time,
         (12 - greatest(
            (select used from occ where occ.t = s.s),
            (select used from occ where occ.t = (s.s + interval '30 minutes')::time)
         ))::int as remaining,
         12 as capacity
  from slots s
  order by s.s;
$$;

-- ── Atomic booking (overbooking-safe) ─────────────────────────────────────────
create or replace function public.book_reservation(
  p_date   date,
  p_start  time,
  p_guests integer,
  p_name   text,
  p_phone  text,
  p_email  text default null,
  p_notes  text default null,
  p_consent boolean default false
)
returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_end   time := (p_start + interval '60 minutes')::time;
  v_used0 int;
  v_used1 int;
  v_row   public.reservations;
  v_ref   text;
begin
  if not p_consent then
    raise exception 'CONSENT_REQUIRED' using errcode = 'check_violation';
  end if;
  if p_guests < 1 or p_guests > 12 then
    raise exception 'INVALID_PARTY_SIZE' using errcode = 'check_violation';
  end if;
  if p_date not in (date '2026-07-25', date '2026-07-26') then
    raise exception 'INVALID_DATE' using errcode = 'check_violation';
  end if;
  if p_start < time '10:00' or p_start > time '19:00'
     or extract(minute from p_start)::int not in (0, 30) then
    raise exception 'INVALID_SLOT' using errcode = 'check_violation';
  end if;

  -- Serialize concurrent bookings for this date (low volume) to make the
  -- capacity check + insert atomic. Prevents the classic read-then-write race.
  perform 1 from public.reservations
   where reservation_date = p_date and reservation_is_active(status)
   for update;

  -- occupancy at the two ticks the new booking would touch
  select coalesce(sum(guests), 0) into v_used0 from public.reservations
   where reservation_date = p_date and reservation_is_active(status)
     and start_time <= p_start and p_start < end_time;
  select coalesce(sum(guests), 0) into v_used1 from public.reservations
   where reservation_date = p_date and reservation_is_active(status)
     and start_time <= (p_start + interval '30 minutes')::time
     and (p_start + interval '30 minutes')::time < end_time;

  if greatest(v_used0, v_used1) + p_guests > 12 then
    raise exception 'SLOT_FULL' using errcode = 'check_violation';
  end if;

  v_ref := 'RCD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.reservations
    (ref, reservation_date, start_time, end_time, guests,
     customer_name, phone, email, notes, status, consent)
  values
    (v_ref, p_date, p_start, v_end, p_guests,
     trim(p_name), trim(p_phone), nullif(trim(p_email), ''), nullif(trim(p_notes), ''),
     'pending', p_consent)
  returning * into v_row;

  return v_row;
end $$;

-- ── Row Level Security ─────────────────────────────────────────────────────────
-- Deny all direct table access to anon/authenticated. Customers write ONLY via
-- book_reservation() (SECURITY DEFINER) and read availability via
-- get_availability(). Admin (staff) operations run server-side with the
-- service-role key, which bypasses RLS. No table policies are granted, so the
-- table is closed by default once RLS is enabled.
alter table public.reservations enable row level security;
alter table public.reservations force row level security;

revoke all on public.reservations from anon, authenticated;
grant execute on function public.get_availability(date) to anon, authenticated;
grant execute on function public.book_reservation(date, time, integer, text, text, text, text, boolean)
  to anon, authenticated;
