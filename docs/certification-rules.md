# CTO Certification Rules — Bridge

**Purpose:** Standardize how Hermes evaluates production readiness and issues Launch Certificates.

---

## Certification Categories

| Category | Weight | Max Score |
|----------|--------|-----------|
| Security | 30% | 30 |
| Infrastructure | 20% | 20 |
| Operational Readiness | 20% | 20 |
| Documentation | 10% | 10 |
| Testing | 10% | 10 |
| Rollback & Recovery | 10% | 10 |

**Total possible:** 100

---

## Scoring Rules

### Security (30 points)

| Check | Points | Deduction |
|-------|--------|-----------|
| RLS enabled on all tables | 5 | -5 per unprotected table |
| Anon access limited to function grants | 5 | -5 if anon can read tables |
| Service-role key not in client code | 5 | -10 (P0 — automatic NO GO) |
| Auth session handling correct | 5 | -5 if session leaks |
| Admin auth uses httpOnly cookies | 3 | -3 if using localStorage |
| No secrets committed to git | 5 | -10 (P0 — automatic NO GO) |
| Role authorization enforced at app + DB | 2 | -2 if only one layer |

### Infrastructure (20 points)

| Check | Points | Deduction |
|-------|--------|-----------|
| Separate Supabase project (if new system) | 4 | -4 if sharing without isolation |
| Env vars correctly scoped (NEXT_PUBLIC_) | 4 | -4 per mis-scoped var |
| Preview deployment exists and passes | 4 | -4 if no preview |
| Build succeeds without errors | 4 | -4 if build has warnings |
| Vercel config correct | 4 | -4 if missing/corrupt |

### Operational Readiness (20 points)

| Check | Points | Deduction |
|-------|--------|-----------|
| Runbooks documented | 5 | -5 if missing |
| Rollback procedure documented | 5 | -5 if missing |
| Health checks defined | 5 | -5 if missing |
| Emergency fallback prepared | 5 | -5 if missing |

### Documentation (10 points)

| Check | Points | Deduction |
|-------|--------|-----------|
| Architecture documented | 3 | -3 if missing |
| Deployment guide documented | 3 | -3 if missing |
| Env vars documented | 2 | -2 if missing |
| AGENTS.md updated | 2 | -2 if missing |

### Testing (10 points)

| Check | Points | Deduction |
|-------|--------|-----------|
| Critical user path tested | 4 | -4 if untested |
| RLS boundary tested | 3 | -3 if untested |
| Auth flow tested | 3 | -3 if untested |

### Rollback & Recovery (10 points)

| Check | Points | Deduction |
|-------|--------|-----------|
| Deploy rollback documented | 4 | -4 if missing |
| Database recovery documented | 3 | -3 if missing |
| Disaster recovery documented | 3 | -3 if missing |

---

## Verdict Thresholds

| Score | Verdict | Meaning |
|-------|---------|---------|
| **≥ 90** | 🟢 **GO** | Ready for production. Issue Launch Certificate. |
| **75–89** | 🟡 **GO WITH CONDITIONS** | Ready for production after listed conditions are met. |
| **< 75** | 🔴 **NO GO** | P0/P1 blockers exist. Must fix before launch. |

### Automatic NO GO (regardless of score)

| Condition | Why |
|-----------|-----|
| Service-role key found in client code | Exposes full DB access |
| Secrets committed to git | Irreversible exposure |
| RLS not enabled on any production table | No data protection |
| Missing rollback plan | Cannot recover from failure |
| P0 issue found during certification | Must fix before launch |

---

## Certification Process

```
1. Hermes reviews implementation against all criteria
2. Each check marked: ✅ Pass / ⚠️ Warning / ❌ Fail
3. Score calculated
4. Verdict determined
5. Launch Certificate drafted
6. Report submitted to CEO + CTO
7. Certificate issued only after GO verdict
```

---

*These rules apply to all Bridge projects. They may be updated by the CTO.*