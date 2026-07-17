/**
 * Central mapping from the many status vocabularies used across the app
 * (health, service state, work state, agent state, severities…) to a small
 * set of visual "tones", plus the Tailwind classes for each tone.
 *
 * Keeping this in one place means every dot, badge, and label stays
 * consistent no matter which page renders it.
 */

export type Tone = "positive" | "info" | "warning" | "critical" | "neutral" | "accent";

const STATUS_TONE: Record<string, Tone> = {
  // positive
  healthy: "positive",
  online: "positive",
  active: "positive",
  success: "positive",
  done: "positive",
  resolved: "positive",
  on_track: "positive",
  approved: "positive",
  // info / in-flight
  in_progress: "info",
  building: "info",
  provisioning: "info",
  // warning
  warning: "warning",
  degraded: "warning",
  at_risk: "warning",
  review: "warning",
  monitoring: "warning",
  sev3: "warning",
  // critical
  critical: "critical",
  offline: "critical",
  failed: "critical",
  open: "critical",
  sev1: "critical",
  sev2: "critical",
  // neutral
  idle: "neutral",
  planned: "neutral",
  upcoming: "neutral",
  todo: "neutral",
  flat: "neutral",
};

export const TONE_CLASSES: Record<
  Tone,
  { dot: string; text: string; badge: string; soft: string }
> = {
  positive: {
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    badge:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    soft: "bg-emerald-500/10",
  },
  info: {
    dot: "bg-sky-500",
    text: "text-sky-600 dark:text-sky-400",
    badge: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    soft: "bg-sky-500/10",
  },
  warning: {
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    badge: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    soft: "bg-amber-500/10",
  },
  critical: {
    dot: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
    badge: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    soft: "bg-rose-500/10",
  },
  accent: {
    dot: "bg-violet-500",
    text: "text-violet-600 dark:text-violet-400",
    badge: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    soft: "bg-violet-500/10",
  },
  neutral: {
    dot: "bg-muted-foreground/40",
    text: "text-muted-foreground",
    badge: "border-border bg-muted text-muted-foreground",
    soft: "bg-muted",
  },
};

export function toneFor(status: string): Tone {
  return STATUS_TONE[status] ?? "neutral";
}

/** "in_progress" -> "In progress" */
export function labelize(value: string): string {
  const spaced = value.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
