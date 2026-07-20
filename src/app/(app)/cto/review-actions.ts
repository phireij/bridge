"use server";

import { revalidatePath } from "next/cache";
import { createBridgeServerClient } from "@/lib/supabase/bridge-server";
import { getCurrentProfile } from "@/lib/auth/session";
import { getMissionGate, generateCtoReviewPackageMarkdown } from "@/lib/mission-review";
import { parseCtoDecisionText, type CtoApprovalStatus } from "@/lib/decision-import";
import { getMissions } from "@/lib/data";

/**
 * Generates the CTO Review Package Markdown for a mission. Read-only — safe
 * to call at any time so a role can see exactly what's still missing before
 * requesting review. Gate status is embedded in the package itself.
 */
export async function generateReviewPackage(missionId: string): Promise<string> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "unassigned") {
    throw new Error("Only an assigned internal role can generate a CTO Review Package.");
  }

  const missions = await getMissions();
  const mission = missions.find((m) => m.id === missionId);
  if (!mission) throw new Error("Mission not found.");

  return generateCtoReviewPackageMarkdown(mission);
}

/**
 * The Pre-Review Gate (Mission #004A): blocks a CTO review request when
 * required evidence is missing. Enforced here, server-side — the UI also
 * disables the button, but this is the actual guarantee.
 */
export async function requestCtoReview(missionId: string): Promise<{ requested: boolean; missing: string[] }> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "unassigned") {
    throw new Error("Only an assigned internal role can request a CTO review.");
  }

  const gate = await getMissionGate(missionId);
  if (!gate.ready) {
    return { requested: false, missing: gate.missing };
  }

  const supabase = await createBridgeServerClient();
  await supabase.from("mission_events").insert({
    mission_id: missionId,
    event_type: "cto_review_requested",
    description: "CTO Review Package compiled and ready — awaiting CTO decision.",
    actor: profile.displayName,
  });

  revalidatePath("/cto");
  return { requested: true, missing: [] };
}

export interface ImportCtoDecisionInput {
  missionId: string;
  ctoBriefId?: string | null;
  rawText: string;
  /** The human-confirmed fields — may differ from the raw parse if the user edited them. */
  confirmed: {
    decision: string;
    conditions: string;
    risks: string;
    requiredActions: string;
    confidence: string;
    approvalStatus: CtoApprovalStatus;
  };
}

/**
 * CTO Decision Import (Mission #004A). Requires the caller to have already
 * seen the deterministic parse (parseCtoDecisionText, run client-side for
 * preview) and to submit the fields they confirmed — this action re-validates
 * shape but trusts the human's edits over the raw parse, per "require human
 * confirmation before saving parsed fields." Never auto-approves anything:
 * saving an import here only records what the CTO said, it does not merge,
 * deploy, or change mission status by itself.
 */
export async function importCtoDecision(input: ImportCtoDecisionInput): Promise<{ id: string }> {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "ceo" && profile.role !== "cto")) {
    throw new Error("Only CEO or CTO-role accounts can import a CTO decision (matches cto_decision_imports RLS).");
  }

  if (!input.rawText.trim()) {
    throw new Error("Paste the CTO's response before importing.");
  }
  if (!input.confirmed.decision.trim()) {
    throw new Error("Decision field is required — confirm or fill it in before saving.");
  }

  const supabase = await createBridgeServerClient();
  const { data: inserted, error: insertError } = await supabase
    .from("cto_decision_imports")
    .insert({
      mission_id: input.missionId,
      cto_brief_id: input.ctoBriefId ?? null,
      raw_text: input.rawText,
      decision: input.confirmed.decision,
      conditions: input.confirmed.conditions || null,
      risks: input.confirmed.risks || null,
      required_actions: input.confirmed.requiredActions || null,
      confidence: input.confirmed.confidence || null,
      approval_status: input.confirmed.approvalStatus,
      imported_by: profile.id,
    })
    .select("id")
    .single();

  if (insertError) throw new Error(insertError.message);

  await supabase.from("mission_events").insert({
    mission_id: input.missionId,
    event_type: "cto_decision_imported",
    description: `CTO decision imported: ${input.confirmed.approvalStatus.replace(/_/g, " ")} — ${input.confirmed.decision}`,
    actor: profile.displayName,
  });

  if (input.confirmed.approvalStatus === "approved_with_conditions" || input.confirmed.approvalStatus === "rejected") {
    await supabase.from("mission_events").insert({
      mission_id: input.missionId,
      event_type: "revision_requested",
      description:
        input.confirmed.approvalStatus === "rejected"
          ? `CTO rejected — required actions: ${input.confirmed.requiredActions || "see decision"}`
          : `CTO approved with conditions: ${input.confirmed.conditions || "see decision"}`,
      actor: profile.displayName,
    });
  }

  if (input.confirmed.approvalStatus === "approved" || input.confirmed.approvalStatus === "approved_with_conditions") {
    await supabase.from("mission_events").insert({
      mission_id: input.missionId,
      event_type: "ceo_approval_required",
      description: "CTO decision imported — final CEO approval still required before any merge or deploy.",
      actor: profile.displayName,
    });
  }

  revalidatePath("/cto");
  return { id: inserted.id as string };
}

/** Server-side re-parse, used by the decision-import form's preview step. */
export async function previewCtoDecisionParse(rawText: string) {
  return parseCtoDecisionText(rawText);
}
