# Engineering Checklists — Bridge

---

## Pre-Deployment Checklist

```
□ All P0/P1 issues resolved
□ Preview deployment builds successfully
□ Preview connected to live Supabase (not seed data)
□ Auth flow works (login, session, role gate)
□ Critical user paths tested:
    □ Reservation: form → submit → confirmation
    □ Admin: login → approve → cancel
    □ Bridge HQ: sign in → role gates respected
□ No secrets in client-side code verified
□ RLS tested with anon key against direct table access
□ Database migrations applied (if applicable)
□ Env vars set for Production environment
□ CTO review complete
□ CEO approval obtained
```

---

## Release Checklist

```
□ Merge to main approved
□ Vercel production build passing
□ Production URL responds HTTP 200
□ /reserve loads correctly
□ Reservation submission works against live Supabase
□ Admin login works
□ Supabase connectivity verified
□ Rollback plan confirmed
□ Launch Certificate issued (if first launch)
```

---

## Incident Response Checklist

```
□ Incident confirmed?
□ Severity assessed (P0/P1/P2/P3)?
□ CEO notified (Telegram)?
□ Mitigation action taken (rollback / feature flag / emergency form)?
□ Status communicated to team?
□ Root cause identified (after restoration)?
□ Fix deployed?
□ Risk Register updated?
```

---

## Security Review Checklist

```
□ RLS enabled on all tables
□ RLS forced (no bypass)
□ Table access revoked from anon/authenticated (only function grants)
□ Service-role key never in client code
□ Admin cookies: httpOnly, sameSite, secure in production
□ Passcode/token comparison uses timing-safe function
□ Auth session handling: middleware gates (app) routes
□ Role authorization enforced at app level + DB level (defense in depth)
□ No secrets committed to git
□ .env.example contains no real values
□ API routes validate Bearer tokens independently
```

---

## Quarterly Operations Review

```
□ All production env vars reviewed — any stale/expired keys?
□ SSL certificates — any expiring within 30 days?
□ Supabase project — DB size, backups running?
□ Risk Register reviewed — new risks added, old ones closed?
□ Runbooks updated — any new procedures needed?
□ Disaster recovery drill completed — backup restore tested?
□ Incident response drill completed — team knows the process?
```

---

## New Project / New Service Checklist

```
□ Separate Supabase project created (not sharing with existing projects)
□ Separate env var namespace established
□ Separate branch created
□ RLS policies designed and tested
□ RBAC model defined
□ Migration directory created under supabase/<project>/
□ AGENTS.md updated with project isolation rules
□ Env vars documented in .env.example
□ Docs/DEPLOYMENT.md updated
□ Monitoring checks defined
□ Runbooks created for deployment, rollback, recovery
```

---

*Checklists should be printed and walked through, not skimmed.*