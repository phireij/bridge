import { Activity } from "lucide-react";

import { getCompanyHealth } from "@/lib/data";
import { WidgetCard } from "@/components/dashboard/widget-card";
import { TrendPill } from "@/components/shared/trend-pill";

export async function CompanyHealthWidget() {
  const metrics = (await getCompanyHealth()).slice(0, 4);

  return (
    <WidgetCard
      title="Company Health"
      icon={Activity}
      action={<span className="text-xs text-muted-foreground">Live</span>}
      contentClassName="p-0"
    >
      <div className="grid grid-cols-2 divide-x divide-y lg:grid-cols-4 lg:divide-y-0">
        {metrics.map((m) => (
          <div key={m.id} className="p-5">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {m.label}
            </p>
            <div className="mt-2 flex items-end justify-between gap-2">
              <span className="text-2xl font-semibold tracking-tight tabular-nums">
                {m.value}
              </span>
              <TrendPill trend={m.trend}>{m.change}</TrendPill>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{m.hint}</p>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
