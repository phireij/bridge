/**
 * Fire-and-log transactional email for reservations.
 *
 * Guarantees:
 *   - NEVER throws. All errors are swallowed and recorded to email_events.
 *   - Never sends when the customer's email is blank (records `skipped_blank`).
 *   - Never sends without a configured provider (records `no_provider`).
 *   - Idempotent per (reservation, kind): once a `sent` row exists we skip.
 *   - The reservation itself is untouched — email is strictly downstream.
 */
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Reservation } from "@/lib/reservations/types";
import { fromHeader, isEmailEnabled, replyToHeader } from "./config";
import { getResend } from "./resend";
import { buildEmail, type EmailKind } from "./templates";

type EmailStatus = "sent" | "failed" | "skipped_blank" | "no_provider";

async function log(
  reservation: Reservation,
  kind: EmailKind,
  status: EmailStatus,
  extras?: { providerId?: string | null; error?: string | null },
): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("email_events").insert({
      reservation_id: reservation.id,
      kind,
      status,
      provider_id: extras?.providerId ?? null,
      error: extras?.error ?? null,
      to_email: reservation.email ?? null,
    });
  } catch {
    // Even the log write must never propagate — email is downstream of the booking.
  }
}

export async function sendReservationEmail(
  kind: EmailKind,
  reservation: Reservation,
): Promise<{ status: EmailStatus; providerId?: string | null; error?: string | null }> {
  if (!reservation.email) {
    await log(reservation, kind, "skipped_blank");
    return { status: "skipped_blank" };
  }

  if (!isEmailEnabled()) {
    await log(reservation, kind, "no_provider");
    return { status: "no_provider" };
  }

  // Idempotency: don't re-send if a `sent` row already exists.
  try {
    const admin = createAdminClient();
    const { data: prior } = await admin
      .from("email_events")
      .select("id")
      .eq("reservation_id", reservation.id)
      .eq("kind", kind)
      .eq("status", "sent")
      .limit(1);
    if (prior && prior.length > 0) return { status: "sent", providerId: null };
  } catch {
    // If the pre-check fails we still attempt the send; the unique index on
    // (reservation_id, kind) WHERE status='sent' prevents duplicate log rows.
  }

  const resend = getResend();
  if (!resend) {
    await log(reservation, kind, "no_provider");
    return { status: "no_provider" };
  }

  try {
    const composed = buildEmail(kind, reservation);
    const rt = replyToHeader();
    const { data, error } = await resend.emails.send({
      from: fromHeader(),
      to: [reservation.email],
      subject: composed.subject,
      html: composed.html,
      text: composed.text,
      ...(rt ? { replyTo: rt } : {}),
      headers: {
        "X-Entity-Ref-ID": `${reservation.ref}:${kind}`,
      },
    });
    if (error) {
      const msg = error.message ?? String(error);
      await log(reservation, kind, "failed", { error: msg });
      return { status: "failed", error: msg };
    }
    const providerId = data?.id ?? null;
    await log(reservation, kind, "sent", { providerId });
    return { status: "sent", providerId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await log(reservation, kind, "failed", { error: msg });
    return { status: "failed", error: msg };
  }
}
