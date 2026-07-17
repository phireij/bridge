# Bridge v0.1 — the company's digital headquarters

This PR introduces **Bridge**, the digital HQ where the CEO starts every
morning. It is a complete, MVP-scoped application — not a scaffold — with every
page fully built and populated with realistic seeded company data.

## What's included

**Headquarters homepage** — a time-aware "Good morning, Philip" briefing with
eight widgets:

- Today's Priorities · Company Health · Current Sprint · AI Workforce Status
- CEO Inbox · Recent Decisions · Upcoming Milestones (+ live JST clock)

**Eight fully-alive sections** (no "coming soon" placeholders):

| Section          | What's on it                                                        |
| ---------------- | ------------------------------------------------------------------- |
| Headquarters     | The morning briefing (above)                                        |
| CEO Inbox        | Pending approvals + CTO recommendations, with action affordances    |
| CTO Office       | Tech stack, deployments, incidents, and CTO recommendations         |
| AI Workforce     | Hermes, HyperAgent, Atlas (+ Kagami & Yumi incoming) with activity  |
| Ruby             | Ruby's Cake Delights — reservation project, revenue, 20× social goal|
| Company Memory   | Mission, vision, operating principles, and the decision log         |
| Infrastructure   | VPS health, GitHub, Supabase (mock), and all service statuses       |
| Settings         | Profile, appearance (working theme switch), and integrations        |

## Technical approach

- **Next.js 16 (App Router, RSC) · TypeScript (strict) · Tailwind v4 · shadcn/ui**
- **Dark mode by default** via `next-themes`; responsive from phone to ultrawide.
- **Swappable data-access layer** (`src/lib/data`): async getters return seeded
  data today and become Supabase queries later with zero UI changes. Supabase
  browser/server clients are scaffolded.
- **One design language**: a single status → tone → classes map
  (`src/lib/status.ts`) keeps every badge, dot, and trend consistent.
- **Clean component layering**: `ui/` → `shared/` → `dashboard/` → pages.

## Quality gates

- `pnpm build` ✓ (all 9 routes compile & prerender)
- `pnpm typecheck` ✓ (strict, no errors)
- `pnpm lint` ✓ (clean)

## Explicitly out of scope for v0.1

Authentication/login, live Supabase tables + RLS, write-back actions, and a
test/CI suite. Each is a clean follow-up — see `docs/ARCHITECTURE.md` and the
README roadmap.

## How to run

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

No environment variables are required — Bridge runs on seeded data out of the box.
