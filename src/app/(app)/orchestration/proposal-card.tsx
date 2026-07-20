"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { approveProposal, generateCtoProposal, rejectProposal } from "./actions";
import type { CeoRequestRecord, CtoProposalRecord } from "@/lib/data/types";

const STATUS_BADGE: Record<CeoRequestRecord["status"], string> = {
  submitted: "border-border bg-muted text-muted-foreground",
  analyzing: "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  proposed: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  approved: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  delegated: "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  in_progress: "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  completed: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

/**
 * One CEO request + its latest Bridge CTO Agent proposal (if any), with
 * the CEO's approve/reject controls. Mirrors the Decision Card pattern used
 * across Bridge — same visual language for "here is an AI's recommendation,
 * here is what you can do about it."
 */
export function ProposalCard({
  request,
  proposal,
  isCeo,
}: {
  request: CeoRequestRecord;
  proposal: CtoProposalRecord | null;
  isCeo: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleApprove() {
    if (!proposal) return;
    setError(null);
    startTransition(async () => {
      try {
        await approveProposal(request.id, proposal.id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to approve.");
      }
    });
  }

  function handleReject() {
    setError(null);
    startTransition(async () => {
      try {
        await rejectProposal(request.id, notes || undefined);
        setRejecting(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to reject.");
      }
    });
  }

  function handleRetryAnalysis() {
    setError(null);
    startTransition(async () => {
      try {
        await generateCtoProposal(request.id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Bridge CTO Agent analysis failed again.");
      }
    });
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold">{request.title}</p>
        <Badge variant="outline" className={`text-[10px] uppercase ${STATUS_BADGE[request.status]}`}>
          {request.status.replace(/_/g, " ")}
        </Badge>
        {request.missionCode ? (
          <Badge variant="secondary" className="text-[10px]">
            Mission #{request.missionCode}
          </Badge>
        ) : null}
        <span className="ml-auto text-xs text-muted-foreground">
          {new Date(request.createdAt).toLocaleString()}
        </span>
      </div>
      <p className="mt-2 text-xs text-foreground/90">{request.rawText}</p>

      {proposal ? (
        <div className="mt-3 rounded-md border bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold">Bridge CTO Agent proposal</p>
            <Badge variant="outline" className="text-[10px] uppercase">
              {proposal.provider} · {proposal.model}
            </Badge>
            {proposal.estimatedCostUsd != null ? (
              <span className="text-[11px] text-muted-foreground">
                ~${proposal.estimatedCostUsd.toFixed(4)}
              </span>
            ) : null}
          </div>
          <pre className="mt-1.5 whitespace-pre-wrap text-xs text-foreground/90">{proposal.proposalText}</pre>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Recommends delegating to <strong>{proposal.recommendedDelegation}</strong>.
          </p>
        </div>
      ) : request.status === "submitted" || request.status === "analyzing" ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {request.status === "analyzing" ? "Bridge CTO Agent is analyzing…" : "Waiting on Bridge CTO Agent analysis."}
        </p>
      ) : null}

      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}

      {isCeo && proposal && request.status === "proposed" ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" disabled={pending} onClick={handleApprove}>
            Approve &amp; delegate
          </Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => setRejecting((v) => !v)}>
            Reject
          </Button>
        </div>
      ) : null}

      {isCeo && !proposal && request.status === "submitted" ? (
        <div className="mt-3">
          <Button size="sm" variant="outline" disabled={pending} onClick={handleRetryAnalysis}>
            {pending ? "Retrying…" : "Retry Bridge CTO Agent analysis"}
          </Button>
        </div>
      ) : null}

      {rejecting ? (
        <div className="mt-3 space-y-2">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Why? (optional, recorded on the Message Bus)"
            className="h-16 text-xs"
          />
          <Button size="sm" variant="destructive" disabled={pending} onClick={handleReject}>
            Confirm reject
          </Button>
        </div>
      ) : null}
    </div>
  );
}
