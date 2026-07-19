"use server";

import { revalidatePath } from "next/cache";
import { createBridgeServerClient } from "@/lib/supabase/bridge-server";
import { getCurrentProfile } from "@/lib/auth/session";
import type { DecisionAction } from "@/lib/data/types";

/**
 * Records a CEO decision via the `record_decision` Postgres RPC (Mission
 * #002A CTO security corrections). The RPC is the single source of truth
 * for this write: it role-checks CEO itself, row-locks the report, rejects
 * an already-actioned report (duplicate-submission protection), and writes
 * the decision + report status + mission event + mission update in one
 * transaction. The client-side role check below is a fast-fail UX guard
 * only — the RPC and decisions_ceo_insert policy are what actually enforce
 * this server-side.
 */
async function recordDecision(
  reportId: string,
  action: DecisionAction,
  notes: string | null,
) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "ceo") {
    throw new Error("Only the CEO can record a decision on a report.");
  }

  const supabase = await createBridgeServerClient();

  const { error } = await supabase.rpc("record_decision", {
    p_report_id: reportId,
    p_action: action,
    p_notes: notes,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/inbox");
  revalidatePath("/cto");
}

export async function approveReport(reportId: string, notes?: string) {
  await recordDecision(reportId, "approve", notes ?? null);
}

export async function rejectReport(reportId: string, notes?: string) {
  await recordDecision(reportId, "reject", notes ?? null);
}

export async function requestRevision(reportId: string, notes?: string) {
  await recordDecision(reportId, "request_revision", notes ?? null);
}
