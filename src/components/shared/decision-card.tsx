import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { RECOMMENDATION_LABEL, type Recommendation } from "@/lib/recommendation";
import type { InboxItem } from "@/lib/data/types";

/**
 * The single, standardized card every CEO Inbox approval renders through
 * (Mission #002A-4; extended to v2 in Mission #003A). One shape, one visual
 * language, regardless of which agent or mission the underlying report
 * came from — source, mission, priority, status, timestamp, the Engine's
 * recommendation, and the recommended action are always in the same place.
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

const RECOMMENDATION_BADGE: Record<Recommendation, string> = {
  go: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  go_with_conditions: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  no_go: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

export function DecisionCard({
  item,
  actions,
  recommendation,
}: {
  item: InboxItem;
  /** Rendered inside the card, below the recommended-decision line — the
   * Approve / Reject / Request-revision controls for this report. */
  actions?: React.ReactNode;
  /** Mission #003A — the Recommendation Engine's verdict for this report,
   * when known. Purely additive: omit for any card that doesn't have one. */
  recommendation?: Recommendation;
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
        {recommendation ? (
          <Badge variant="outline" className={cn("text-[10px]", RECOMMENDATION_BADGE[recommendation])}>
            {RECOMMENDATION_LABEL[recommendation]}
          </Badge>
        ) : null}
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
