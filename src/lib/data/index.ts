/**
 * Data-access layer for Bridge.
 *
 * Every page and widget reads the company's state through these functions —
 * never by importing seed files directly. Today they return seeded data
 * (defined in the sibling files). To go live, swap each body for a Supabase
 * query, e.g.:
 *
 *   export async function getPriorities(): Promise<Priority[]> {
 *     const supabase = await createClient();
 *     const { data } = await supabase.from("priorities").select("*");
 *     return data ?? [];
 *   }
 *
 * The function signatures — and therefore the entire UI — stay identical.
 * The functions are async on purpose so that swap requires no call-site edits.
 */
import { company, companyValues } from "./company";
import { companyHealth } from "./health";
import { inbox } from "./inbox";
import { decisions } from "./decisions";
import { milestones, priorities, sprint } from "./operations";
import { agents } from "./workforce";
import { ctoRecommendations, deployments, incidents, techStack } from "./cto";
import { services, vpsResources } from "./infrastructure";
import { ruby } from "./ruby";

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

// ── CEO Inbox ────────────────────────────────────────────────────────────────
export async function getInbox() {
  return inbox;
}
export async function getUnreadInboxCount() {
  return inbox.filter((item) => item.unread).length;
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
