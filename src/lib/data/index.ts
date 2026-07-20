/**
 * Data-access layer for Bridge.
 *
 * Every page and widget reads the company's state through these functions —
 * never by importing seed files directly. Most still return seeded data
 * (defined in the sibling files); the Bridge Lite Operational HQ getters
 * below (Mission #002A) read live Supabase data from the dedicated
 * `bridge-hq` project instead — see AGENTS.md for the project map.
 *
 * The function signatures — and therefore the entire UI — stay identical
 * whether a getter is seed- or Supabase-backed.
 */
import { company, companyValues } from "./company";
import { companyHealth } from "./health";
import { decisions } from "./decisions";
import { milestones, priorities, sprint } from "./operations";
import { agents } from "./workforce";
import { ctoRecommendations, deployments, incidents, techStack } from "./cto";
import { services, vpsResources } from "./infrastructure";
import { ruby } from "./ruby";
import { createBridgeServerClient } from "@/lib/supabase/bridge-server";
import type {
  CompanyMemoryRecord,
  CtoBriefRecord,
  CtoDecisionImportRecord,
  DecisionRecord,
  DepartmentRecord,
  EngineeringInboxRow,
  EngineeringStandardRecord,
  InboxItem,
  MissionEventRecord,
  MissionRecord,
  MissionTimelineEntry,
  PlaybookRecord,
  ReportRecord,
  WorkforceStatusRecord,
} from "./types";

export * from "./types";

// ── Company ────────────────────────────────────────────────────────────────
export async function getCompany() {
  return company;
}
export async function getCompanyValues() {
  return companyValues;
}

// ── Headquarters ─────────────────────────────────────────────────────────────
export async function getPriorities() {
  return priorities;
}
export async function getCompanyHealth() {
  return companyHealth;
}
export async function getSprint() {
  return sprint;
}
export async function getMilestones() {
  return milestones;
}

