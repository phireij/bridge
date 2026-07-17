import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";

import { getRubyProject } from "@/lib/data";
import { formatNumber, pctOfGoal } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge, StatusDot } from "@/components/shared/status-badge";

export const metadata: Metadata = { title: "Ruby" };

export default async function RubyPage() {
  const ruby = await getRubyProject();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ruby's Cake Delights · Ichikawa, Chiba"
        title={ruby.name}
        description={ruby.description}
        actions={
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://rubyscakedelights.shop"
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit storefront <ExternalLink className="size-3.5" />
            </a>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {ruby.metrics.map((m) => (
          <StatCard
            key={m.id}
            label={m.label}
            value={m.value}
            change={m.change}
            trend={m.trend}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>Reservation System</CardTitle>
                <CardDescription>Target launch · {ruby.targetLaunch}</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold tabular-nums">
                  {ruby.overallProgress}%
                </p>
                <p className="text-xs text-muted-foreground">complete</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={ruby.overallProgress} className="h-2" />
            <div className="space-y-3">
              {ruby.phases.map((phase) => (
                <div key={phase.id} className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="min-w-0 flex-1 truncate">{phase.name}</span>
                    <StatusBadge status={phase.status} className="text-[10px]" />
                    <span className="w-9 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                      {phase.progress}%
                    </span>
                  </div>
                  <Progress value={phase.progress} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Board</CardTitle>
            <CardDescription>This sprint.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {ruby.tasks.map((task) => (
                <li key={task.id} className="flex items-center gap-2.5 text-sm">
                  <StatusDot status={task.state} />
                  <span className="min-w-0 flex-1 truncate">{task.title}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {task.owner}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Social Growth</CardTitle>
          <CardDescription>Progress toward the 20× following goal.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-3">
            {ruby.social.map((channel) => {
              const pct = pctOfGoal(channel.current, channel.goal);
              return (
                <div key={channel.id} className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-medium">{channel.network}</p>
                    <p className="text-xs text-muted-foreground">{channel.handle}</p>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-semibold tabular-nums">
                      {formatNumber(channel.current)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      / {formatNumber(channel.goal)}
                    </span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                  <p className="text-[11px] text-muted-foreground">{pct}% of goal</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
