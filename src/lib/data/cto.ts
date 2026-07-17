import type {
  CTORecommendation,
  Deployment,
  Incident,
  TechStackItem,
} from "./types";

export const techStack: TechStackItem[] = [
  { name: "Next.js", category: "Framework", version: "16.2", status: "online", note: "App Router · RSC" },
  { name: "TypeScript", category: "Language", version: "5.9", status: "online", note: "strict mode" },
  { name: "Tailwind CSS", category: "Styling", version: "v4", status: "online", note: "tokens + dark mode" },
  { name: "shadcn/ui", category: "Components", version: "radix", status: "online", note: "Radix primitives" },
  { name: "Supabase", category: "Backend", version: "—", status: "degraded", note: "scaffolded · mock" },
  { name: "WooCommerce", category: "Commerce", version: "8.x", status: "online", note: "rubyscakedelights.shop" },
  { name: "Komoju", category: "Payments", version: "v1", status: "online", note: "primary · JP" },
  { name: "Stripe", category: "Payments", version: "—", status: "offline", note: "secondary · planned" },
  { name: "Hostinger VPS", category: "Hosting", version: "KVM 2", status: "online", note: "storefront + WP" },
  { name: "Vercel", category: "Hosting", version: "—", status: "online", note: "Bridge · preview" },
];

export const deployments: Deployment[] = [
  { id: "dep1", project: "Bridge", env: "production", version: "v0.1.0", status: "building", time: "just now", author: "HyperAgent" },
  { id: "dep2", project: "Bridge", env: "preview", version: "pr-1", status: "success", time: "10 min ago", author: "HyperAgent" },
  { id: "dep3", project: "Komoju webhook", env: "staging", version: "retry-2", status: "success", time: "2h ago", author: "HyperAgent" },
  { id: "dep4", project: "rubyscakedelights.shop", env: "production", version: "cart-fix", status: "success", time: "Yesterday", author: "HyperAgent" },
  { id: "dep5", project: "rubyscakedelights.shop", env: "production", version: "og-tags", status: "failed", time: "Mon", author: "Hermes" },
];

export const incidents: Incident[] = [
  { id: "inc1", title: "Komoju webhook timeouts", severity: "sev3", status: "monitoring", time: "since yesterday" },
  { id: "inc2", title: "Storefront cart total mismatch", severity: "sev2", status: "resolved", time: "yesterday" },
];

export const ctoRecommendations: CTORecommendation[] = [
  {
    id: "r1",
    title: "Move product media to a CDN",
    rationale: "Campaign traffic will 3× image loads; offload the VPS before Aug 1.",
    effort: "M",
    impact: "high",
    status: "proposed",
  },
  {
    id: "r2",
    title: "Automated daily Supabase backups",
    rationale: "Once reservations are live, nightly point-in-time backups are non-negotiable.",
    effort: "S",
    impact: "high",
    status: "proposed",
  },
  {
    id: "r3",
    title: "Add Sentry error monitoring",
    rationale: "Catch checkout and booking errors before customers report them.",
    effort: "S",
    impact: "medium",
    status: "proposed",
  },
  {
    id: "r4",
    title: "Enable Stripe as payment backup",
    rationale: "Card redundancy for foreign customers; ~1 day of work.",
    effort: "S",
    impact: "medium",
    status: "proposed",
  },
  {
    id: "r5",
    title: "JP/EN toggle at checkout",
    rationale: "A/B suggests +0.6pt conversion for foreign residents.",
    effort: "M",
    impact: "medium",
    status: "approved",
  },
];
