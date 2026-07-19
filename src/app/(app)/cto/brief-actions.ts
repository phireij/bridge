"use server";

import { revalidatePath } from "next/cache";
import { createBridgeServerClient } from "@/lib/supabase/bridge-server";
import { getCurrentProfile } from "@/lib/auth/session";
import { computeRecommendation, RECOMMENDATION_LABEL } from "@/lib/recommendation";

/**
 * CTO Brief Generator (Mission #003A). Assembles a structured brief for a
 * mission from real data already in bridge-hq — reports, decisions, and
 * mission events — and runs it through the Recommendation Engine
 * (src/lib/recommendation.ts). Available to any internal role, since
 * HyperAgent and Hermes are expected to generate these as part of their own
 * reporting duty, not just the CEO/CTO.
 */
export async function generateCtoBrief(missionId: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "unassigned") {
    throw new Error("Only an assigned internal role can generate a CTO brief.");
  }

  const supabase = await createBridgeServerClient();

  const { data: mission, error: missionError } = await supabase
    .from("missions")
    .select("*")
    .eq("id", missionId)
    .single();
  if (missionError || !mission) throw new Error(missionError?.message ?? "Mission not found.");

  const { data: reports } = await supabase
    .from("reports")
    .select("status, risks")
    .eq("mission_id", missionId);

  const { data: events } = await supabase
    .from("mission_events")
    .select("event_type")
    .eq("mission_id", missionId);

  const pendingReports = (reports ?? []).filter((r) => r.status === "submitted").length;
  const reportsNeedingRevision = (reports ?? []).filter((r) => r.status === "reviewed").length;
  const unresolvedRisks = (reports ?? []).filter(
    (r) => r.risks && r.status !== "actioned",
  ).length;
  const openBlockers = (events ?? []).filter((e) => e.event_type === "blocker").length;

  const { recommendation, rationale } = computeRecommendation({
    pendingReports,
    reportsNeedingRevision,
    openBlockers,
    unresolvedRisks,
  });

  const summary =
    `Mission #${mission.code} — ${mission.title}. Phase: ${mission.phase}. Progress: ${mission.progress}%. ` +
    `${(reports ?? []).length} report(s) on record (${pendingReports} pending, ${reportsNeedingRevision} sent back for revision). ` +
    `${openBlockers} open blocker(s).`;

  const { data: inserted, error: insertError } = await supabase
    .from("cto_briefs")
    .insert({
      mission_id: missionId,
      title: `CTO Brief — Mission #${mission.code}`,
      summary,
      recommendation,
      rationale,
      generated_by: profile.id,
    })
    .select("id")
    .single();

  if (insertError) throw new Error(insertError.message);

  await supabase.from("mission_events").insert({
    mission_id: missionId,
    event_type: "note",
    description: `CTO Brief generated: ${RECOMMENDATION_LABEL[recommendation]} — ${rationale}`,
    actor: profile.displayName,
  });

  revalidatePath("/cto");
  return inserted.id as string;
}
