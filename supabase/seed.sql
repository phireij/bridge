-- Operation Anniversary — seed/test data for reservations.
-- Deliberately crafted to exercise capacity boundaries and the overlap rule.
-- Run against a dev/staging project only (never production with real bookings).

-- 2026-07-25 morning: push the 10:00–11:00 window to the edge.
--   10:00 x8 (pending)  -> ticks 10:00=8, 10:30=8
--   10:30 x3 (confirmed)-> ticks 10:30=11, 11:00=3
--   => slot 10:00 remaining = 12 - max(8,11) = 1
--   => slot 10:30 remaining = 12 - max(11,3) = 1   (party of 2 must be rejected)
insert into public.reservations
  (ref, reservation_date, start_time, end_time, guests, customer_name, phone, email, status, consent)
values
  ('RCD-SEED01', '2026-07-25', '10:00', '11:00', 8, 'Aoi Tanaka',  '090-1111-1111', null, 'pending',   true),
  ('RCD-SEED02', '2026-07-25', '10:30', '11:30', 3, 'Ben Carter',  '090-2222-2222', null, 'confirmed', true),
  -- Fully book the 18:00 window (capacity boundary at close).
  ('RCD-SEED03', '2026-07-25', '18:00', '19:00', 12,'Chika Mori',  '090-3333-3333', null, 'confirmed', true),
  -- Cancelled + no_show must NOT consume capacity.
  ('RCD-SEED04', '2026-07-25', '11:00', '12:00', 12,'Dan Willis',  '090-4444-4444', null, 'cancelled', true),
  ('RCD-SEED05', '2026-07-26', '13:00', '14:00', 6, 'Emi Sato',    '090-5555-5555', 'emi@example.com', 'pending', true);