// ── CEO Inbox (Bridge Lite HQ — live) ───────────────────────────────────────
// Pending reports become inbox items. If bridge-hq isn't configured yet
// (local dev, or a preview without env vars), fail safe to an empty inbox
// rather than throwing — never fall back to fictional seed items here.
export async function getInbox(): Promise<InboxItem[]> {
  const reports = await getReports();
  return reports
    .filter((r) => r.status === "submitted")
    .map((r) => ({
      id: r.id,
      kind: "approval" as const,
      title: r.recommendation ?? r.summary,
      from: `${r.agent === "hyperagent" ? "HyperAgent" : "Hermes"}${
        r.missionCode ? ` · Mission #${r.missionCode}` : ""
      }`,
      preview: r.summary,
      time: r.createdAt,
      level: r.risks ? ("high" as const) : ("medium" as const),
      unread: true,
      actions: ["Approve", "Reject", "Request revision"],
      mission: r.missionCode,
      reportId: r.id,
    }));
}
export async function getUnreadInboxCount() {
  const items = await getInbox();
  return items.filter((item) => item.unread).length;
}

// ── AI Workforce ─────────────────────────────────────────────────────────────
export async function getAgents() {
  return agents;
}

// ── Decisions ────────────────────────────────────────────────────────────────
export async function getDecisions() {
  return decisions;
}

// ── CTO Office ───────────────────────────────────────────────────────────────
export async function getTechStack() {
  return techStack;
}
export async function getDeployments() {
  return deployments;
}
export async function getIncidents() {
  return incidents;
}
export async function getCtoRecommendations() {
  return ctoRecommendations;
}

// ── Bridge Lite Operational HQ (Mission #002A — live Supabase) ─────────────

function bridgeHqConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_BRIDGE_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_BRIDGE_SUPABASE_ANON_KEY,
  );
}

export async function getReports(): Promise<ReportRecord[]> {
  if (!bridgeHqConfigured()) return [];
  const supabase = await createBridgeServerClient();
  const { data } = await supabase
    .from("reports")
    .select("id, agent, mission_id, summary, evidence, risks, recommendation, requested_decision, related_links, status, created_at, missions(code)")
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => ({
    id: r.id,
    agent: r.agent,
    missionId: r.mission_id,
    missionCode: (r.missions as unknown as { code: string } | null)?.code ?? null,
    summary: r.summary,
    evidence: r.evidence,
    risks: r.risks,
    recommendation: r.recommendation,
    requestedDecision: r.requested_decision,
    relatedLinks: (r.related_links as string[]) ?? [],
    status: r.status,
    createdAt: r.created_at,
  }));
}

export async function getReportsByMission(missionId: string): Promise<ReportRecord[]> {
  const reports = await getReports();
  return reports.filter((r) => r.missionId === missionId);
}

export async function getLatestReportByAgent(
  agent: "hyperagent" | "hermes",
): Promise<ReportRecord | null> {
  const reports = await getReports();
  return reports.find((r) => r.agent === agent) ?? null;
}

export async function getMissions(): Promise<MissionRecord[]> {
  if (!bridgeHqConfigured()) return [];
  const supabase = await createBridgeServerClient();
  const { data } = await supabase
    .from("missions")
    .select("*")
    .order("updated_at", { ascending: false });

  return (data ?? []).map((m) => ({
    id: m.id,
    code: m.code,
    title: m.title,
    owner: m.owner,
    phase: m.phase,
    progress: m.progress,
    status: m.status,
    nextAction: m.next_action,
    latestDecision: m.latest_decision,
    createdAt: m.created_at,
    updatedAt: m.updated_at,
  }));
}

export async function getActiveMission(): Promise<MissionRecord | null> {
  const missions = await getMissions();
  return missions.find((m) => m.status === "active") ?? missions[0] ?? null;
}

export async function getMissionEvents(missionId: string): Promise<MissionEventRecord[]> {
  if (!bridgeHqConfigured()) return [];
  const supabase = await createBridgeServerClient();
  const { data } = await supabase
    .from("mission_events")
    .select("*")
    .eq("mission_id", missionId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((e) => ({
    id: e.id,
    missionId: e.mission_id,
    eventType: e.event_type,
    description: e.description,
    actor: e.actor,
    createdAt: e.created_at,
  }));
}

export async function getDecisionsAudit(): Promise<DecisionRecord[]> {
  if (!bridgeHqConfigured()) return [];
  const supabase = await createBridgeServerClient();
  const { data } = await supabase
    .from("decisions")
    .select("id, report_id, mission_id, action, notes, created_at, profiles(display_name)")
    .order("created_at", { ascending: false });

  return (data ?? []).map((d) => ({
    id: d.id,
    reportId: d.report_id,
    missionId: d.mission_id,
    actorName: (d.profiles as unknown as { display_name: string } | null)?.display_name ?? "CEO",
    action: d.action,
    notes: d.notes,
    createdAt: d.created_at,
  }));
}

export async function getDecisionsByMission(missionId: string): Promise<DecisionRecord[]> {
  const all = await getDecisionsAudit();
  return all.filter((d) => d.missionId === missionId);
}

export async function getWorkforceStatus(): Promise<WorkforceStatusRecord[]> {
  if (!bridgeHqConfigured()) return [];
  const supabase = await createBridgeServerClient();
  const { data } = await supabase
    .from("workforce_status")
    .select("*, departments(name)")
    .order("agent_name", { ascending: true });

  return (data ?? []).map((w) => ({
    id: w.id,
    agentName: w.agent_name,
    role: w.role,
    status: w.status,
    currentTask: w.current_task,
    lastActiveAt: w.last_active_at,
    departmentName:
      (w.departments as unknown as { name: string } | null)?.name ?? null,
  }));
}

export async function getDepartments(): Promise<DepartmentRecord[]> {
  if (!bridgeHqConfigured()) return [];
  const supabase = await createBridgeServerClient();
  const { data } = await supabase
    .from("departments")
    .select("*")
    .order("name", { ascending: true });

  return (data ?? []).map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    createdAt: d.created_at,
  }));
}

export async function getCompanyMemory(): Promise<CompanyMemoryRecord[]> {
  if (!bridgeHqConfigured()) return [];
  const supabase = await createBridgeServerClient();
  const { data } = await supabase
    .from("company_memory")
    .select("*")
    .order("created_at", { ascending: false });

  return (data ?? []).map((m) => ({
    id: m.id,
    category: m.category,
    title: m.title,
    content: m.content,
    missionId: m.mission_id,
    createdAt: m.created_at,
  }));
}

// ── CTO Office Intelligence Framework (Mission #003A — live Supabase) ──────

export async function getEngineeringStandards(): Promise<EngineeringStandardRecord[]> {
  if (!bridgeHqConfigured()) return [];
  const supabase = await createBridgeServerClient();
  const { data } = await supabase
    .from("engineering_standards")
    .select("*")
    .order("category", { ascending: true });

  return (data ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    category: s.category,
    content: s.content,
    createdAt: s.created_at,
  }));
}

export async function getPlaybooks(): Promise<PlaybookRecord[]> {
  if (!bridgeHqConfigured()) return [];
  const supabase = await createBridgeServerClient();
  const { data } = await supabase
    .from("playbooks")
    .select("*")
    .order("category", { ascending: true });

  return (data ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    steps: p.steps,
    createdAt: p.created_at,
  }));
}

export async function getCtoBriefs(): Promise<CtoBriefRecord[]> {
  if (!bridgeHqConfigured()) return [];
  const supabase = await createBridgeServerClient();
  const { data } = await supabase
    .from("cto_briefs")
    .select("*, missions(code), profiles(display_name)")
    .order("created_at", { ascending: false });

  return (data ?? []).map((b) => ({
    id: b.id,
    missionId: b.mission_id,
    missionCode: (b.missions as unknown as { code: string } | null)?.code ?? null,
    title: b.title,
    summary: b.summary,
    recommendation: b.recommendation,
    rationale: b.rationale,
    generatedByName: (b.profiles as unknown as { display_name: string } | null)?.display_name ?? null,
    createdAt: b.created_at,
  }));
}

export async function getCtoBriefsByMission(missionId: string): Promise<CtoBriefRecord[]> {
  const all = await getCtoBriefs();
  return all.filter((b) => b.missionId === missionId);
}

/**
 * "Engineering Memory" (Mission #003A) is deliberately a filtered read of
 * the existing company_memory table, not a new parallel store — one source
 * of truth for company history. This filters to the categories that are
 * genuinely engineering-facing (architecture decisions, operating rules,
 * lessons learned), leaving release approvals and mission decisions to the
 * general Company Memory page.
 */
export async function getEngineeringMemory(): Promise<CompanyMemoryRecord[]> {
  const memory = await getCompanyMemory();
  const engineeringCategories = new Set(["architecture_decision", "operating_rule", "lesson_learned"]);
  return memory.filter((m) => engineeringCategories.has(m.category));
}

// ── CTO Integration & Review Automation (Mission #004A — live Supabase) ────

export async function getCtoDecisionImports(): Promise<CtoDecisionImportRecord[]> {
  if (!bridgeHqConfigured()) return [];
  const supabase = await createBridgeServerClient();
  const { data } = await supabase
    .from("cto_decision_imports")
    .select("*, profiles(display_name)")
    .order("created_at", { ascending: false });

  return (data ?? []).map((d) => ({
    id: d.id,
    missionId: d.mission_id,
    ctoBriefId: d.cto_brief_id,
    rawText: d.raw_text,
    decision: d.decision,
    conditions: d.conditions,
    risks: d.risks,
    requiredActions: d.required_actions,
    confidence: d.confidence,
    approvalStatus: d.approval_status,
    importedByName: (d.profiles as unknown as { display_name: string } | null)?.display_name ?? null,
    confirmedAt: d.confirmed_at,
    createdAt: d.created_at,
  }));
}

export async function getCtoDecisionImportsByMission(
  missionId: string,
): Promise<CtoDecisionImportRecord[]> {
  const all = await getCtoDecisionImports();
  return all.filter((d) => d.missionId === missionId);
}

/**
 * The Engineering Inbox (Mission #004A): one mission-centered view of
 * HyperAgent, Hermes, CTO, and CEO status, blockers, timestamps, and next
 * owner. Composed entirely from existing reports/mission_events/decisions —
 * no new table, matching the mission's "reuse, don't duplicate" rule.
 */
export async function getEngineeringInbox(missionId: string): Promise<EngineeringInboxRow[]> {
  const [reports, events, decisionsAudit, imports] = await Promise.all([
    getReportsByMission(missionId),
    getMissionEvents(missionId),
    getDecisionsByMission(missionId),
    getCtoDecisionImportsByMission(missionId),
  ]);

  const hyperAgentReport = reports.find((r) => r.agent === "hyperagent") ?? null;
  const hermesReport = reports.find((r) => r.agent === "hermes") ?? null;
  const latestImport = imports[0] ?? null;
  const latestDecision = decisionsAudit[0] ?? null;
  const openBlockers = events.filter((e) => e.eventType === "blocker");
  const reviewRequested = events.some((e) => e.eventType === "cto_review_requested");

  const rows: EngineeringInboxRow[] = [
    {
      role: "hyperagent",
      roleLabel: "HyperAgent",
      status: hyperAgentReport?.status ?? "no report yet",
      blocker: openBlockers.find((b) => b.actor === "HyperAgent")?.description ?? null,
      lastUpdate: hyperAgentReport?.createdAt ?? null,
      nextOwner: !hyperAgentReport || hyperAgentReport.status === "reviewed",
    },
    {
      role: "hermes",
      roleLabel: "Hermes",
      status: hermesReport?.status ?? "no report yet",
      blocker: openBlockers.find((b) => b.actor === "Hermes")?.description ?? null,
      lastUpdate: hermesReport?.createdAt ?? null,
      nextOwner: Boolean(hyperAgentReport) && !hermesReport,
    },
    {
      role: "cto",
      roleLabel: "CTO",
      status: latestImport ? latestImport.approvalStatus : reviewRequested ? "review requested" : "not yet requested",
      blocker: null,
      lastUpdate: latestImport?.createdAt ?? null,
      nextOwner: reviewRequested && !latestImport,
    },
    {
      role: "ceo",
      roleLabel: "CEO",
      status: latestDecision?.action ?? "no decision yet",
      blocker: null,
      lastUpdate: latestDecision?.createdAt ?? null,
      nextOwner: Boolean(latestImport) && !latestDecision,
    },
  ];

  return rows;
}

/**
 * The Mission Timeline (Mission #004A): every submitted report, review,
 * decision, revision, and approval, in chronological order with audit
 * references — a read-time merge of existing tables, not a new one.
 */
export async function getMissionTimeline(missionId: string): Promise<MissionTimelineEntry[]> {
  const [reports, events, decisionsAudit, briefs, imports] = await Promise.all([
    getReportsByMission(missionId),
    getMissionEvents(missionId),
    getDecisionsByMission(missionId),
    getCtoBriefsByMission(missionId),
    getCtoDecisionImportsByMission(missionId),
  ]);

  const entries: MissionTimelineEntry[] = [
    ...reports.map((r) => ({
      id: `report-${r.id}`,
      kind: "report" as const,
      actor: r.agent === "hyperagent" ? "HyperAgent" : "Hermes",
      summary: `Report ${r.status}: ${r.summary}`,
      createdAt: r.createdAt,
      auditRef: `reports:${r.id}`,
    })),
    ...events.map((e) => ({
      id: `event-${e.id}`,
      kind: "event" as const,
      actor: e.actor,
      summary: `[${e.eventType}] ${e.description}`,
      createdAt: e.createdAt,
      auditRef: `mission_events:${e.id}`,
    })),
    ...decisionsAudit.map((d) => ({
      id: `decision-${d.id}`,
      kind: "decision" as const,
      actor: d.actorName,
      summary: `Decision: ${d.action}${d.notes ? ` — ${d.notes}` : ""}`,
      createdAt: d.createdAt,
      auditRef: `decisions:${d.id}`,
    })),
    ...briefs.map((b) => ({
      id: `brief-${b.id}`,
      kind: "brief" as const,
      actor: b.generatedByName ?? "System",
      summary: `CTO Brief generated: ${b.recommendation.replace(/_/g, " ").toUpperCase()}`,
      createdAt: b.createdAt,
      auditRef: `cto_briefs:${b.id}`,
    })),
    ...imports.map((i) => ({
      id: `import-${i.id}`,
      kind: "cto_decision_import" as const,
      actor: i.importedByName ?? "CEO",
      summary: `CTO decision imported: ${i.approvalStatus.replace(/_/g, " ")}`,
      createdAt: i.createdAt,
      auditRef: `cto_decision_imports:${i.id}`,
    })),
  ];

  return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// ── Infrastructure ───────────────────────────────────────────────────────────
export async function getServices() {
  return services;
}
export async function getVpsResources() {
  return vpsResources;
}

// ── Ruby's Cake Delights ─────────────────────────────────────────────────────
export async function getRubyProject() {
  return ruby;
}
