import type { AIAgent } from "./types";

/**
 * The AI workforce. Three agents are live today; two more are on the way,
 * so the roster reads like a team that's actively scaling.
 */
export const agents: AIAgent[] = [
  {
    id: "hermes",
    name: "Hermes",
    role: "Growth & Communications",
    description:
      "Runs social, content, and customer replies across Ruby's Cake Delights. Owns the 20× following goal.",
    status: "active",
    model: "Claude Opus 4.8",
    tasksCompleted: 1284,
    tasksInQueue: 6,
    uptime: "99.9%",
    lastActive: "2 min ago",
    accent: "sky",
    skills: ["Social content", "Customer replies", "Campaign planning", "JP/EN copy"],
    recent: [
      { time: "08:15", summary: "Drafted 5 bilingual IG posts for the mango shortcake launch" },
      { time: "07:50", summary: "Replied to 12 DMs and 3 wholesale inquiries" },
      { time: "Yesterday", summary: "Scheduled a 'behind the counter' TikTok reel for 18:00 JST" },
    ],
  },
  {
    id: "hyperagent",
    name: "HyperAgent",
    role: "Engineering & Delivery",
    description:
      "Ships product. Built Bridge v0.1 and maintains the WooCommerce + Komoju storefront stack.",
    status: "active",
    model: "Claude Opus 4.8",
    tasksCompleted: 512,
    tasksInQueue: 3,
    uptime: "99.7%",
    lastActive: "just now",
    accent: "violet",
    skills: ["Next.js", "WooCommerce", "Integrations", "CI / deploys"],
    recent: [
      { time: "08:22", summary: "Opened PR #1 — Bridge v0.1 (Next.js + shadcn/ui)" },
      { time: "07:30", summary: "Patched Komoju webhook retry logic on staging" },
      { time: "Yesterday", summary: "Deployed a storefront cart fix to production" },
    ],
  },
  {
    id: "atlas",
    name: "Atlas",
    role: "CTO Copilot",
    description:
      "Owns architecture, code review, and infrastructure health. Flags risks before they ship.",
    status: "active",
    model: "Claude Opus 4.8",
    tasksCompleted: 348,
    tasksInQueue: 2,
    uptime: "99.9%",
    lastActive: "6 min ago",
    accent: "emerald",
    skills: ["Architecture", "Code review", "Security", "Infra"],
    recent: [
      { time: "08:05", summary: "Reviewed Bridge PR — 2 suggestions, no blockers" },
      { time: "Yesterday", summary: "Recommended a CDN for product media before the campaign" },
      { time: "Yesterday", summary: "Rotated Supabase service keys" },
    ],
  },
  {
    id: "kagami",
    name: "Kagami",
    role: "Data & Insights",
    description:
      "Will turn orders, traffic, and social metrics into a single weekly scorecard.",
    status: "provisioning",
    model: "Claude Opus 4.8",
    tasksCompleted: 0,
    tasksInQueue: 0,
    uptime: "—",
    lastActive: "provisioning",
    accent: "amber",
    skills: ["Analytics", "Reporting", "Forecasting"],
    recent: [
      { time: "Now", summary: "Provisioning data connectors — WooCommerce, GA4, Meta" },
    ],
  },
  {
    id: "yumi",
    name: "Yumi",
    role: "Customer Success · JP/EN",
    description:
      "Planned: bilingual order support, reservation confirmations, and review follow-ups.",
    status: "planned",
    model: "Claude Opus 4.8",
    tasksCompleted: 0,
    tasksInQueue: 0,
    uptime: "—",
    lastActive: "not started",
    accent: "rose",
    skills: ["Support", "Reservations", "Reviews"],
    recent: [{ time: "Planned", summary: "Awaiting reservation system go-live" }],
  },
];
