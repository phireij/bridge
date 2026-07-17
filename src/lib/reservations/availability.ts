/**
 * Pure availability math — the TypeScript twin of the SQL `get_availability`
 * and the capacity check inside `book_reservation`. Used by the seeded fallback
 * and by tests so both paths agree exactly.
 */
import { CAPACITY, SLOT_STEP_MIN, slotStarts, toMin } from "./config";
import { ACTIVE_STATUSES, type Reservation, type SlotAvailability } from "./types";

/** Guests occupying a given 30-min tick (minutes since midnight) on `date`. */
export function occupancyAt(
  reservations: Reservation[],
  date: string,
  tickMin: number,
): number {
  return reservations
    .filter(
      (r) =>
        r.reservation_date === date &&
        ACTIVE_STATUSES.includes(r.status) &&
        toMin(r.start_time) <= tickMin &&
        tickMin < toMin(r.end_time),
    )
    .reduce((sum, r) => sum + r.guests, 0);
}

/**
 * Remaining capacity for a NEW 60-min booking at each start slot.
 * A booking at T touches ticks T and T+30, so remaining = CAPACITY - max(both).
 */
export function computeAvailability(
  reservations: Reservation[],
  date: string,
): SlotAvailability[] {
  return slotStarts().map((start) => {
    const s = toMin(start);
    const occ = Math.max(
      occupancyAt(reservations, date, s),
      occupancyAt(reservations, date, s + SLOT_STEP_MIN),
    );
    return { start, remaining: Math.max(0, CAPACITY - occ), capacity: CAPACITY };
  });
}

/** Can a party of `guests` book a 60-min slot starting at `start` on `date`? */
export function canBook(
  reservations: Reservation[],
  date: string,
  start: string,
  guests: number,
): boolean {
  const s = toMin(start);
  const occ = Math.max(
    occupancyAt(reservations, date, s),
    occupancyAt(reservations, date, s + SLOT_STEP_MIN),
  );
  return occ + guests <= CAPACITY;
}
