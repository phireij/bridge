# Architecture

This document explains how Bridge is put together and the conventions to follow
when extending it.

## Principles

1. **MVP first, no over-engineering.** v0.1 ships a complete, believable HQ on
   seeded data. Real persistence, auth, and live integrations are deliberately
   deferred — but the seams for them exist today.
2. **The UI never talks to a data source directly.** It talks to the
   data-access layer. That single indirection is what lets us swap seed data for
   Supabase later without editing a single component.
3. **One source of truth for visual meaning.** Every status, health, and state
   value maps to a "tone" in `src/lib/status.ts`, and every tone maps to a fixed
   set of Tailwind classes. Consistency is structural, not a matter of
   remembering which green to use.

## Rendering model

Bridge uses the **Next.js App Router** with React Server Components.

- **Server Components (default).** Pages and most widgets are `async` server
  components. They `await` the data-access layer and render on the server — no
  client JS shipped for the data itself.
- **Client islands (`"use client"`).** Only the genuinely interactive pieces:
  the theme provider, the mode toggle, the sidebar (active-state + mobile
  drawer), the top bar (live clock), the greeting hero (live clock), and the
  settings appearance control.

## Directory layout

```
src/app/(app)/…      Route group holding the authenticated shell + every page
src/components/ui     shadcn/ui primitives (generated, rarely edited by hand)
src/components/shared Reusable app-level pieces (PageHeader, StatCard, …)
src/components/dashboard  Homepage widgets, WidgetCard, AgentAvatar
src/components/layout AppSidebar, TopBar, NavUser
src/config            site.ts (branding) + nav.ts (navigation as data)
src/lib/data          Types, seed datasets, and the data-access layer
src/lib/supabase      Browser + server Supabase clients (scaffolded)
src/lib/status.ts     status → tone → classes
src/lib/format.ts     initials, number formatting, greeting, % of goal
```

## The data-access layer

`src/lib/data/` is the heart of the app.

- **`types.ts`** — every domain type. The contract between data and UI.
- **Domain seed files** (`company.ts`, `operations.ts`, `workforce.ts`,
  `inbox.ts`, `decisions.ts`, `cto.ts`, `infrastructure.ts`, `ruby.ts`,
  `health.ts`) — realistic, typed seed data.
- **`index.ts`** — the public API: a set of `async` getters
  (`getPriorities()`, `getAgents()`, `getInbox()`, …). **Pages import only from
  here.**

To go live, replace the body of each getter with a Supabase query. The clients
in `src/lib/supabase/` are ready; the signatures don't change, so no page or
component needs editing.

## Design system

- **Tokens.** `globals.css` defines OKLCH color tokens for light and `.dark`.
  Dark is the default (`next-themes`, `attribute="class"`).
- **Tones.** `status.ts` maps every vocabulary (`healthy`, `online`, `active`,
  `at_risk`, `sev2`, `in_progress`, …) to one of six tones, and each tone to dot
  / text / badge / soft classes. `StatusBadge`, `StatusDot`, and `TrendPill`
  consume it.
- **Component layers.** Compose upward, never sideways-into-pages:
  `ui/` → `shared/` → `dashboard/` → pages.

## Adding a new page

1. Add an entry to `src/config/nav.ts` (icon + title + description). Navigation
   is data, so the sidebar and page headers pick it up automatically.
2. Create `src/app/(app)/<route>/page.tsx` as an `async` server component.
3. Read data via getters in `src/lib/data` (add a new getter + seed file if the
   page needs new data).
4. Build the UI from `shared/` primitives and `ui/` components. Start every page
   with `<PageHeader />`.

## Adding a new widget to the homepage

1. Create `src/components/dashboard/<name>-widget.tsx` as an `async` server
   component that fetches its own data and renders inside `<WidgetCard>`.
2. Drop it into the grid in `src/app/(app)/page.tsx`.

## Non-goals for v0.1

- No authentication / login.
- No live database (Supabase is scaffolded, not wired).
- No write-back actions (inbox buttons are visual).
- No test suite or CI beyond typecheck, lint, and build.

Each is a clean follow-up, not a rewrite.
