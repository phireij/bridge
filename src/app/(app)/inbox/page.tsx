import type { Metadata } from "next";

import { getInbox } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { InboxActions } from "./inbox-actions-menu";

export const metadata: Metadata = { title: "CEO Inbox" };

const LEVEL_BADGE = {
  high: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-300",
  medium: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  low: "border-border bg-muted text-muted-foreground",
} as const;

export default async function InboxPage() {
  const items = await getInbox();
  const unread = items.filter((i) => i.unread).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Awaiting your call"
        title="CEO Inbox"
        description="Structured reports HyperAgent and Hermes have submitted, awaiting your decision. Every action here is written to the audit trail."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Pending" value={String(items.length)} hint="reports awaiting decision" />
        <StatCard label="Needs attention" value={String(unread)} hint="high or medium priority" />
        <StatCard
          label="Sources"
          value={String(new Set(items.map((i) => i.from.split(" ·")[0])).size)}
          hint="agents reporting in"
        />
      </div>

      {items.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">
          Inbox is empty — no reports are waiting on a decision. If you expect
          reports here and see none, check that Bridge HQ Supabase env vars
          are configured for this environment (see docs/DEPLOYMENT.md).
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card
              key={item.id}
              className={cn(
                "flex flex-col gap-2 p-4 sm:p-5",
                item.unread && "border-l-2 border-l-rose-500",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <Badge variant="outline" className={cn("text-[10px]", LEVEL_BADGE[item.level])}>
                  {item.level}
                </Badge>
                {item.mission ? (
                  <Badge variant="secondary" className="text-[10px]">
                    Mission #{item.mission}
                  </Badge>
                ) : null}
                <span className="ml-auto text-xs text-muted-foreground">{item.time}</span>
              </div>
              <p className="text-xs text-muted-foreground">{item.from}</p>
              <p className="text-sm text-foreground/90">{item.preview}</p>
              {item.reportId ? <InboxActions reportId={item.reportId} /> : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
