# Runbooks — Bridge Operations

---

## R1: Production Deployment

**When:** Feature branch merged to main → Vercel auto-deploys.

```
1. Merge PR to main (requires CTO + CEO approval)
2. Vercel auto-detects push → starts production build
3. Monitor GitHub status checks for build success
4. Verify production URL responds HTTP 200
5. Verify critical paths:
   □ /reserve loads correctly
   □ /admin login renders
   □ / (Bridge HQ) loads (if applicable)
6. Verify Supabase connectivity:
   □ Run: curl -s https://<supabase-url>/rest/v1/rpc/get_availability?p_date=...
7. Post to Telegram: "✅ Deployed <branch> — health check passed"
```

---

## R2: Rollback

**When:** Production deployment has a critical bug.

```
1. Vercel Dashboard → Deployments
2. Find last known-good deployment (previous commit)
3. Click "..." → "Promote to Production"
4. Verify rollback with health check
5. Database: No rollback needed (code and data are separate)
6. Post to Telegram: "↩️ Rolled back to <previous-commit>"

WARNING: Vercel rollback is instantaneous (60s).
         Data is NEVER deleted by a rollback.
```

---

## R3: Emergency Reservation Shutdown

**When:** Critical bug found mid-launch. Need to stop accepting bookings.

```
Option A — Feature flag (if implemented):
   1. Set app toggle to "Fully Booked" state
   2. All slots show 0 remaining
   3. Existing reservations preserved

Option B — Remove reservation access:
   1. Vercel Dashboard → Deployments
   2. Roll back to pre-launch version
   3. Enable emergency Google Form

Option C — DNS redirect:
   1. Point reservations.rubyscakedelights.shop to a static maintenance page
   2. CEO configures at DNS provider

After any option: Post to Telegram. Investigate root cause.
```

---

## R4: Supabase Recovery

**When:** Database corrupted, accidentally deleted, or unavailable.

### If partial data loss (single row/table):
```
1. Supabase Dashboard → Log Explorer
2. Identify the lost data
3. Re-insert via SQL Editor from logs or backup
```

### If full database failure:
```
1. Create new Supabase project
2. Apply migration: supabase/migrations/20260718000000_reservations.sql
3. If backup exists: restore from backup dump
4. Update Vercel env vars with new project URL
5. Redeploy Vercel
```

### If Supabase is inaccessible (outage):
```
1. App auto-shows "Online reservations unavailable — please call"
2. Enable emergency Google Form
3. Staff takes phone reservations manually
4. When Supabase recovers: enter missed reservations
```

---

## R5: Credential Rotation

**When:** Secret suspected compromised or quarterly rotation.

### Bridge HQ (via app — CEO only):
```
1. Bridge HQ → Settings → Credentials
2. Select agent (HyperAgent or Hermes)
3. Click "Rotate" → one-time password shown
4. Share new password with agent via secure channel
```

### Reservation system (Vercel Dashboard):
```
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Update the compromised variable
3. Click Save → automatic redeploy
4. Revoke old key at the provider (Supabase, Resend, etc.)
```

---

## R6: Incident Response

**When:** P0 or P1 incident detected.

```
1. CONFIRM the incident — is it actually happening?
2. ASSESS severity — P0 or P1?
3. NOTIFY — Telegram DM to CEO immediately
4. MITIGATE — Rollback / Feature flag / Emergency form
5. COMMUNICATE — Status to Telegram group
6. ROOT CAUSE — Investigate AFTER restoration
7. FIX — Bug fix → deploy → verify
8. DOCUMENT — Add to Risk Register + lessons learned
```

---

## R7: Domain DNS Change

**When:** Adding or changing a custom domain.

```
1. CEO confirms domain ownership
2. Vercel Dashboard → Project → Domains → Add domain
3. Vercel provides DNS target (CNAME) + verification TXT
4. CEO adds records at DNS provider
5. Wait 1-5 min for propagation (TTL=300s)
6. Vercel auto-provisions SSL certificate
7. Verify: curl -I https://<domain>/reserve
8. Update RESERVATION_SITE_URL env var if needed
⚠️ Requires CEO approval before any DNS change.
```

---

*All runbooks assume the operator has access to Vercel Dashboard, Supabase Dashboard, GitHub, and DNS provider as specified.*