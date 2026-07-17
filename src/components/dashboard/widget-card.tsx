import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface WidgetCardProps {
  title: string;
  icon: LucideIcon;
  /** Optional "view all" destination shown in the header. */
  href?: string;
  hrefLabel?: string;
  /** Optional element rendered on the right of the header (e.g. a count). */
  action?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}

export function WidgetCard({
  title,
  icon: Icon,
  href,
  hrefLabel = "View all",
  action,
  className,
  contentClassName,
  children,
}: WidgetCardProps) {
  return (
    <Card className={cn("gap-0 overflow-hidden py-0", className)}>
      <CardHeader className="flex flex-row items-center gap-2 border-b px-5 py-3.5 [.border-b]:pb-3.5">
        <span className="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </span>
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <div className="ml-auto flex items-center gap-2">
          {action}
          {href ? (
            <Link
              href={href}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {hrefLabel}
              <ArrowRight className="size-3.5" />
            </Link>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className={cn("p-5", contentClassName)}>{children}</CardContent>
    </Card>
  );
}
