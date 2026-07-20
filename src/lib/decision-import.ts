/**
 * CTO Decision Import parser (Mission #004A).
 *
 * Deterministic, labeled-field parsing — never opaque AI parsing for a
 * critical decision (per the mission's Integration Rules). The CEO pastes
 * the CTO's ChatGPT response in whatever labeled format the CTO's mission
 * documents already use (see Mission #003A/#004 CTO briefs and playbooks,
 * which use exactly this "Label: value" convention). This function only
 * recognizes explicit labels; anything it can't confidently map is left
 * blank and flagged as a warning so a human reviews it before saving —
 * never silently guessed.
 *
 * Recognized labels (case-insensitive, colon-delimited, one field can span
 * multiple lines until the next recognized label or end of text):
 *   Decision:
 *   Conditions:
 *   Risks:
 *   Required Actions:
 *   Confidence:
 *   Approval Status:  (maps to one of: approved, approved_with_conditions, rejected, pending)
 */

export type CtoApprovalStatus = "pending" | "approved" | "approved_with_conditions" | "rejected";

export interface ParsedCtoDecision {
  decision: string;
  conditions: string;
  risks: string;
  requiredActions: string;
  confidence: string;
  approvalStatus: CtoApprovalStatus;
}

export interface ParseCtoDecisionResult {
  fields: ParsedCtoDecision;
  warnings: string[];
}

const FIELD_LABELS: Array<{ key: keyof Omit<ParsedCtoDecision, "approvalStatus">; labels: string[] }> = [
  { key: "decision", labels: ["decision"] },
  { key: "conditions", labels: ["conditions"] },
  { key: "risks", labels: ["risks"] },
  { key: "requiredActions", labels: ["required actions", "required action"] },
  { key: "confidence", labels: ["confidence"] },
];

const APPROVAL_LABELS = ["approval status", "approval"];

function normalizeApprovalStatus(raw: string): CtoApprovalStatus | null {
  const value = raw.trim().toLowerCase();
  if (!value) return null;
  if (value.includes("condition")) return "approved_with_conditions";
  if (value.includes("reject") || value.includes("no go") || value.includes("no-go")) return "rejected";
  if (value.includes("approve") || value.includes("go")) return "approved";
  if (value.includes("pending")) return "pending";
  return null;
}

/**
 * Splits raw pasted text into "Label: rest of line + following lines until
 * next label" blocks, matching against the known labels above. Line-based
 * and regex-based only — no model call, fully auditable by reading this file.
 */
export function parseCtoDecisionText(raw: string): ParseCtoDecisionResult {
  const fields: ParsedCtoDecision = {
    decision: "",
    conditions: "",
    risks: "",
    requiredActions: "",
    confidence: "",
    approvalStatus: "pending",
  };
  const warnings: string[] = [];

  const lines = raw.split(/\r?\n/);
  const allLabels = [...FIELD_LABELS.flatMap((f) => f.labels), ...APPROVAL_LABELS];
  const labelPattern = new RegExp(
    `^\\s*(${allLabels.map((l) => l.replace(/\s+/g, "\\s+")).join("|")})\\s*:\\s*(.*)$`,
    "i",
  );

  let currentKey: keyof ParsedCtoDecision | "approvalStatus" | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (!currentKey) return;
    const text = buffer.join("\n").trim();
    if (currentKey === "approvalStatus") {
      const status = normalizeApprovalStatus(text);
      if (status) {
        fields.approvalStatus = status;
      } else if (text) {
        warnings.push(`Could not map Approval Status value "${text}" — left as pending; review manually.`);
      }
    } else {
      fields[currentKey] = text;
    }
    buffer = [];
  };

  for (const line of lines) {
    const match = line.match(labelPattern);
    if (match) {
      flush();
      const labelText = match[1].toLowerCase();
      const rest = match[2] ?? "";
      const fieldDef = FIELD_LABELS.find((f) => f.labels.includes(labelText));
      currentKey = fieldDef ? fieldDef.key : "approvalStatus";
      buffer = rest ? [rest] : [];
    } else if (currentKey) {
      buffer.push(line);
    }
  }
  flush();

  if (!fields.decision) {
    warnings.push("No \"Decision:\" field found — this pasted text may not be a CTO decision response.");
  }
  if (fields.approvalStatus === "pending" && !warnings.some((w) => w.includes("Approval Status"))) {
    warnings.push("No \"Approval Status:\" field found — defaulted to pending; set it manually before confirming.");
  }

  return { fields, warnings };
}
