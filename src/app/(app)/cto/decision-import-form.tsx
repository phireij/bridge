"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseCtoDecisionText, type CtoApprovalStatus } from "@/lib/decision-import";
import { importCtoDecision } from "./review-actions";

const APPROVAL_OPTIONS: { value: CtoApprovalStatus; label: string }[] = [
  { value: "approved", label: "Approved" },
  { value: "approved_with_conditions", label: "Approved with conditions" },
  { value: "rejected", label: "Rejected" },
  { value: "pending", label: "Pending" },
];

/**
 * CTO Decision Import (Mission #004A). Two-step, human-in-the-loop by
 * design: paste -> deterministic parse preview (editable) -> explicit
 * "Confirm & Save" before anything is written. Nothing here auto-approves,
 * auto-merges, or auto-deploys — it only records what the CTO said.
 */
export function DecisionImportForm({
  missionId,
  ctoBriefId,
}: {
  missionId: string;
  ctoBriefId?: string | null;
}) {
  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState<{
    decision: string;
    conditions: string;
    risks: string;
    requiredActions: string;
    confidence: string;
    approvalStatus: CtoApprovalStatus;
  } | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handlePreview() {
    setError(null);
    const result = parseCtoDecisionText(raw);
    setParsed(result.fields);
    setWarnings(result.warnings);
  }

  function handleConfirm() {
    if (!parsed) return;
    setError(null);
    startTransition(async () => {
      try {
        await importCtoDecision({
          missionId,
          ctoBriefId: ctoBriefId ?? null,
          rawText: raw,
          confirmed: parsed,
        });
        setSaved(true);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to import the CTO decision.");
      }
    });
  }

  if (saved) {
    return <p className="text-sm text-emerald-600 dark:text-emerald-400">CTO decision imported and recorded on the mission timeline.</p>;
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="cto-decision-raw" className="text-xs">
          Paste the CTO&apos;s reply
        </Label>
        <Textarea
          id="cto-decision-raw"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={"Decision: ...\nConditions: ...\nRisks: ...\nRequired Actions: ...\nConfidence: ...\nApproval Status: ..."}
          className="mt-1 h-40 text-xs"
        />
      </div>
      <Button size="sm" variant="outline" onClick={handlePreview} disabled={!raw.trim()}>
        Parse & Preview
      </Button>

      {parsed ? (
        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-xs font-medium text-muted-foreground">
            Review and edit before saving — nothing is written until you confirm.
          </p>
          {warnings.map((w, i) => (
            <p key={i} className="text-xs text-amber-600 dark:text-amber-400">
              ⚠ {w}
            </p>
          ))}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Decision</Label>
              <Input
                value={parsed.decision}
                onChange={(e) => setParsed({ ...parsed, decision: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Approval Status</Label>
              <Select
                value={parsed.approvalStatus}
                onValueChange={(v) => setParsed({ ...parsed, approvalStatus: v as CtoApprovalStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPROVAL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Conditions</Label>
              <Input
                value={parsed.conditions}
                onChange={(e) => setParsed({ ...parsed, conditions: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Confidence</Label>
              <Input
                value={parsed.confidence}
                onChange={(e) => setParsed({ ...parsed, confidence: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Risks</Label>
              <Input
                value={parsed.risks}
                onChange={(e) => setParsed({ ...parsed, risks: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Required Actions</Label>
              <Input
                value={parsed.requiredActions}
                onChange={(e) => setParsed({ ...parsed, requiredActions: e.target.value })}
              />
            </div>
          </div>
          <Button size="sm" disabled={pending} onClick={handleConfirm}>
            {pending ? "Saving…" : "Confirm & Save"}
          </Button>
        </div>
      ) : null}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
