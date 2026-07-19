# Domain Separation Plan — Bridge HQ + Ruby Reservations

**Date:** July 19, 2026
**Author:** Bridge CTO Office
**Status:** Recommended — no purchase or DNS changes without CEO approval

---

## Current State (Single Vercel Project)

```
Both systems share one Vercel project (bridge-gray-one.vercel.app):
  ┌─ reservations.rubyscakedelights.shop ──┐
  │  → /reserve  (Ruby reservation form)    │
  │  → /admin    (Ruby staff dashboard)     │
  │  ⚠️ /login   (Bridge HQ — HOTFIX FIXED) │
  └─────────────────────────────────────────┘

The hotfix (Mission #002F) hides Bridge routes from the reservation domain,
but the underlying code still shares the same Vercel deployment.
```

---

## Recommended: Two Vercel Projects (Production)

```
┌─────────────────────────┐   ┌────────────────────────────┐
│  Vercel Project A       │   │  Vercel Project B          │
│  "ruby-reservations"    │   │  "bridge-hq"               │
│                         │   │                            │
│  reservations.ruby...   │   │  bridge.<company>.com      │
│                         │   │  (new domain — TBD)        │
│  ┌─────────────────┐    │   │  ┌─────────────────────┐   │
│  │ /reserve        │    │   │  │ / (HQ dashboard)    │   │
│  │ /admin          │    │   │  │ /inbox              │   │
│  └─────────────────┘    │   │  │ /cto                │   │
│                         │   │  │ /missions           │   │
│  Supabase:              │   │  │ /memory             │   │
│  ruby-reservations      │   │  │ /workforce          │   │
│  (thimxxfjsib...)       │   │  │ /settings           │   │
│                         │   │  └─────────────────────┘   │
│  Only Reservation       │   │                             │
│  code deployed          │   │  Supabase: bridge-hq       │
│                         │   │  (uwkxcbadx...)            │
│  Env vars:              │   │                             │
│  SUPABASE_URL (ruby)    │   │  Env vars:                  │
│  SUPABASE_ANON_KEY      │   │  BRIDGE_SUPABASE_URL        │
│  ADMIN_PASSCODE         │   │  BRIDGE_SUPABASE_ANON_KEY   │
│  RESEND_*               │   │  BRIDGE_SERVICE_ROLE_KEY    │
└─────────────────────────┘   └────────────────────────────┘
```

---

## Migration Steps

| Phase | Action | Risk | Who |
|-------|--------|------|-----|
| **Phase 1** | Create second Vercel project "bridge-hq", connect to same GitHub repo | Low | CEO |
| **Phase 2** | Configure Vercel Project A to deploy only `feat/operation-anniversary` (reservation code) | Low | CEO |
| **Phase 3** | Configure Vercel Project B to deploy `feat/bridge-lite-hq` (Bridge HQ code) | Low | CEO |
| **Phase 4** | Point `reservations.rubyscakedelights.shop` to Project A | Med | CEO |
| **Phase 5** | Acquire company domain (e.g. `kakehashi.dev` or `bridge.<company>`) | Med | CEO |
| **Phase 6** | Point company domain to Project B | Med | CEO |
| **Phase 7** | Remove hotfix middleware (no longer needed — domains are truly separate) | Low | Hermes |
| **Phase 8** | Deploy separate env vars to each project | Low | CEO |

---

## Effort Estimate

| Phase | Time | Complexity | Dependencies |
|-------|------|-----------|-------------|
| Phase 1 | 5 min | Low | CEO in Vercel Dashboard |
| Phase 2 | 5 min | Low | Phase 1 |
| Phase 3 | 5 min | Low | Phase 1 |
| Phase 4 | 5 min | Low | Phase 2 (DNS change) |
| Phase 5 | 10 min | Low | Domain purchase + CEO approval |
| Phase 6 | 5 min | Low | Phase 5 (DNS change) |
| Phase 7 | 10 min | Low | Phase 4+6 |
| Phase 8 | 10 min | Low | All phases above |

**Total CEO time: ~55 minutes**

---

## v0.2 Backlog Items

| Item | Priority | Notes |
|------|----------|-------|
| Company domain for Bridge HQ | High | Without this, the hostname check in middleware is a patch, not a solution |
| Split monorepo into two Vercel projects | Medium | Clean separation of deployment and env vars |
| Reservation-only middleware (no Bridge logic) | Low | Trivial once domains are separate |

> ⚠️ No domain purchase or configuration without CEO approval.