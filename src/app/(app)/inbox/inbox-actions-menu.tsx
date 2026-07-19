"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { approveReport, rejectReport, requestRevision } from "./actions";

export function InboxActions({ reportId }: { reportId: string }) {
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState<null | "reject" | "request_revision">(null);
  const [done, setDone] = useState<string | null>(null);

  if (done) {
    return <p className="mt-3 text-xs font-medium text-muted-foreground">{done}</p>;
  }

  function handleApprove() {
    startTransition(async () => {
      await approveReport(reportId);
      setDone("Approved.");
    });
  }

  function handleConfirm(kind: "reject" | "request_revision") {
    startTransition(async () => {
      if (kind === "reject") {
        await rejectReport(reportId, notes || undefined);
        setDone("Rejected.");
      } else {
        await requestRevision(reportId, notes || undefined);
        setDone("Revision requested.");
      }
    });
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={pending} onClick={handleApprove}>
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => setShowNotes(showNotes === "request_revision" ? null : "request_revision")}
        >
          Request revision
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => setShowNotes(showNotes === "reject" ? null : "reject")}
        >
          Reject
        </Button>
      </div>
      {showNotes ? (
        <div className="space-y-2">
          <Textarea
            placeholder="Optional notes for the audit trail…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-16 text-sm"
          />
          <Button size="sm" disabled={pending} onClick={() => handleConfirm(showNotes)}>
            Confirm {showNotes === "reject" ? "reject" : "request revision"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
