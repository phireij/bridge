import type { Metadata } from "next";

import { getDepartments, getMissionEvents, getMissions, getWorkforceStatus } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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

export const metadata: Metadata = { title: "Mission Control" };

const STATUS_BADGE = {
  active: "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  blocked: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  complete: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  archived: "border-border bg-muted text-muted-foreground",
} as const;

export default async function MissionControlPage() {
  const [missions, departments, workforce] = await Promise.all([
    getMissions(),
    getDepartments(),
    getWorkforceStatus(),
  ]);
  const active = missions.find((m) => m.status === "active") ?? missions[0] ?? null;
  const timeline = active ? await getMissionEvents(active.id) : [];
  const blockers = timeline.filter((e) => e.eventType === "blocker");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Every mission, one view"
        title="Mission Control"
        description="Owner, phase, progress, blockers, and the full history — for every mission running through Bridge."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Missions" value={String(missions.length)} hint="tracked in Bridge" />
        <StatCard
          label="Active"
          value={String(missions.filter((m) => m.status === "active").length)}
          hint="in progress"
        />
        <StatCard
          label="Blocked"
          value={String(missions.filter((m) => m.status === "blocked").length)}
          hint="needs attention"
        />
        <StatCard label="Open blockers" value={String(blockers.length)} hint="on the active mission" />
      </div>

      {active ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>
                Mission #{active.code} — {active.title}
              </CardTitle>
              <Badge variant="outline" className={STATUS_BADGE[active.status]}>
                {active.status}
              </Badge>
            </div>
            <CardDescription>
              Owner: {active.owner} · Phase: {active.phase}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span className="font-medium tabular-nums">{active.progress}%</span>
              </div>
              <Progress value={active.progress} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Next action</p>
                <p className="mt-1 text-sm font-medium">{active.nextAction ?? "—"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Latest decision</p>
                <p className="mt-1 text-sm font-medium">{active.latestDecision ?? "No decision yet"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Blockers</p>
                <p className="mt-1 text-sm font-medium">
                  {blockers.length === 0 ? "None open" : `${blockers.length} open`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-6 text-sm text-muted-foreground">
          No missions yet — add a row to the missions table to see it here.
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Departments</CardTitle>
          <CardDescription>
            First-class organizational units — every mission and workforce record belongs to one.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {departments.map((dept) => (
            <div key={dept.id} className="rounded-lg border p-3">
              <p className="text-sm font-semibold">{dept.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{dept.description}</p>
              <p className="mt-2 text-[11px] font-medium text-muted-foreground">
                {workforce.filter((w) => w.departmentName === dept.name).length} member
                {workforce.filter((w) => w.departmentName === dept.name).length === 1 ? "" : "s"}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All missions</CardTitle>
          <CardDescription>Every mission ever tracked in Bridge, most recently updated first.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mission</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {missions.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">
                    #{m.code} — {m.title}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{m.owner}</TableCell>
                  <TableCell className="text-muted-foreground">{m.phase}</TableCell>
                  <TableCell className="tabular-nums">{m.progress}%</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className={STATUS_BADGE[m.status]}>
                      {m.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {active ? (
        <Card>
          <CardHeader>
            <CardTitle>Mission history — #{active.code}</CardTitle>
            <CardDescription>Every recorded event, most recent first.</CardDescription>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events recorded yet.</p>
            ) : (
              <ol className="relative space-y-5 border-l pl-6">
                {timeline.map((event) => (
                  <li key={event.id} className="relative">
                    <span className="absolute top-1 -left-[1.7rem] size-3 rounded-full border-2 border-card bg-primary/60" />
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] uppercase">
                        {event.eventType}
                      </Badge>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-foreground/90">{event.description}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground/80">— {event.actor}</p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
