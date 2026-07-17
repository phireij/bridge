"use server";

import { createReservation, getAvailability } from "@/lib/reservations/store";
import type { BookingInput } from "@/lib/reservations/types";

/** Fetch live per-slot availability for a date (used to refresh after a race). */
export async function getAvailabilityAction(date: string) {
  return getAvailability(date);
}

/** Create a reservation. All validation + atomic capacity check live server-side. */
export async function createBookingAction(input: BookingInput) {
  return createReservation(input);
}
