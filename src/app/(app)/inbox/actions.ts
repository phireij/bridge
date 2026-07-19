"use server";

import { revalidatePath } from "next/cache";
import { createBridgeServerClient } from "@/lib/supabase/bridge-server";
import { getCurrentProfile } from "@/lib/auth/session";
import type { DecisionAction } from "@/lib/data/types";

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

  const { data: report } = await supabase
    .from("reports")
    .select("id, mission_id, agent")
    .eq("id", reportId)
    .single();

  const { error: decisionError } = await supabase.from("decisions").insert({
    report_id: reportId,
    mission_id: report?.mission_id ?? null,
    actor_id: profile.id,
    action,
    notes,
  });
  if (decisionError) throw new Error(decisionError.message);

  const nextStatus = action === "approve" ? "actioned" : "reviewed";
  const { error: reportError } = await supabase
    .from("reports")
    .update({ status: nextStatus })
    .eq("id", reportId);
  if (reportError) throw new Error(reportError.message);

  if (report?.mission_id) {
    await supabase.from("mission_events").insert({
      mission_id: report.mission_id,
      event_type: "decision",
      description: `CEO ${action.replace("_", " ")}d a report from ${report.agent}.${
        notes ? ` Notes: ${notes}` : ""
      }`,
      actor: profile.displayName,
    });
    await supabase
      .from("missions")
      .update({ latest_decision: `${action.replace("_", " ")} — ${new Date().toLocaleDateString()}` })
      .eq("id", report.mission_id);
  }

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
