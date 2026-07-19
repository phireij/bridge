import type { Metadata } from "next";

import { getInbox } from "@/lib/data";
import { computeRecommendation } from "@/lib/recommendation";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { DecisionCard } from "@/components/shared/decision-card";
import { InboxActions } from "./inbox-actions-menu";

export const metadata: Metadata = { title: "CEO Inbox" };

export default async function InboxPage() {
  const items = await getInbox();
  const unread = items.filter((i) => i.unread).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Awaiting your call"
        title="CEO Inbox"
        description="Every HyperAgent and Hermes report awaiting your decision, as a standardized Decision Card. Every action here is written to the audit trail."
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
          {items.map((item) => {
            // Mission #003A — Decision Card v2: a lightweight, per-report
            // pass through the same Recommendation Engine used for CTO
            // Briefs (src/lib/recommendation.ts), so every card also shows
            // what the Engine would say about it in isolation.
            const { recommendation } = computeRecommendation({
              pendingReports: 1,
              reportsNeedingRevision: 0,
              openBlockers: 0,
              unresolvedRisks: item.level === "high" ? 1 : 0,
            });
            return (
              <DecisionCard
                key={item.id}
                item={item}
                recommendation={recommendation}
                actions={item.reportId ? <InboxActions reportId={item.reportId} /> : null}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
