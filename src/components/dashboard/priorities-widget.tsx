import { CircleCheckBig, CircleDashed, LoaderCircle, Target } from "lucide-react";

import { getPriorities } from "@/lib/data";
import type { WorkState } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { WidgetCard } from "@/components/dashboard/widget-card";

const STATE_ICON = {
  done: { icon: CircleCheckBig, className: "text-emerald-500" },
  in_progress: { icon: LoaderCircle, className: "text-sky-500" },
  review: { icon: LoaderCircle, className: "text-amber-500" },
  todo: { icon: CircleDashed, className: "text-muted-foreground/60" },
} satisfies Record<WorkState, { icon: typeof Target; className: string }>;

const LEVEL_LABEL = {
  high: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-300",
  medium: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  low: "border-border bg-muted text-muted-foreground",
} as const;

export async function PrioritiesWidget() {
  const priorities = await getPriorities();

  return (
    <WidgetCard
      title="Today's Priorities"
      icon={Target}
      action={
        <span className="text-xs text-muted-foreground">
          {priorities.filter((p) => p.state !== "done").length} open
        </span>
      }
      contentClassName="p-0"
    >
      <ul className="divide-y">
        {priorities.map((p) => {
          const { icon: Icon, className } = STATE_ICON[p.state];
          return (
            <li key={p.id} className="flex items-start gap-3 px-5 py-3">
              <Icon className={cn("mt-0.5 size-4 shrink-0", className)} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      "truncate text-sm font-medium",
                      p.state === "done" && "text-muted-foreground line-through",
                    )}
                  >
                    {p.title}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn("ml-auto shrink-0 text-[10px]", LEVEL_LABEL[p.level])}
                  >
                    {p.level}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {p.detail}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground/80">
                  {p.owner} · {p.due}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </WidgetCard>
  );
}
