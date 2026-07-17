import { Brain } from "lucide-react";

import { getDecisions } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { WidgetCard } from "@/components/dashboard/widget-card";

export async function RecentDecisionsWidget() {
  const decisions = (await getDecisions()).slice(0, 4);

  return (
    <WidgetCard title="Recent Decisions" icon={Brain} href="/memory">
      <ol className="relative space-y-4 border-l pl-5">
        {decisions.map((d) => (
          <li key={d.id} className="relative">
            <span className="absolute top-1 -left-[1.42rem] size-2.5 rounded-full border-2 border-card bg-muted-foreground/40" />
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{d.title}</p>
              <Badge variant="secondary" className="ml-auto shrink-0 text-[10px]">
                {d.category}
              </Badge>
            </div>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
              {d.summary}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground/80">
              {d.owner} · {d.date}
            </p>
          </li>
        ))}
      </ol>
    </WidgetCard>
  );
}
