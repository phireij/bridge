/**
 * Domain types for Bridge.
 *
 * These describe the shape of every piece of data the dashboard renders.
 * The data-access layer (`src/lib/data/index.ts`) returns these types, so
 * swapping the seed source for live Supabase queries later only changes the
 * function bodies — never the UI.
 */

export type Trend = "up" | "down" | "flat";

/** Coarse health used by KPIs and services. */
export type Health = "healthy" | "warning" | "critical";

/** Live service connectivity. */
export type ServiceState = "online" | "degraded" | "offline";

// ── Company ──────────────────────────────────────────────────────────────

export interface CompanyProfile {
  name: string;
  codename: string;
  tagline: string;
  mission: string;
  vision: string;
  ceo: string;
  founded: string;
  hq: string;
  timezone: string;
  stage: string;
}

export interface CompanyValue {
  title: string;
  description: string;
}

// ── Priorities ───────────────────────────────────────────────────────────

export type WorkState = "todo" | "in_progress" | "review" | "done";
export type Level = "high" | "medium" | "low";

export interface Priority {
  id: string;
  title: string;
  detail: string;
  owner: string;
  due: string;
  state: WorkState;
  level: Level;
}

// ── Company health ────────────────────────────────────────────────────────

export interface HealthMetric {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: Trend;
  hint: string;
  status: Health;
}

// ── Sprint ───────────────────────────────────────────────────────────────

export interface SprintTask {
  id: string;
  title: string;
  assignee: string;
  state: WorkState;
}

export interface Sprint {
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  progress: number;
  daysRemaining: number;
  committedPoints: number;
  completedPoints: number;
  tasks: SprintTask[];
}

// ── AI Workforce ───────────────────────────────────────────────────────────

export type AgentStatus = "active" | "idle" | "provisioning" | "planned" | "offline";

export interface AgentActivity {
  time: string;
  summary: string;
}

export interface AIAgent {
  id: string;
  name: string;
  role: string;
  description: string;
  status: AgentStatus;
  model: string;
  tasksCompleted: number;
  tasksInQueue: number;
  uptime: string;
  lastActive: string;
  accent: AgentAccent;
  skills: string[];
  recent: AgentActivity[];
}

export type AgentAccent = "sky" | "violet" | "emerald" | "amber" | "rose";

// ── CEO Inbox ──────────────────────────────────────────────────────────────

export type InboxKind = "approval" | "recommendation" | "notification" | "message";

export interface InboxItem {
  id: string;
  kind: InboxKind;
  title: string;
  from: string;
  preview: string;
  time: string;
  level: Level;
  unread: boolean;
  actions?: string[];
  /** Mission #002A: mission code this item relates to, if any. */
  mission?: string | null;
  /** Mission #002A: the underlying `reports` row id, for the decision actions. */
  reportId?: string;
}

// ── Decisions ──────────────────────────────────────────────────────────────

export interface Decision {
  id: string;
  title: string;
  summary: string;
  date: string;
  owner: string;
  category: string;
  impact: Level;
}

// ── Milestones ─────────────────────────────────────────────────────────────

export type MilestoneStatus = "on_track" | "at_risk" | "upcoming" | "done";

export interface Milestone {
  id: string;
  title: string;
  description: string;
  date: string;
  status: MilestoneStatus;
  progress: number;
  owner: string;
}

// ── CTO Office ─────────────────────────────────────────────────────────────

export interface TechStackItem {
  name: string;
  category: string;
  version: string;
  status: ServiceState;
  note: string;
}

export type DeployStatus = "success" | "building" | "failed";

export interface Deployment {
  id: string;
  project: string;
  env: string;
  version: string;
  status: DeployStatus;
  time: string;
  author: string;
}

export type Severity = "sev1" | "sev2" | "sev3";
export type IncidentStatus = "open" | "monitoring" | "resolved";

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  time: string;
}

export interface CTORecommendation {
  id: string;
  title: string;
  rationale: string;
  effort: "S" | "M" | "L";
  impact: Level;
  status: "proposed" | "approved";
}

// ── Infrastructure ─────────────────────────────────────────────────────────

export interface ServiceStatus {
  id: string;
  name: string;
  category: string;
  status: ServiceState;
  detail: string;
  uptime: string;
  region?: string;
}

export interface ResourceGauge {
  label: string;
  used: number;
  total: number;
  unit: string;
  percent: number;
}

// ── Ruby's Cake Delights ─────────────────────────────────────────────────────

export interface RubyMetric {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: Trend;
}

export interface RubyPhase {
  id: string;
  name: string;
  status: "done" | "in_progress" | "upcoming";
  progress: number;
}

export interface RubyTask {
  id: string;
  title: string;
  state: WorkState;
  owner: string;
}

export interface SocialChannel {
  id: string;
  network: string;
  handle: string;
  current: number;
  goal: number;
}

export interface RubyProject {
  name: string;
  description: string;
  overallProgress: number;
  targetLaunch: string;
  metrics: RubyMetric[];
  phases: RubyPhase[];
  tasks: RubyTask[];
  social: SocialChannel[];
}

// ── Bridge Lite Operational HQ (Mission #002A) ──────────────────────────────
// Backed by the dedicated `bridge-hq` Supabase project. See AGENTS.md for the
// project map — never point these at ruby-reservations.

export type HqRole = "ceo" | "cto" | "hyperagent" | "hermes" | "unassigned";
export type ReportAgent = "hyperagent" | "hermes";
export type ReportStatus = "submitted" | "reviewed" | "actioned";
export type DecisionAction = "approve" | "reject" | "request_revision";
export type MissionStatus = "active" | "blocked" | "complete" | "archived";

export interface MissionRecord {
  id: string;
  code: string;
  title: string;
  owner: string;
  phase: string;
  progress: number;
  status: MissionStatus;
  nextAction: string | null;
  latestDecision: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MissionEventRecord {
  id: string;
  missionId: string;
  eventType: string;
  description: string;
  actor: string;
  createdAt: string;
}

export interface ReportRecord {
  id: string;
  agent: ReportAgent;
  missionId: string | null;
  missionCode: string | null;
  summary: string;
  evidence: string | null;
  risks: string | null;
  recommendation: string | null;
  requestedDecision: string | null;
  relatedLinks: string[];
  status: ReportStatus;
  createdAt: string;
}

export interface DecisionRecord {
  id: string;
  reportId: string | null;
  missionId: string | null;
  actorName: string;
  action: DecisionAction;
  notes: string | null;
  createdAt: string;
}

export interface WorkforceStatusRecord {
  id: string;
  agentName: string;
  role: string;
  status: string;
  currentTask: string | null;
  lastActiveAt: string | null;
  departmentName: string | null;
}

export interface DepartmentRecord {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface CompanyMemoryRecord {
  id: string;
  category: string;
  title: string;
  content: string;
  missionId: string | null;
  createdAt: string;
}

// ── CTO Office Intelligence Framework (Mission #003A) ───────────────────────

export interface EngineeringStandardRecord {
  id: string;
  title: string;
  category: string;
  content: string;
  createdAt: string;
}

export interface PlaybookRecord {
  id: string;
  title: string;
  category: string;
  steps: string;
  createdAt: string;
}

export type BriefRecommendation = "go" | "go_with_conditions" | "no_go";

export interface CtoBriefRecord {
  id: string;
  missionId: string | null;
  missionCode: string | null;
  title: string;
  summary: string;
  recommendation: BriefRecommendation;
  rationale: string;
  generatedByName: string | null;
  createdAt: string;
}
