# Engineering Operations Manual — Bridge

**Version:** 1.0
**Date:** July 19, 2026
**Owner:** Bridge CTO Office
**Scope:** All engineering operations for Bridge (Ruby Reservations + Bridge HQ)

---

## 1. Core Principles

| Principle | Why |
|-----------|-----|
| **Separation of concerns** | Reservation system and Bridge HQ are separate Supabase projects, env vars, and will eventually be separate Vercel deployments |
| **Fail-safe over silent fallback** | Deployed environments never fall back to in-memory seed data. Missing config → user sees "unavailable", never silently accepts writes |
| **Secrets never in client** | Service-role keys, admin passcodes, API keys are server-only. `NEXT_PUBLIC_` prefix only for values safe for browser exposure |
| **RLS is the last line of defense** | Anon keys are public. Row-Level Security on every table is what protects data |
| **Audit everything** | Every decision, status change, and report submission is recorded in `mission_events` |
| **No production change without approval** | No merge to main, DNS change, secret rotation, destructive DB action, or paid commitment without CEO approval |

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      VERCEL (Bridge)                         │
│  ┌─────────────────────────┐  ┌──────────────────────────┐  │
│  │  Public Routes          │  │  Authenticated Routes    │  │
│  │                         │  │                          │  │
│  │  /reserve/*             │  │  / (HQ dashboard)        │  │
│  │  /admin/*               │  │  /inbox/*                │  │
│  │                         │  │  /cto/*                  │  │
│  │  No auth required       │  │  /missions/*             │  │
│  │  (RLS-gated)            │  │  /memory/*               │  │
│  └─────────────────────────┘  │  /workforce/*            │  │
│                               │  /settings/*             │  │
│                               │  /reports/*              │  │
│                               │                          │  │
│                               │  Supabase Auth required   │  │
│                               │  Role-gated per page      │  │
│                               └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────┐  ┌─────────────────────────────────┐
│  SUPABASE            │  │  SUPABASE                        │
│  ruby-reservations   │  │  bridge-hq                       │
│  (thimxxfjsib...)    │  │  (uwkxcbadx...)                  │
│  Tokyo               │  │  Tokyo                           │
│                     │  │                                 │
│  Tables:            │  │  Tables:                         │
│  reservations       │  │  profiles                        │
│  email_events       │  │  missions                        │
│                     │  │  mission_events                  │
│  RPCs:              │  │  reports                         │
│  get_availability   │  │  decisions                       │
│  book_reservation   │  │  workforce_status                │
│                     │  │  company_memory                  │
│                     │  │  departments                     │
│                     │  │  credential_rotations            │
└─────────────────────┘  └─────────────────────────────────┘
```

---

## 3. Environment Configuration

### 3.1 Vercel Environment Variables

| Project | Variable | Scope | Required For |
|---------|----------|-------|-------------|
| Bridge | `NEXT_PUBLIC_SUPABASE_URL` | Public | Ruby Reservations connection |
| Bridge | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Anon RLS-gated queries |
| Bridge | `SUPABASE_SERVICE_ROLE_KEY` | Secret | Admin dashboard (conditional) |
| Bridge | `ADMIN_PASSCODE` | Secret | Ruby staff admin gate |
| Bridge | `RESEND_API_KEY` | Secret | Transactional email |
| Bridge | `RESEND_FROM_EMAIL` | Secret | Email from address |
| Bridge | `NEXT_PUBLIC_BRIDGE_SUPABASE_URL` | Public | Bridge HQ Supabase |
| Bridge | `NEXT_PUBLIC_BRIDGE_SUPABASE_ANON_KEY` | Public | Bridge HQ anon queries |
| Bridge | `BRIDGE_SUPABASE_SERVICE_ROLE_KEY` | Secret | Credential rotation only |

### 3.2 Environment Levels

| Level | Purpose | Branch | URL |
|-------|---------|--------|-----|
| Local Dev | Development | Any | `localhost:3000` |
| Preview | Testing | Feature branches | `*.vercel.app` |
| Production | Live | `main` | `reservations.rubyscakedelights.shop` + `bridge-gray-one.vercel.app` |

### 3.3 Env Var Rules

- `NEXT_PUBLIC_` prefix = safe for client-side bundles
- No prefix = server-only. Never import from client components
- Set per environment in Vercel Dashboard (Production / Preview / Development)
- Never commit real values to `.env.example` or any source file

---

## 4. RBAC Model

| Role | Can Do | Cannot Do |
|------|--------|-----------|
| **CEO** | Full access. Assign roles. Record decisions. Approve/reject reports. Manage credentials. | — |
| **CTO** | Read everything. Review reports. Read decisions. Read missions. | Cannot write decisions. Cannot assign roles. Cannot rotate credentials. |
| **HyperAgent** | Submit reports (as self). Read own reports. Read missions. Update own workforce status. | Cannot read other agents' reports. Cannot change role. Cannot write decisions. |
| **Hermes** | Same as HyperAgent. Submit reports (as self). Read own reports. | Same as HyperAgent. |
| **Unassigned** | Can sign in. Can see "Access pending" screen. | Cannot access any HQ features until CEO assigns a role. |

---

## 5. Release Process

```
[Feature branch created]
        │
        ▼
[HyperAgent builds / Hermes reviews]
        │
        ▼
[Vercel auto-deploys Preview]
        │
        ▼
[Hermes operational review]
        │
        ├── P0/P1 issues → HyperAgent fixes → re-review
        ├── P2/P3 issues → Note for backlog → proceed
        └── No issues → Proceed
              │
              ▼
[CTO approval → CEO approval]
        │
        ▼
[Merge to main → Vercel Production auto-deploy]
        │
        ▼
[Hermes verifies production health]
```

---

## 6. Monitoring & Alerting

| Check | Frequency | Action on Failure |
|-------|-----------|-------------------|
| Reservation domain health | Every 15 min (Jul 19) → 30 min (Jul 20+) | Telegram alert → CEO |
| Bridge HQ health | Every 30 min | Telegram alert → CEO |
| SSL expiry | Daily | Alert if < 7 days remaining |
| DB size (Supabase free tier) | Daily | Alert if > 400 MB |
| Backup verification | Daily | Alert if backup not found |
| API error rate | Per-request logging | Investigate if > 5% errors |

---

## 7. Incident Severity Definitions

| Severity | Definition | Response Time | Escalation |
|----------|-----------|---------------|------------|
| **P0** | Site down. Booking failure. Data loss. Security incident. | Immediate | Telegram DM + Phone |
| **P1** | Feature unavailable. Performance degradation. Admin login failure. | 15 min | Telegram group |
| **P2** | Minor bug. Cosmetic issue. Non-critical feature broken. | Next business day | GitHub issue |
| **P3** | Enhancement. Technical debt. Documentation gap. | Scheduled | Backlog |

---

*This manual is a living document. Update as the system evolves.*