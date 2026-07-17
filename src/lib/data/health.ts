import type { HealthMetric } from "./types";

/**
 * Company health KPIs. The first four are surfaced on the Headquarters
 * homepage; the full set appears wherever a broader read is useful.
 */
export const companyHealth: HealthMetric[] = [
  {
    id: "revenue",
    label: "Monthly Revenue",
    value: "¥412K",
    change: "+24.8%",
    trend: "up",
    hint: "vs last month",
    status: "healthy",
  },
  {
    id: "orders",
    label: "Orders · 30d",
    value: "186",
    change: "+31%",
    trend: "up",
    hint: "online + walk-in",
    status: "healthy",
  },
  {
    id: "social",
    label: "Social Following",
    value: "2,640",
    change: "+12.4%",
    trend: "up",
    hint: "FB · IG · TikTok",
    status: "healthy",
  },
  {
    id: "runway",
    label: "Cash Runway",
    value: "14 mo",
    change: "+1 mo",
    trend: "up",
    hint: "at current burn",
    status: "healthy",
  },
  {
    id: "conversion",
    label: "Store Conversion",
    value: "2.1%",
    change: "+0.4pt",
    trend: "up",
    hint: "target 3.0%",
    status: "warning",
  },
  {
    id: "agents",
    label: "Active Agents",
    value: "3 / 5",
    change: "2 provisioning",
    trend: "flat",
    hint: "AI workforce",
    status: "healthy",
  },
];
