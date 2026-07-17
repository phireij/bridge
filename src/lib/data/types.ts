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
