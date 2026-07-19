# Operations Roadmap — Bridge

**Goal:** Bridge is a product, not an experiment. Every quarter, the operations surface area shrinks while reliability increases.

---

## Q3 2026 (Current)

### Foundation

| Item | Status | Owner |
|------|--------|-------|
| Ruby Reservations live (Jul 19-26) | ✅ Delivered | Hermes (monitoring) |
| Bridge HQ v0.1 | ✅ Certified | Hermes |
| Domain isolation hotfix | ✅ Deployed | Hermes |
| Runbooks v1 | ✅ Complete | Hermes |
| Operations Manual v1 | ✅ Complete | Hermes |
| Engineering Checklists v1 | ✅ Complete | Hermes |
| Certification Rules v1 | ✅ Complete | Hermes |
| Risk Register v1 | ✅ Active | Hermes |

### Operational Improvements (Q3)

| Item | Priority | Notes |
|------|----------|-------|
| Separate Vercel projects for reservation + Bridge HQ | High | Domain-separation plan completed. CEO approval needed for execution. |
| Company domain for Bridge HQ | High | Required for proper domain separation. CEO + budget. |
| Automated health-check cron | Medium | Script ready. Needs CEO approval to schedule. |
| Secret rotation documentation | Medium | Procedure exists (runbook R5). Formalize in operations manual. |
| Disaster recovery drill | Medium | Test backup restore process before next launch. |

---

## Q4 2026

### Automation

| Item | Priority | Notes |
|------|----------|-------|
| CI/CD with automated security scanning | High | GitHub Actions + trufflehog for secrets scanning |
| Automated backup verification | High | Verify Supabase backup is restorable |
| Monitoring dashboard (healthchecks.io) | Medium | Free tier, Telegram alerts |
| Log aggregation (Vercel logs → structured analysis) | Medium | Set up log drains |
| Cost tracking dashboard | Low | Track Vercel + Supabase spend |

### Process Improvements

| Item | Priority | Notes |
|------|----------|-------|
| Post-mortem process | Medium | Standardized incident post-mortem template |
| SLA definitions | Medium | Define uptime, response time, recovery time targets |
| On-call rotation | Low | Define escalation path for 24/7 coverage |

---

## Q1 2027

### Scale Readiness

| Item | Notes |
|------|-------|
| Multi-project infrastructure as code | Terraform/Pulumi for Supabase + Vercel config |
| Containerize Hermes agent | Docker image for reproducible ops environment |
| Threat modeling process | Before every major feature, run threat model |
| Penetration testing (third-party) | Annual security audit |
| Disaster recovery automation | Automated restore test on schedule |

---

## Key Metrics to Track

| Metric | Current Target | Q4 Target |
|--------|---------------|-----------|
| Time to deploy (PR → production) | < 30 min | < 15 min |
| Time to rollback | < 60 sec | < 30 sec |
| Time to recover from DB failure | < 2 hours | < 1 hour |
| Preview build success rate | 80%+ | 95%+ |
| P0 incidents per quarter | Track only | 0 |
| Certification score threshold | 75+ (GO WITH CONDITIONS) | 90+ (GO) |

---

*Roadmap is reviewed quarterly. Priorities may shift based on business needs.*