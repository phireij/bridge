import type { RubyProject } from "./types";

/**
 * Ruby's Cake Delights — the company's first venture. The headline project is
 * the online reservation system launching this sprint.
 */
export const ruby: RubyProject = {
  name: "Ruby's Reservation System",
  description:
    "Online booking for custom cakes, pickup slots, and event orders — bilingual JP/EN, integrated with the WooCommerce storefront and Yamato cold-chain delivery.",
  overallProgress: 62,
  targetLaunch: "Jul 25",
  metrics: [
    { id: "rev", label: "Monthly Revenue", value: "¥412K", change: "+24.8%", trend: "up" },
    { id: "orders", label: "Orders · 30d", value: "186", change: "+31%", trend: "up" },
    { id: "aov", label: "Avg Order Value", value: "¥2,214", change: "+5%", trend: "up" },
    { id: "waitlist", label: "Reservation Waitlist", value: "37", change: "new", trend: "up" },
  ],
  phases: [
    { id: "ph1", name: "Discovery & design", status: "done", progress: 100 },
    { id: "ph2", name: "Booking flow — calendar + slots", status: "in_progress", progress: 75 },
    { id: "ph3", name: "Payments — Komoju / Stripe", status: "in_progress", progress: 55 },
    { id: "ph4", name: "Bilingual emails & confirmations", status: "upcoming", progress: 20 },
    { id: "ph5", name: "Yamato cold-chain scheduling", status: "upcoming", progress: 10 },
    { id: "ph6", name: "Public beta launch", status: "upcoming", progress: 0 },
  ],
  tasks: [
    { id: "rt1", title: "Design pickup-slot calendar", state: "done", owner: "Hermes" },
    { id: "rt2", title: "WooCommerce bookings integration", state: "in_progress", owner: "HyperAgent" },
    { id: "rt3", title: "Komoju deposit payments", state: "in_progress", owner: "HyperAgent" },
    { id: "rt4", title: "JP/EN confirmation emails", state: "todo", owner: "Hermes" },
    { id: "rt5", title: "Yamato delivery scheduling", state: "todo", owner: "Atlas" },
    { id: "rt6", title: "Beta invite list (37)", state: "review", owner: "Hermes" },
  ],
  social: [
    { id: "fb", network: "Facebook", handle: "RubysCakeDelights", current: 1800, goal: 36000 },
    { id: "ig", network: "Instagram", handle: "@rubyscakedelights", current: 370, goal: 7400 },
    { id: "tt", network: "TikTok", handle: "@rubyscakes", current: 175, goal: 3500 },
  ],
};
