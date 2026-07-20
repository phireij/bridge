import type { Metadata } from "next";
import { GitBranch, GitPullRequest } from "lucide-react";

import {
  getActiveMission,
  getCtoBriefs,
  getCtoRecommendations,
  getDeployments,
  getEngineeringInbox,
  getEngineeringMemory,
  getEngineeringStandards,
  getIncidents,
  getLatestReportByAgent,
  getMissionEvents,
  getMissionTimeline,
  getPlaybooks,
  getTechStack,
} from "@/lib/data";
import { getMissionGate } from "@/lib/mission-review";
import { computeRecommendation, RECOMMENDATION_LABEL, type Recommendation } from "@/lib/recommendation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge, StatusDot } from "@/components/shared/status-badge";
import { BriefGeneratorButton } from "./brief-generator-button";
import { ReviewPackagePanel } from "./review-package-panel";
import { DecisionImportForm } from "./decision-import-form";
import { EngineeringInbox } from "./engineering-inbox";
import { MissionTimeline } from "./mission-timeline";

export const metadata: Metadata = { title: "CTO Office" };

const EFFORT_LABEL = { S: "Small", M: "Medium", L: "Large" } as const;

const RECOMMENDATION_BADGE: Record<Recommendation, string> = {
  go: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  go_with_conditions: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  no_go: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

function AgentReportCard({
  agentLabel,
  report,
}: {
  agentLabel: string;
  report: Awaited<ReturnType<typeof getLatestReportByAgent>>;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{agentLabel}</p>
        {report ? (
          <Badge variant="outline" className="text-[10px] uppercase">
            {report.status}
          </Badge>
        ) : null}
      </div>
      {report ? (
        <div className="mt-2 space-y-1.5 text-xs">
          <p className="text-foreground/90">{report.summary}</p>
          {report.risks ? (
            <p className="text-amber-600 dark:text-amber-400">Risk: {report.risks}</p>
          ) : null}
          {report.recommendation ? (
            <p className="text-muted-foreground">Recommends: {report.recommendation}</p>
          ) : null}
          <p className="text-muted-foreground">{new Date(report.createdAt).toLocaleString()}</p>
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">No reports submitted yet.</p>
      )}
    </div>
  );
}

export default async function CtoOfficePage() {
  const [
    stack,
    recommendations,
    deployments,
    incidents,
    mission,
    hyperAgentReport,
    hermesReport,
    standards,
    playbooks,
    briefs,
    engineeringMemory,
  ] = await Promise.all([
    getTechStack(),
    getCtoRecommendations(),
    getDeployments(),
    getIncidents(),
    getActiveMission(),
    getLatestReportByAgent("hyperagent"),
    getLatestReportByAgent("hermes"),
    getEngineeringStandards(),
    getPlaybooks(),
    getCtoBriefs(),
    getEngineeringMemory(),
  ]);

  const timeline = mission ? await getMissionEvents(mission.id) : [];
  const openIncidents = incidents.filter((i) => i.status !== "resolved").length;
  const successful = deployments.filter((d) => d.status === "success").length;

  // Mission #004A — Engineering Inbox, Mission Timeline, and Pre-Review Gate
  // for the active mission. All composed reads over existing tables.
  const [gate, inboxRows, missionTimelineEntries] = mission
    ? await Promise.all([
        getMissionGate(mission.id),
        getEngineeringInbox(mission.id),
        getMissionTimeline(mission.id),
      ])
    : [{ ready: false, missing: [] }, [], []];
  const missionBriefs = briefs.filter((b) => b.missionId === mission?.id);

  // Mission #003A — the Recommendation Engine's live verdict for the active
  // mission, computed from real reports/mission_events, not a canned label.
  const openBlockers = timeline.filter((e) => e.eventType === "blocker").length;
  const missionReports = [hyperAgentReport, hermesReport].filter(Boolean) as NonNullable<
    typeof hyperAgentReport
  >[];
  const missionRec = computeRecommendation({
    pendingReports: missionReports.filter((r) => r.status === "submitted").length,
    reportsNeedingRevision: missionReports.filter((r) => r.status === "reviewed").length,
    openBlockers,
    unresolvedRisks: missionReports.filter((r) => r.risks && r.status !== "actioned").length,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Engineering Headquarters"
        title="CTO Office"
        description="Current mission, live reports, the Recommendation Engine's verdict, and the standards/playbooks/memory that keep engineering decisions consistent."
      />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>
              {mission ? `Mission #${mission.code} — ${mission.title}` : "No active mission"}
            </CardTitle>
            {mission ? (
              <Badge variant="outline" className="text-[10px] uppercase">
                {mission.status}
              </Badge>
            ) : null}
            {mission ? (
              <Badge
                variant="outline"
                className={cn("text-[10px]", RECOMMENDATION_BADGE[missionRec.recommendation])}
              >
                {RECOMMENDATION_LABEL[missionRec.recommendation]}
              </Badge>
            ) : null}
            {mission ? (
              <div className="ml-auto">
                <BriefGeneratorButton missionId={mission.id} />
              </div>
            ) : null}
          </div>
          <CardDescription>
            {mission
              ? `Owner: ${mission.owner} · Phase: ${mission.phase} · Progress: ${mission.progress}% — ${missionRec.rationale}`
              : "Create a row in the missions table to see it here."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Next action</p>
                <p className="mt-1 font-medium">{mission?.nextAction ?? "—"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Release decision status</p>
                <p className="mt-1 font-medium">{mission?.latestDecision ?? "No decision yet"}</p>
              </div>
            </div>
            <AgentReportCard agentLabel="HyperAgent — latest report" report={hyperAgentReport} />
            <AgentReportCard agentLabel="Hermes — latest report" report={hermesReport} />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Engineering timeline
            </p>
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {timeline.length === 0 ? (
                <p className="text-xs text-muted-foreground">No mission events yet.</p>
              ) : (
                timeline.map((event) => (
                  <div key={event.id} className="rounded-lg border p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium uppercase text-[10px] text-muted-foreground">
                        {event.eventType}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1">{event.description}</p>
                    <p className="mt-1 text-muted-foreground">— {event.actor}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="System Uptime" value="99.9%" change="30-day" trend="up" hint="all services" />
        <StatCard label="Deploys · 7d" value={String(deployments.length)} hint={`${successful} succeeded`} />
        <StatCard label="Open Incidents" value={String(openIncidents)} hint="infrastructure" />
        <StatCard
          label="Pending decisions"
          value={String([hyperAgentReport, hermesReport].filter((r) => r?.status === "submitted").length)}
          hint="in CEO Inbox"
        />
      </div>

      {mission ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>CTO Integration & Review Automation</CardTitle>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] uppercase",
                  gate.ready
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
                )}
              >
                Pre-Review Gate: {gate.ready ? "Ready" : `Blocked (${gate.missing.length} missing)`}
              </Badge>
            </div>
            <CardDescription>
              Mission #004A — compile a real CTO Review Package, request review once the gate passes,
              import the CTO&apos;s decision with human confirmation, and see who owns the next move.
              Nothing here auto-merges, auto-deploys, or auto-approves.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="package">
              <TabsList>
                <TabsTrigger value="package">Review Package</TabsTrigger>
                <TabsTrigger value="import">Decision Import</TabsTrigger>
                <TabsTrigger value="inbox">Engineering Inbox</TabsTrigger>
                <TabsTrigger value="timeline">Mission Timeline</TabsTrigger>
              </TabsList>

              <TabsContent value="package" className="pt-4">
                <ReviewPackagePanel missionId={mission.id} />
              </TabsContent>

              <TabsContent value="import" className="pt-4">
                <DecisionImportForm
                  missionId={mission.id}
                  ctoBriefId={missionBriefs[0]?.id ?? null}
                />
              </TabsContent>

              <TabsContent value="inbox" className="pt-4">
                <EngineeringInbox rows={inboxRows} />
              </TabsContent>

              <TabsContent value="timeline" className="pt-4">
                <MissionTimeline entries={missionTimelineEntries} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Engineering Intelligence</CardTitle>
          <CardDescription>
            CTO Briefs, the Engineering Standards Library, CTO Playbooks, and Engineering Memory —
            the reusable reference layer that reduces manual coordination between the CEO, CTO,
            HyperAgent, and Hermes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="briefs">
            <TabsList>
              <TabsTrigger value="briefs">CTO Briefs</TabsTrigger>
              <TabsTrigger value="standards">Standards Library</TabsTrigger>
              <TabsTrigger value="playbooks">Playbooks</TabsTrigger>
              <TabsTrigger value="memory">Engineering Memory</TabsTrigger>
            </TabsList>

            <TabsContent value="briefs" className="space-y-3 pt-4">
              {briefs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No CTO Briefs generated yet. Use &quot;Generate CTO Brief&quot; above to produce
                  one for the active mission from its real reports and mission events.
                </p>
              ) : (
                briefs.map((b) => (
                  <div key={b.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{b.title}</p>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px]", RECOMMENDATION_BADGE[b.recommendation])}
                      >
                        {RECOMMENDATION_LABEL[b.recommendation]}
                      </Badge>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {new Date(b.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-foreground/90">{b.summary}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{b.rationale}</p>
                    {b.generatedByName ? (
                      <p className="mt-1 text-[11px] text-muted-foreground/80">
                        Generated by {b.generatedByName}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="standards" className="space-y-3 pt-4">
              {standards.map((s) => (
                <div key={s.id} className="rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{s.title}</p>
                    <Badge variant="secondary" className="text-[10px] uppercase">
                      {s.category}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">{s.content}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="playbooks" className="space-y-3 pt-4">
              {playbooks.map((p) => (
                <div key={p.id} className="rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{p.title}</p>
                    <Badge variant="secondary" className="text-[10px] uppercase">
                      {p.category}
                    </Badge>
                  </div>
                  <pre className="mt-1.5 whitespace-pre-wrap text-xs text-muted-foreground">
                    {p.steps}
                  </pre>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="memory" className="space-y-3 pt-4">
              {engineeringMemory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No engineering memory records yet.</p>
              ) : (
                engineeringMemory.map((m) => (
                  <div key={m.id} className="rounded-lg border p-4">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{m.title}</p>
                      <Badge variant="secondary" className="text-[10px]">
                        {m.category}
                      </Badge>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">{m.content}</p>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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
                    <TableCell className="text-muted-foreground">{item.category}</TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">{item.version}</TableCell>
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
              <div key={incident.id} className="flex items-start gap-3 rounded-lg border p-3">
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
            <CardDescription>Proposals from the CTO office awaiting a decision.</CardDescription>
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
                  <p className="mt-0.5 text-xs text-muted-foreground">{rec.rationale}</p>
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
