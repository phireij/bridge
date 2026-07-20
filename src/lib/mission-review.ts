/**
 * Mission #004A composition helpers.
 *
 * Bridges the Pre-Review Gate and CTO Review Package generator (both pure,
 * deterministic functions) with live Bridge HQ data, without putting that
 * composition logic in the UI layer or duplicating it across server actions.
 */
import { computeRecommendation } from "./recommendation";
import { evaluatePreReviewGate, type PreReviewGateInput, type PreReviewGateResult } from "./review-gate";
import { buildCtoReviewPackage } from "./review-package";
import {
  getCtoBriefsByMission,
  getDecisionsByMission,
  getMissionEvents,
  getReportsByMission,
  type MissionRecord,
} from "./data";

const TEST_EVIDENCE_EVENT = "test_evidence";
const ROLLBACK_PLAN_EVENT = "rollback_plan";
const SECURITY_REVIEW_EVENT = "security_review";
const MIGRATION_NOTES_EVENT = "migration_notes";

/**
 * Required evidence is logged as its own mission_events entry (event types
 * above) rather than as new columns on `reports` — this keeps the existing
 * reports table untouched and gives every piece of evidence its own
 * auditable timestamp/actor, consistent with how `blocker` and `question`
 * events already work.
 */
export async function derivePreReviewGateInput(missionId: string): Promise<PreReviewGateInput> {
  const [events, reports] = await Promise.all([
    getMissionEvents(missionId),
    getReportsByMission(missionId),
  ]);

  return {
    hasTestEvidence: events.some((e) => e.eventType === TEST_EVIDENCE_EVENT),
    hasRollbackPlan: events.some((e) => e.eventType === ROLLBACK_PLAN_EVENT),
    hasSecurityReview: events.some((e) => e.eventType === SECURITY_REVIEW_EVENT),
    hasMigrationNotes: events.some((e) => e.eventType === MIGRATION_NOTES_EVENT),
    hasHermesVerdict: reports.some((r) => r.agent === "hermes"),
  };
}

export async function getMissionGate(missionId: string): Promise<PreReviewGateResult> {
  const input = await derivePreReviewGateInput(missionId);
  return evaluatePreReviewGate(input);
}

export async function generateCtoReviewPackageMarkdown(mission: MissionRecord): Promise<string> {
  const [reports, events, decisionsAudit, briefs, gateInput] = await Promise.all([
    getReportsByMission(mission.id),
    getMissionEvents(mission.id),
    getDecisionsByMission(mission.id),
    getCtoBriefsByMission(mission.id),
    derivePreReviewGateInput(mission.id),
  ]);

  const gate = evaluatePreReviewGate(gateInput);
  const recommendation = computeRecommendation({
    pendingReports: reports.filter((r) => r.status === "submitted").length,
    reportsNeedingRevision: reports.filter((r) => r.status === "reviewed").length,
    openBlockers: events.filter((e) => e.eventType === "blocker").length,
    unresolvedRisks: reports.filter((r) => r.risks && r.status !== "actioned").length,
  });

  return buildCtoReviewPackage({
    mission,
    reports,
    events,
    decisions: decisionsAudit,
    briefs,
    gate,
    recommendation,
    generatedAtIso: new Date().toISOString(),
  });
}
