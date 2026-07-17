import { Rocket } from "lucide-react";

import { getSprint } from "@/lib/data";
import { Progress } from "@/components/ui/progress";
import { WidgetCard } from "@/components/dashboard/widget-card";
import { StatusDot } from "@/components/shared/status-badge";
import { labelize } from "@/lib/status";

export async function CurrentSprintWidget() {
  const sprint = await getSprint();

  return (
    <WidgetCard
      title="Current Sprint"
      icon={Rocket}
      href="/cto"
      action={
        <span className="text-xs text-muted-foreground">
          {sprint.daysRemaining}d left
        </span>
      }
    >
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">{sprint.name}</p>
            <span className="text-xs text-muted-foreground tabular-nums">
              {sprint.completedPoints}/{sprint.committedPoints} pts
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{sprint.goal}</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {sprint.startDate} – {sprint.endDate}
            </span>
            <span className="font-medium tabular-nums">{sprint.progress}%</span>
          </div>
          <Progress value={sprint.progress} className="h-2" />
        </div>

        <ul className="space-y-2">
          {sprint.tasks.slice(0, 4).map((task) => (
            <li key={task.id} className="flex items-center gap-2.5 text-sm">
              <StatusDot status={task.state} />
              <span className="min-w-0 flex-1 truncate">{task.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {labelize(task.state)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </WidgetCard>
  );
}
