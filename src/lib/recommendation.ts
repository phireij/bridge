/**
 * The CTO Office Recommendation Engine (Mission #003A).
 *
 * Deliberately a plain, deterministic function — not a database table, not
 * a model call. Every rule here is readable in this file and covered by the
 * types below; there is nothing "smart" hiding in data. That's the point:
 * auditability over cleverness. If future missions need more nuance, extend
 * the rules here and the reasoning stays inspectable in one place.
 */

export type Recommendation = "go" | "go_with_conditions" | "no_go";

export interface RecommendationInput {
  /** Reports still awaiting a CEO decision (status = 'submitted'). */
  pendingReports: number;
  /** Reports the CEO sent back for changes (status = 'reviewed', i.e. request_revision or reject). */
  reportsNeedingRevision: number;
  /** Mission events of type 'blocker' that haven't been resolved. */
  openBlockers: number;
  /** Any report whose `risks` field is non-empty and still pending/needs-revision. */
  unresolvedRisks: number;
}

export interface RecommendationResult {
  recommendation: Recommendation;
  rationale: string;
}

/**
 * Rules, in priority order:
 * 1. Any open blocker -> NO GO. A blocker is, by definition, something that
 *    stops the mission; nothing else matters until it's cleared.
 * 2. Any report sent back for revision, or any unresolved documented risk
 *    -> GO WITH CONDITIONS. The work is real but has a known open item.
 * 3. Otherwise, if there's anything still pending a decision -> GO WITH
 *    CONDITIONS (can't certify something nobody has signed off on yet).
 * 4. Clean state -> GO.
 */
export function computeRecommendation(input: RecommendationInput): RecommendationResult {
  const { pendingReports, reportsNeedingRevision, openBlockers, unresolvedRisks } = input;

  if (openBlockers > 0) {
    return {
      recommendation: "no_go",
      rationale: `${openBlockers} open blocker${openBlockers === 1 ? "" : "s"} on this mission — resolve before proceeding.`,
    };
  }

  if (reportsNeedingRevision > 0 || unresolvedRisks > 0) {
    const parts: string[] = [];
    if (reportsNeedingRevision > 0) parts.push(`${reportsNeedingRevision} report(s) sent back for revision`);
    if (unresolvedRisks > 0) parts.push(`${unresolvedRisks} unresolved documented risk(s)`);
    return {
      recommendation: "go_with_conditions",
      rationale: `${parts.join(" and ")} — proceed once addressed.`,
    };
  }

  if (pendingReports > 0) {
    return {
      recommendation: "go_with_conditions",
      rationale: `${pendingReports} report(s) still awaiting a CEO decision.`,
    };
  }

  return {
    recommendation: "go",
    rationale: "No open blockers, no unresolved risks, nothing pending decision.",
  };
}

export const RECOMMENDATION_LABEL: Record<Recommendation, string> = {
  go: "GO",
  go_with_conditions: "GO WITH CONDITIONS",
  no_go: "NO GO",
};
