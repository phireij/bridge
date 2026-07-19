"use server";

import { redirect } from "next/navigation";
import { createBridgeServerClient } from "@/lib/supabase/bridge-server";
import { getCurrentProfile } from "@/lib/auth/session";

/**
 * Manual fallback for Report Intake (per the mission brief: "a secure
 * internal report-submission form or API is acceptable" for v0.1). Lets
 * whoever is signed in with an internal role log a report on behalf of an
 * agent — useful before HyperAgent/Hermes have their own Supabase accounts
 * wired into scripts.
 */
export async function submitReportAction(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "unassigned") {
    throw new Error("Only assigned internal roles can submit a report.");
  }

  const agent = String(formData.get("agent"));
  const missionCode = String(formData.get("missionCode") || "");
  const summary = String(formData.get("summary") || "");
  const evidence = String(formData.get("evidence") || "");
  const risks = String(formData.get("risks") || "");
  const recommendation = String(formData.get("recommendation") || "");
  const requestedDecision = String(formData.get("requestedDecision") || "");

  if (agent !== "hyperagent" && agent !== "hermes") {
    throw new Error("Agent must be HyperAgent or Hermes.");
  }
  if (!summary) throw new Error("Summary is required.");

  const supabase = await createBridgeServerClient();

  let missionId: string | null = null;
  if (missionCode) {
    const { data: mission } = await supabase
      .from("missions")
      .select("id")
      .eq("code", missionCode)
      .maybeSingle();
    missionId = mission?.id ?? null;
  }

  const { data: inserted, error } = await supabase
    .from("reports")
    .insert({
      agent,
      mission_id: missionId,
      summary,
      evidence: evidence || null,
      risks: risks || null,
      recommendation: recommendation || null,
      requested_decision: requestedDecision || null,
      submitted_by: profile.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  if (missionId) {
    await supabase.from("mission_events").insert({
      mission_id: missionId,
      event_type: "report",
      description: `${agent === "hyperagent" ? "HyperAgent" : "Hermes"} submitted a report (logged by ${profile.displayName}): ${summary}`,
      actor: agent === "hyperagent" ? "HyperAgent" : "Hermes",
    });
  }

  redirect(`/inbox?submitted=${inserted.id}`);
}
