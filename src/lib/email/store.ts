/**
 * Read helpers for the email_events log — used by the admin dashboard to show
 * the last delivery status per reservation. Server-only, admin-scope.
 */
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type EmailStatus = "sent" | "failed" | "skipped_blank" | "no_provider";
export type EmailKindStr = "received" | "confirmed" | "cancelled";

export interface LastEmailStatus {
  kind: EmailKindStr;
  status: EmailStatus;
  created_at: string;
}

function hasAdmin(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/**
 * For each of the given reservation ids, return the most recent email event
 * (or nothing if there aren't any). Fails soft: on any error, returns an empty
 * map so the admin UI still renders without an indicator column.
 */
export async function getLastEmailStatusByReservation(
  reservationIds: string[],
): Promise<Record<string, LastEmailStatus>> {
  const out: Record<string, LastEmailStatus> = {};
  if (!hasAdmin() || reservationIds.length === 0) return out;
  try {
    const { data, error } = await createAdminClient()
      .from("email_events")
      .select("reservation_id, kind, status, created_at")
      .in("reservation_id", reservationIds)
      .order("created_at", { ascending: false });
    if (error) return out;
    for (const row of (data ?? []) as Array<{
      reservation_id: string;
      kind: EmailKindStr;
      status: EmailStatus;
      created_at: string;
    }>) {
      if (!out[row.reservation_id]) {
        out[row.reservation_id] = {
          kind: row.kind,
          status: row.status,
          created_at: row.created_at,
        };
      }
    }
  } catch {
    // fail soft — admin UI must render regardless of the log's health
  }
  return out;
}
