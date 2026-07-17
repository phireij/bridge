import { cn } from "@/lib/utils";
import type { Trend } from "@/lib/data/types";
import { Card } from "@/components/ui/card";
import { TrendPill } from "@/components/shared/trend-pill";

export interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  trend?: Trend;
  hint?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  trend,
  hint,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("gap-0 p-5", className)}>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </span>
        {change && trend ? <TrendPill trend={trend}>{change}</TrendPill> : null}
      </div>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </Card>
  );
}
