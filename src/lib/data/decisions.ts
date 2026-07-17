import type { Decision } from "./types";

/** The decision log — the institutional memory of why things are the way they are. */
export const decisions: Decision[] = [
  {
    id: "d1",
    title: "Adopt Bridge as the company's digital HQ",
    summary:
      "One pane of glass for operations, run day-to-day by the AI workforce. The CEO starts every morning here.",
    date: "Jul 16",
    owner: "Philip",
    category: "Product",
    impact: "high",
  },
  {
    id: "d2",
    title: "Standardize on Next.js + shadcn/ui + Supabase",
    summary:
      "A single, modern stack for every internal tool so agents and humans build against the same conventions.",
    date: "Jul 15",
    owner: "Atlas",
    category: "Engineering",
    impact: "high",
  },
  {
    id: "d3",
    title: "Komoju primary, Stripe secondary for payments",
    summary:
      "Komoju gives the best Japanese coverage; Stripe stands by as redundancy for foreign cards.",
    date: "Jul 10",
    owner: "Philip",
    category: "Finance",
    impact: "medium",
  },
  {
    id: "d4",
    title: "Launch reservations before wedding season",
    summary:
      "Capture custom-cake and event demand with online booking ahead of the autumn peak.",
    date: "Jul 8",
    owner: "Hermes",
    category: "Growth",
    impact: "high",
  },
  {
    id: "d5",
    title: "Hold the growth budget at ¥200K, DIY-first",
    summary:
      "Lean, organic-led growth for the year. Paid ads are a Q4 experiment, not a crutch.",
    date: "Jul 5",
    owner: "Philip",
    category: "Finance",
    impact: "medium",
  },
  {
    id: "d6",
    title: "Bilingual by default across all storefronts",
    summary:
      "Japanese and English parity for products, emails, and support — no second-class language.",
    date: "Jun 28",
    owner: "Philip",
    category: "Product",
    impact: "medium",
  },
];
