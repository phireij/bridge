import type { Metadata } from "next";

import { getWorkforceStatus } from "@/lib/data";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card } from "@/components/ui/card";
import { StatusDot } from "@/components/shared/status-badge";

export const metadata: Metadata = { title: "AI Workforce" };

export default async function WorkforcePage() {
  const workforce = await getWorkforceStatus();
  const active = workforce.filter((w) => w.status === "active").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Your team"
        title="AI Workforce"
        description="Real operational state for CEO, CTO, HyperAgent, and Hermes — bound to their own authenticated accounts, not a seeded roster."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active" value={`${active} / ${workforce.length}`} hint="right now" />
        <StatCard
          label="Last activity"
          value={
            workforce.length === 0
              ? "—"
              : new Date(
                  Math.max(...workforce.map((w) => (w.lastActiveAt ? new Date(w.lastActiveAt).getTime() : 0))),
                ).toLocaleTimeString()
          }
          hint="most recent check-in"
        />
        <StatCard label="Roles tracked" value={String(workforce.length)} hint="in workforce_status" />
        <StatCard label="Source" value="Live" hint="bridge-hq, no seed" />
      </div>

      {workforce.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">
          No workforce records yet. HyperAgent and Hermes write their own row when they act
          (bound to their own account); the CEO can manage all rows. If you expect entries and
          see none, check that Bridge HQ Supabase env vars are configured for this environment.
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workforce.map((w) => (
            <Card key={w.id} className="gap-0 p-5">
              <div className="flex items-center gap-2">
                <StatusDot status={w.status === "active" ? "online" : "offline"} />
                <h3 className="font-semibold">{w.agentName}</h3>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{w.role}</p>

              <div className="mt-3 rounded-lg bg-muted/40 p-3">
                <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Current task
                </p>
                <p className="mt-1 text-sm text-foreground/90">{w.currentTask ?? "Idle"}</p>
              </div>

              <p className="mt-3 text-[11px] text-muted-foreground">
                Last active:{" "}
                {w.lastActiveAt ? new Date(w.lastActiveAt).toLocaleString() : "never"}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
