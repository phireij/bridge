"use server";

import { isEmailEnabled } from "@/lib/email/config";
import { sendReservationEmail } from "@/lib/email/send";
import { createReservation, getAvailability } from "@/lib/reservations/store";
import type { BookingInput } from "@/lib/reservations/types";

/** Fetch live per-slot availability for a date (used to refresh after a race). */
export async function getAvailabilityAction(date: string) {
  return getAvailability(date);
}

/**
 * Create a reservation. All validation + atomic capacity check live server-side.
 * After a successful booking we fire the "received" email — try/catch swallows
 * any error so email delivery can never invalidate a saved reservation.
 * Escape hatch: on deployed environments without a provider we strip the email
 * field so we never collect what we cannot use.
 */
export async function createBookingAction(input: BookingInput) {
  const cleaned: BookingInput = { ...input };
  if (!isEmailEnabled()) cleaned.email = undefined;

  const result = await createReservation(cleaned);
  if (result.ok) {
    try {
      await sendReservationEmail("received", result.reservation);
    } catch {
      // sendReservationEmail already logs to email_events; belt-and-suspenders.
    }
  }
  return result;
}
