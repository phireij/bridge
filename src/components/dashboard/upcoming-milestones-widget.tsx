import { Flag } from "lucide-react";

import { getMilestones } from "@/lib/data";
import { Progress } from "@/components/ui/progress";
import { WidgetCard } from "@/components/dashboard/widget-card";
import { StatusBadge } from "@/components/shared/status-badge";

export async function UpcomingMilestonesWidget() {
  const milestones = (await getMilestones()).slice(0, 4);

  return (
    <WidgetCard title="Upcoming Milestones" icon={Flag}>
      <ul className="space-y-4">
        {milestones.map((m) => (
          <li key={m.id} className="flex items-start gap-3">
            <div className="flex w-12 shrink-0 flex-col items-center rounded-lg border bg-muted/40 px-1 py-1.5 text-center">
              <span className="text-[10px] text-muted-foreground uppercase">
                {m.date.split(" ")[0]}
              </span>
              <span className="text-sm font-semibold leading-none">
                {m.date.split(" ")[1]}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{m.title}</p>
                <StatusBadge
                  status={m.status}
                  className="ml-auto shrink-0 text-[10px]"
                />
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {m.description}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Progress value={m.progress} className="h-1.5" />
                <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                  {m.progress}%
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </WidgetCard>
  );
}
