import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { InboxItem } from "@/lib/data/types";

/**
 * The single, standardized card every CEO Inbox approval renders through
 * (Mission #002A-4). One shape, one visual language, regardless of which
 * agent or mission the underlying report came from — source, mission,
 * priority, status, timestamp, and the recommended action are always in
 * the same place.
 */

const LEVEL_BADGE = {
  high: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-300",
  medium: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  low: "border-border bg-muted text-muted-foreground",
} as const;

const LEVEL_LABEL = {
  high: "High priority",
  medium: "Medium priority",
  low: "Low priority",
} as const;

export function DecisionCard({
  item,
  actions,
}: {
  item: InboxItem;
  /** Rendered inside the card, below the recommended-decision line — the
   * Approve / Reject / Request-revision controls for this report. */
  actions?: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        "flex flex-col gap-3 p-4 sm:p-5",
        item.unread && "border-l-2 border-l-rose-500",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={cn("text-[10px]", LEVEL_BADGE[item.level])}>
          {LEVEL_LABEL[item.level]}
        </Badge>
        {item.mission ? (
          <Badge variant="secondary" className="text-[10px]">
            Mission #{item.mission}
          </Badge>
        ) : null}
        <span className="ml-auto text-xs text-muted-foreground">
          {new Date(item.time).toLocaleString()}
        </span>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Source: {item.from}</p>
      </div>

      <p className="text-sm text-foreground/90">{item.preview}</p>

      {actions}
    </Card>
  );
}
