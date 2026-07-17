import type { Metadata } from "next";
import { Plus } from "lucide-react";

import { getAgents } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { AgentAvatar } from "@/components/dashboard/agent-avatar";

export const metadata: Metadata = { title: "AI Workforce" };

export default async function WorkforcePage() {
  const agents = await getAgents();
  const active = agents.filter((a) => a.status === "active").length;
  const completed = agents.reduce((sum, a) => sum + a.tasksCompleted, 0);
  const inQueue = agents.reduce((sum, a) => sum + a.tasksInQueue, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Your team"
        title="AI Workforce"
        description="The agents running the company day to day — what each one owns, and what they're working on right now."
        actions={
          <Button size="sm">
            <Plus className="size-4" /> Add agent
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active" value={`${active} / ${agents.length}`} hint="agents online" />
        <StatCard label="Tasks Completed" value={formatNumber(completed)} hint="all time" />
        <StatCard label="In Queue" value={String(inQueue)} hint="right now" />
        <StatCard label="Model" value="Opus 4.8" hint="across the fleet" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.id} className="gap-0 p-5">
            <div className="flex items-start gap-3">
              <AgentAvatar name={agent.name} accent={agent.accent} status={agent.status} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-semibold">{agent.name}</h3>
                  <StatusBadge status={agent.status} className="ml-auto shrink-0" />
                </div>
                <p className="truncate text-xs text-muted-foreground">{agent.role}</p>
              </div>
            </div>

            <p className="mt-3 text-sm text-muted-foreground">{agent.description}</p>

            <div className="mt-3 flex flex-wrap gap-1">
              {agent.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-[10px]">
                  {skill}
                </Badge>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-sm font-semibold tabular-nums">
                  {formatNumber(agent.tasksCompleted)}
                </p>
                <p className="text-[11px] text-muted-foreground">Done</p>
              </div>
              <div>
                <p className="text-sm font-semibold tabular-nums">{agent.tasksInQueue}</p>
                <p className="text-[11px] text-muted-foreground">Queue</p>
              </div>
              <div>
                <p className="text-sm font-semibold tabular-nums">{agent.uptime}</p>
                <p className="text-[11px] text-muted-foreground">Uptime</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-muted/40 p-3">
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Recent activity
              </p>
              <ul className="mt-2 space-y-1.5">
                {agent.recent.map((activity, index) => (
                  <li key={index} className="flex gap-2 text-xs">
                    <span className="shrink-0 font-mono text-muted-foreground">
                      {activity.time}
                    </span>
                    <span className="min-w-0 flex-1 text-foreground/90">
                      {activity.summary}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
