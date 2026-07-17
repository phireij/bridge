import { site } from "@/config/site";

/** Two-letter initials from a name, e.g. "Ruby Ops" -> "RO". */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/** Compact number formatting: 2640 -> "2,640", 36000 -> "36,000". */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat(site.locale).format(value);
}

/** Percentage of a goal, clamped 0–100. */
export function pctOfGoal(current: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(100, Math.round((current / goal) * 100));
}

/** Time-of-day greeting for the given hour (0–23). */
export function greetingFor(hour: number): string {
  if (hour < 5) return "Burning the midnight oil";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Working late";
}
