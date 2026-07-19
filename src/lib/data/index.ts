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
  DecisionRecord,
  InboxItem,
  MissionEventRecord,
  MissionRecord,
  ReportRecord,
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
    missionCode: (r.missions as { code: string } | null)?.code ?? null,
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
    actorName: (d.profiles as { display_name: string } | null)?.display_name ?? "CEO",
    action: d.action,
    notes: d.notes,
    createdAt: d.created_at,
  }));
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
