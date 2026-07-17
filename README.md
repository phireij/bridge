# Bridge

**The digital headquarters of Kakehashi — where the CEO starts every morning.**

Bridge is not a generic admin dashboard. It's a single pane of glass over the
whole company: today's priorities, company health, the current sprint, the AI
workforce, the CEO inbox, recent decisions, and upcoming milestones — all on the
homepage, the moment you log in.

> **v0.1 (MVP).** Every page is fully built and populated with realistic seeded
> company data so Bridge already feels like a real HQ on day one. The data layer
> is designed to swap over to live Supabase queries without touching the UI.

---

## Highlights

- **Headquarters homepage** — a time-aware "Good morning, Philip" briefing with
  eight live widgets.
- **Eight sections** — Headquarters, CEO Inbox, CTO Office, AI Workforce, Ruby,
  Company Memory, Infrastructure, and Settings. None are placeholders; each is a
  real, populated page.
- **Modern, responsive UI** — collapsible sidebar, sticky top bar with a live
  JST clock, and layouts that work from phone to ultrawide.
- **Dark mode by default** — with light and system options (`next-themes`).
- **Clean architecture** — a typed data-access layer, reusable component
  primitives, and a consistent design language driven by a single status/tone map.

## Tech Stack

| Layer        | Choice                                             |
| ------------ | -------------------------------------------------- |
| Framework    | [Next.js 16](https://nextjs.org) (App Router, RSC) |
| Language     | TypeScript (strict)                                |
| Styling      | Tailwind CSS v4 (OKLCH tokens)                     |
| Components   | [shadcn/ui](https://ui.shadcn.com) (Radix)         |
| Icons        | lucide-react                                       |
| Theming      | next-themes                                        |
| Backend      | [Supabase](https://supabase.com) (scaffolded)      |

## Getting Started

### Prerequisites

- Node.js **20+**
- [pnpm](https://pnpm.io) **10+**

### Install & run

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

### Other scripts

```bash
pnpm build          # production build
pnpm start          # serve the production build
pnpm lint           # eslint
pnpm typecheck      # tsc --noEmit
```

## Environment Variables

Bridge v0.1 runs entirely on seeded data — **no environment variables are
required** to run it. When you're ready to connect Supabase, copy the example
file and fill it in:

```bash
cp .env.example .env.local
```

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # root: fonts, theme + tooltip providers, toaster
│   ├── globals.css             # Tailwind v4 + design tokens (light/dark)
│   └── (app)/                  # authenticated shell (sidebar + top bar)
│       ├── layout.tsx          # SidebarProvider + AppSidebar + TopBar
│       ├── page.tsx            # Headquarters (the morning briefing)
│       ├── inbox/              # CEO Inbox
│       ├── cto/                # CTO Office
│       ├── workforce/          # AI Workforce
│       ├── ruby/               # Ruby's Cake Delights
│       ├── memory/             # Company Memory
│       ├── infrastructure/     # Infrastructure
│       └── settings/           # Settings
├── components/
│   ├── ui/                     # shadcn/ui primitives
│   ├── layout/                 # app-sidebar, top-bar, nav-user
│   ├── shared/                 # page-header, stat-card, status-badge, trend-pill
│   ├── dashboard/              # homepage widgets + widget-card + agent-avatar
│   ├── settings/               # appearance control
│   ├── theme-provider.tsx
│   └── mode-toggle.tsx
├── config/                     # site + navigation config
└── lib/
    ├── data/                   # ← the data-access layer (see below)
    ├── supabase/               # browser + server clients (scaffolded)
    ├── status.ts               # status → tone → classes (one source of truth)
    ├── format.ts               # formatting helpers
    └── utils.ts                # cn()
```

## The Data Layer (and how to go live)

Every page and widget reads company state through **`src/lib/data/index.ts`** —
never by importing seed files directly. Today those functions return typed seed
data; to go live, swap each body for a Supabase query. The signatures — and
therefore the entire UI — stay identical.

```ts
// today (seeded)
export async function getPriorities(): Promise<Priority[]> {
  return priorities;
}

// later (live) — no call-site changes anywhere
export async function getPriorities(): Promise<Priority[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("priorities").select("*");
  return data ?? [];
}
```

Because the getters are already `async`, flipping to Supabase is a
find-and-replace inside one folder.

## Design Notes

- **Monochrome base, semantic accents.** The neutral shadcn theme keeps the HQ
  calm and serious; color is reserved for meaning (emerald = healthy, amber =
  attention, rose = urgent, sky/violet = in-flight/agents). All of it flows
  through `src/lib/status.ts`, so a status renders identically everywhere.
- **Component layers.** `ui/` (primitives) → `shared/` (reusable app pieces) →
  `dashboard/` (composed widgets) → pages. See
  [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Roadmap (v0.2 candidates)

- Live Supabase tables + Row Level Security, replacing the seed layer.
- Authentication (Supabase Auth) and a real login.
- Wire widgets to live sources (WooCommerce, GitHub, social, Yamato).
- Real inbox actions (approve/defer) writing back to the database.
- Error monitoring (Sentry) and automated backups.

## Credits

Built with [shadcn/ui](https://ui.shadcn.com) (MIT), inspired by the layout
conventions of modern admin templates such as
[TailAdmin](https://github.com/TailAdmin/free-nextjs-admin-dashboard) (MIT).
