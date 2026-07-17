import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Trend } from "@/lib/data/types";

const TREND = {
  up: { icon: ArrowUpRight, className: "text-emerald-600 dark:text-emerald-400" },
  down: { icon: ArrowDownRight, className: "text-rose-600 dark:text-rose-400" },
  flat: { icon: Minus, className: "text-muted-foreground" },
} as const;

export function TrendPill({
  trend,
  children,
  className,
}: {
  trend: Trend;
  children: React.ReactNode;
  className?: string;
}) {
  const { icon: Icon, className: tone } = TREND[trend];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
        tone,
        className,
      )}
    >
      <Icon className="size-3.5" />
      {children}
    </span>
  );
}
