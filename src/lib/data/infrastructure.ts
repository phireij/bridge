import type { ResourceGauge, ServiceStatus } from "./types";

export const services: ServiceStatus[] = [
  {
    id: "vps",
    name: "Hostinger VPS",
    category: "Compute",
    status: "online",
    detail: "KVM 2 · storefront + WordPress",
    uptime: "99.95%",
    region: "Tokyo",
  },
  {
    id: "github",
    name: "GitHub",
    category: "Source Control",
    status: "online",
    detail: "3 repos · PR #1 open · Actions passing",
    uptime: "100%",
  },
  {
    id: "supabase",
    name: "Supabase",
    category: "Database",
    status: "degraded",
    detail: "Scaffolded, not yet live (mock)",
    uptime: "—",
    region: "Tokyo",
  },
  {
    id: "vercel",
    name: "Vercel",
    category: "Hosting / CDN",
    status: "online",
    detail: "Bridge preview deployed",
    uptime: "100%",
  },
  {
    id: "cloudflare",
    name: "Cloudflare DNS",
    category: "Network",
    status: "online",
    detail: "rubyscakedelights.shop",
    uptime: "100%",
  },
  {
    id: "komoju",
    name: "Komoju",
    category: "Payments",
    status: "online",
    detail: "Primary gateway · JP",
    uptime: "99.9%",
  },
  {
    id: "yamato",
    name: "Yamato Cold-Chain API",
    category: "Logistics",
    status: "online",
    detail: "Nationwide cold delivery",
    uptime: "99.8%",
  },
];

/** Live resource gauges for the primary VPS. */
export const vpsResources: ResourceGauge[] = [
  { label: "CPU", used: 0.7, total: 2, unit: "vCPU", percent: 34 },
  { label: "Memory", used: 4.6, total: 8, unit: "GB", percent: 58 },
  { label: "Disk", used: 47, total: 100, unit: "GB", percent: 47 },
  { label: "Bandwidth", used: 1.1, total: 5, unit: "TB", percent: 22 },
];
