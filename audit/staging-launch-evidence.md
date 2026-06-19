# E3C Staging Launch Evidence

Date: 2026-06-19
Exit Gate: READY_FOR_LAUNCH_REVIEW

## Objective

Complete remaining staging blockers:

- E3C-001 DNS
- E3C-002 SSL
- E3C-003 Staging Operator
- E3C-004 Staging Data Policy
- E3C-005 Authenticated Smoke Execution

## Summary

| Item | Status | Evidence |
| --- | --- | --- |
| DNS | PASS | `staging.nextshiftos.com` resolves to `45.77.171.193` |
| SSL | PASS | Let's Encrypt certificate issued for `staging.nextshiftos.com` |
| Staging Operator | PASS | Created through Supabase Admin API and login verified |
| Staging Data Policy | PASS | Dedicated Supabase Project implemented |
| Authenticated Smoke | PASS | Login, Dashboard, Interview, Journey, AI COO, Runtime, Analytics |

## E3C-001 DNS

DNS evidence:

```text
nextshiftos.com NS:
dns1.registrar-servers.com
dns2.registrar-servers.com

nextshiftos.com A:
45.77.171.193

staging.nextshiftos.com A:
45.77.171.193
```

Status: PASS.

## E3C-002 SSL

Certificate evidence:

```text
subject=CN = staging.nextshiftos.com
issuer=C = US, O = Let's Encrypt, CN = YR2
notBefore=Jun 19 06:29:39 2026 GMT
notAfter=Sep 17 06:29:38 2026 GMT
```

Public HTTPS health:

```text
https://staging.nextshiftos.com/api/v1/health -> 200
```

Status: PASS.

## E3C-003 Staging Operator

Staging operator was created through Supabase Admin API in the dedicated staging Supabase project.

Verification:

```text
authCreateStatus=200
loginStatus=200
loginOk=true
```

No staging password, service-role key, database password, or JWT is stored in this report.

Status: PASS.

## E3C-004 Staging Data Policy

Selected and implemented policy:

```text
Dedicated Supabase Project
```

Implementation evidence:

- `.env.staging` on the VPS now points to the dedicated staging Supabase project.
- Staging app image was rebuilt with staging `NEXT_PUBLIC_SUPABASE_*` build args.
- Prisma schema was pushed to the staging DB.
- Existing repository migrations were marked applied for the staging baseline.
- `prisma migrate status` reports the staging DB is up to date.

Prisma evidence:

```text
3 migrations found in prisma/migrations
Database schema is up to date!
```

Status: PASS.

## E3C-005 Authenticated Smoke Execution

See:

```text
audit/staging-authenticated-smoke.md
```

Result:

| Smoke Area | Status |
| --- | --- |
| Login | PASS |
| Dashboard | PASS |
| Interview | PASS |
| Journey | PASS |
| AI COO | PASS |
| Runtime | PASS |
| Analytics | PASS |

Status: PASS.

## Current VPS State

Production:

- `nextshift-app` remains healthy on `127.0.0.1:3000`.
- Production health returns database `ok`.

Staging:

- `nextshift-app-staging` is healthy on `127.0.0.1:3001`.
- `nextshift-redis-staging` is running.
- Nginx routes `https://staging.nextshiftos.com` to staging app.
- Staging health returns database `ok`.

## Remaining Risks

The staging launch gate is complete. Remaining non-blocking risks should stay in the release checklist:

- Staging build still emits the known optional `posthog-js` warning.
- Staging build still emits React hook dependency warnings in AI UI components.
- Build-time static generation still logs dummy DB connection warnings for pages that query Prisma during build.

These warnings existed before E3C and did not block the staging authenticated smoke suite.

## Final Decision

READY_FOR_LAUNCH_REVIEW.

DNS, SSL, dedicated staging Supabase project, verified staging operator, and full authenticated smoke testing are complete.
