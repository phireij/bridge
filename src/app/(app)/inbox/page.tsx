import type { Metadata } from "next";

import { getInbox } from "@/lib/data";
import { INBOX_KIND } from "@/lib/inbox-visuals";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";

export const metadata: Metadata = { title: "CEO Inbox" };

const LEVEL_BADGE = {
  high: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-300",
  medium: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  low: "border-border bg-muted text-muted-foreground",
} as const;

export default async function InboxPage() {
  const items = await getInbox();
  const unread = items.filter((i) => i.unread).length;
  const approvals = items.filter((i) => i.kind === "approval").length;
  const recommendations = items.filter((i) => i.kind === "recommendation").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Awaiting your call"
        title="CEO Inbox"
        description="Approvals, recommendations, and messages the workforce has routed to you."
        actions={
          <Button variant="outline" size="sm">
            Mark all read
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="In Inbox" value={String(items.length)} hint="total items" />
        <StatCard label="Unread" value={String(unread)} hint="need a look" />
        <StatCard label="Approvals" value={String(approvals)} hint="pending sign-off" />
        <StatCard label="Recommendations" value={String(recommendations)} hint="from the team" />
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const meta = INBOX_KIND[item.kind];
          return (
            <Card
              key={item.id}
              className={cn(
                "flex flex-row items-start gap-4 p-4 sm:p-5",
                item.unread && "border-l-2 border-l-rose-500",
              )}
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg",
                  meta.className,
                )}
              >
                <meta.icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px]", LEVEL_BADGE[item.level])}
                  >
                    {item.level}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground uppercase">
                    {meta.label}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {item.time}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.from}</p>
                <p className="mt-2 text-sm text-foreground/90">{item.preview}</p>
                {item.actions ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.actions.map((action, index) => (
                      <Button
                        key={action}
                        size="sm"
                        variant={index === 0 ? "default" : "outline"}
                      >
                        {action}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
