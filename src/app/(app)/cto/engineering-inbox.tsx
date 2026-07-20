import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EngineeringInboxRow } from "@/lib/data/types";

/**
 * The Engineering Inbox (Mission #004A): one mission-centered view of
 * HyperAgent, Hermes, CTO, and CEO status, blockers, timestamps, and next
 * owner — so the CEO stops manually compiling "who's waiting on what."
 */
export function EngineeringInbox({ rows }: { rows: EngineeringInboxRow[] }) {
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div
          key={row.role}
          className={cn(
            "flex flex-wrap items-center gap-3 rounded-lg border p-3 text-xs",
            row.nextOwner && "border-l-2 border-l-sky-500",
          )}
        >
          <span className="w-20 shrink-0 font-semibold">{row.roleLabel}</span>
          <Badge variant="outline" className="text-[10px] uppercase">
            {row.status}
          </Badge>
          {row.blocker ? (
            <span className="text-rose-600 dark:text-rose-400">Blocker: {row.blocker}</span>
          ) : null}
          <span className="ml-auto text-muted-foreground">
            {row.lastUpdate ? new Date(row.lastUpdate).toLocaleString() : "—"}
          </span>
          {row.nextOwner ? (
            <Badge className="text-[10px] uppercase">Next owner</Badge>
          ) : null}
        </div>
      ))}
    </div>
  );
}
