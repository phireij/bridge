/**
 * The Pre-Review Gate (Mission #004A).
 *
 * Same pattern as the Recommendation Engine (src/lib/recommendation.ts):
 * a plain, deterministic function, not a database table and not an AI call.
 * It exists to block a CTO Review request from being submitted when required
 * evidence is missing, so the CTO never receives an incomplete package.
 *
 * Every field it checks is real evidence already required by this repo's own
 * practice (see the RC1 log format and the release/security playbooks seeded
 * in Mission #003A) — this function does not invent new requirements, it
 * enforces existing ones before a review request is allowed to fire.
 */

export interface PreReviewGateInput {
  /** True once at least one test/verification note exists for the mission. */
  hasTestEvidence: boolean;
  /** True once a rollback plan has been documented (report field or mission event). */
  hasRollbackPlan: boolean;
  /** True once a security review note exists, OR the mission is explicitly marked no-security-impact. */
  hasSecurityReview: boolean;
  /** True once migration notes exist, OR the mission is explicitly marked no-schema-change. */
  hasMigrationNotes: boolean;
  /** True once Hermes has recorded a verdict (a Hermes report or mission event) for this mission. */
  hasHermesVerdict: boolean;
}

export interface PreReviewGateResult {
  ready: boolean;
  missing: string[];
}

const REQUIREMENT_LABELS: Record<keyof PreReviewGateInput, string> = {
  hasTestEvidence: "Test evidence",
  hasRollbackPlan: "Rollback plan",
  hasSecurityReview: "Security review",
  hasMigrationNotes: "Migration notes",
  hasHermesVerdict: "Hermes verdict",
};

export function evaluatePreReviewGate(input: PreReviewGateInput): PreReviewGateResult {
  const missing = (Object.keys(REQUIREMENT_LABELS) as Array<keyof PreReviewGateInput>).filter(
    (key) => !input[key],
  );

  return {
    ready: missing.length === 0,
    missing: missing.map((key) => REQUIREMENT_LABELS[key]),
  };
}
