import { endOf } from "./config";
import type { Reservation, ReservationStatus } from "./types";

let n = 0;
function r(
  date: string,
  start: string,
  guests: number,
  name: string,
  phone: string,
  status: ReservationStatus,
  email: string | null = null,
): Reservation {
  n += 1;
  return {
    id: `seed-${n}`,
    ref: `RCD-SEED0${n}`,
    reservation_date: date,
    start_time: start,
    end_time: endOf(start),
    guests,
    customer_name: name,
    phone,
    email,
    notes: null,
    status,
    consent: true,
    created_at: new Date(Date.UTC(2026, 6, 17, 3, 0, 0) + n * 60000).toISOString(),
  };
}

/**
 * Dev/preview seed — mirrors supabase/seed.sql and is crafted to sit on the
 * capacity boundaries (10:00 window at 11/12; 18:00 fully booked; a cancelled
 * row that must NOT consume capacity).
 */
export const SEED_RESERVATIONS: Reservation[] = [
  r("2026-07-25", "10:00", 8, "Aoi Tanaka", "090-1111-1111", "pending"),
  r("2026-07-25", "10:30", 3, "Ben Carter", "090-2222-2222", "confirmed"),
  r("2026-07-25", "18:00", 12, "Chika Mori", "090-3333-3333", "confirmed"),
  r("2026-07-25", "11:00", 12, "Dan Willis", "090-4444-4444", "cancelled"),
  r("2026-07-26", "13:00", 6, "Emi Sato", "090-5555-5555", "pending", "emi@example.com"),
];
