# Risk Register — Bridge

**Owner:** Hermes (Bridge CTO Office)
**Updated:** July 19, 2026
**Scope:** Ruby Reservations + Bridge HQ

---

## P0 — Critical

| ID | Risk | L | I | Status | Mitigation | Owner |
|----|------|---|----|--------|------------|-------|
| R-001 | Supabase project unavailable | Low | Critical | 🟢 Monitoring | App shows "unavailable" message. Emergency Google Form prepared. | Hermes |
| R-002 | Double-booking due to race condition | Low | Critical | 🟢 Mitigated | `FOR UPDATE` row lock + capacity check in atomic `book_reservation()` RPC. | HyperAgent |
| R-003 | Service-role key exposed in client code | Low | Critical | 🟢 Mitigated | `import "server-only"` guard. Code review enforced. | Hermes |
| R-004 | DNS misconfiguration takes down reservation domain | Low | Critical | 🟡 Documentation | Domain-separation plan ready. Requires CEO approval. | CEO |

---

## P1 — High

| ID | Risk | L | I | Status | Mitigation | Owner |
|----|------|---|----|--------|------------|-------|
| R-005 | Reservation domain exposes Bridge HQ auth | Resolved | High | 🟢 Fixed | Host-aware middleware redirects Bridge routes to /reserve. |
| R-006 | Role self-escalation via profiles RLS | Resolved | High | 🟢 Fixed | `profiles_self_update` dropped. `update_own_display_name()` SECURITY DEFINER. | HyperAgent |
| R-007 | Agent identity spoofing in report submission | Resolved | High | 🟢 Fixed | RLS checks `agent::text = public.current_role()::text`. | HyperAgent |
| R-008 | Workforce record ownership bypass | Resolved | High | 🟢 Fixed | `owner_id` column + restricted policy. | HyperAgent |
| R-009 | Admin passcode default on Vercel | Low | High | 🟢 Mitigated | RC commit refuses sign-in on deployed envs without ADMIN_PASSCODE. | HyperAgent |
| R-010 | Silent in-memory bookings on Vercel | Low | High | 🟢 Mitigated | RC refuses bookings on deployed envs without Supabase config. | HyperAgent |

---

## P2 — Medium

| ID | Risk | L | I | Status | Mitigation | Owner |
|----|------|---|----|--------|------------|-------|
| R-011 | Free tier DB limit (500 MB) exceeded | Medium | Medium | 🟢 Monitoring | Daily check. Upgrade to Pro when needed. | Hermes |
| R-012 | Vercel cold start latency | High | Low | 🟢 Accepted | Acceptable for MVP. Users see a brief loading state. | — |
| R-013 | Decision processing not atomic (previous) | Resolved | Medium | 🟢 Fixed | `record_decision` RPC now transactional with FOR UPDATE. | HyperAgent |
| R-014 | No duplicate-decision RLS guard | Low | Low | 🟢 Accepted | UI button disabled after click via React useTransition. App-level prevention. | HyperAgent |
| R-015 | Backup upload to Drive fails | Medium | Medium | 🟢 Monitoring | Manual fallback via Supabase Dashboard. | Hermes |
| R-016 | Build failures on Preview | Medium | Medium | 🟡 Active | HyperAgent monitors build logs. Immediate fix cycle. | HyperAgent |
| R-017 | Resend email not configured for reservations | Medium | Medium | 🟢 Noted | Email input hidden (CTO escape hatch). No data collected without send capability. | CEO |

---

## P3 — Low

| ID | Risk | L | I | Status | Mitigation | Owner |
|----|------|---|----|--------|------------|-------|
| R-018 | Staff login confusion | Medium | Low | 🟢 Documented | Pre-launch walkthrough documented. Admin login procedure in runbooks. | CEO |
| R-019 | Minor UI bugs on mobile | Medium | Low | 🟢 Accepted | shadcn responsive sidebar. Bugs fixed in post-launch sprint. | HyperAgent |
| R-020 | Env vars not documented for new projects | Medium | Low | 🟡 Active | `.env.example` must be updated for each new project. | HyperAgent |
| R-021 | Secret rotation not documented | Medium | Low | 🟡 Active | Runbook R5 exists. Formalize in operations manual update. | Hermes |
| R-022 | No formal disaster recovery drill | Medium | Low | 🟡 Active | Planned for Q3 2026. | Hermes |

---

## Risk Trends

| Metric | Jul 17 | Jul 18 | Jul 19 |
|--------|--------|--------|--------|
| P0 open | 3 | 1 | 0 |
| P1 open | 5 | 2 | 0 |
| P2 open | 4 | 4 | 3 |
| P3 open | 2 | 3 | 5 |
| **Total open** | **14** | **10** | **8** |

**Trend:** Decreasing. P0/P1 issues resolved. Remaining P2/P3 are procedural, not blocking.

---

*Risk Register is a living document. Update after every incident and before every major release.*