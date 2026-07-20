import { Badge } from "@/components/ui/badge";
import type { MissionTimelineEntry } from "@/lib/data/types";

const KIND_LABEL: Record<MissionTimelineEntry["kind"], string> = {
  report: "Report",
  event: "Event",
  decision: "Decision",
  brief: "CTO Brief",
  cto_decision_import: "CTO Decision",
};

/**
 * The Mission Timeline (Mission #004A): every submitted report, review,
 * decision, revision, and approval, in chronological order, with an audit
 * reference for each entry — composed from existing tables, not a new one.
 */
export function MissionTimeline({ entries }: { entries: MissionTimelineEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-xs text-muted-foreground">No timeline entries yet for this mission.</p>;
  }

  return (
    <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
      {entries.map((entry) => (
        <div key={entry.id} className="rounded-lg border p-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="secondary" className="text-[10px] uppercase">
              {KIND_LABEL[entry.kind]}
            </Badge>
            <span className="text-muted-foreground">
              {new Date(entry.createdAt).toLocaleString()}
            </span>
          </div>
          <p className="mt-1">{entry.summary}</p>
          <p className="mt-1 text-muted-foreground">
            — {entry.actor} · <span className="font-mono">{entry.auditRef}</span>
          </p>
        </div>
      ))}
    </div>
  );
}
