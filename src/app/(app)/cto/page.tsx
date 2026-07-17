import type { Metadata } from "next";
import { GitBranch, GitPullRequest } from "lucide-react";

import {
  getCtoRecommendations,
  getDeployments,
  getIncidents,
  getTechStack,
} from "@/lib/data";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge, StatusDot } from "@/components/shared/status-badge";

export const metadata: Metadata = { title: "CTO Office" };

const EFFORT_LABEL = { S: "Small", M: "Medium", L: "Large" } as const;

export default async function CtoOfficePage() {
  const [stack, recommendations, deployments, incidents] = await Promise.all([
    getTechStack(),
    getCtoRecommendations(),
    getDeployments(),
    getIncidents(),
  ]);

  const openIncidents = incidents.filter((i) => i.status !== "resolved").length;
  const successful = deployments.filter((d) => d.status === "success").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Engineering"
        title="CTO Office"
        description="System health, the stack we run on, recent deployments, and the technical decisions on deck — curated by Atlas."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="System Uptime" value="99.9%" change="30-day" trend="up" hint="all services" />
        <StatCard label="Open PRs" value="1" hint="Bridge v0.1 · awaiting sign-off" />
        <StatCard label="Deploys · 7d" value={String(deployments.length)} hint={`${successful} succeeded`} />
        <StatCard label="Open Incidents" value={String(openIncidents)} hint="1 monitoring" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tech Stack</CardTitle>
            <CardDescription>Everything Bridge and the storefront run on.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Technology</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stack.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell className="font-medium">
                      {item.name}
                      <span className="block text-xs font-normal text-muted-foreground">
                        {item.note}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.category}
                    </TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">
                      {item.version}
                    </TableCell>
                    <TableCell className="text-right">
                      <StatusBadge status={item.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Incidents</CardTitle>
            <CardDescription>Last 48 hours.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {incidents.map((incident) => (
              <div
                key={incident.id}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <StatusDot status={incident.status} className="mt-1.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{incident.title}</p>
                  <p className="text-xs text-muted-foreground">{incident.time}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {incident.severity}
                  </Badge>
                  <StatusBadge status={incident.status} dot={false} className="text-[10px]" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>
              Proposals from the CTO office awaiting a decision.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{rec.title}</p>
                    <StatusBadge status={rec.status} className="text-[10px]" />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {rec.rationale}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs">
                  <Badge variant="secondary">{EFFORT_LABEL[rec.effort]}</Badge>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 font-medium",
                      rec.impact === "high"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {rec.impact} impact
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="size-4" /> Recent Deployments
            </CardTitle>
            <CardDescription>Across all projects.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {deployments.map((dep) => (
              <div key={dep.id} className="flex items-center gap-3">
                <StatusDot status={dep.status} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{dep.project}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    <span className="font-mono">{dep.version}</span> · {dep.env}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <GitPullRequest className="size-3" />
                  {dep.time}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
