# E3C Staging Authenticated Smoke

Date: 2026-06-19
Status: PASS

## Objective

Run authenticated staging smoke tests for:

- Login
- Dashboard
- Interview
- Journey
- AI COO
- Runtime
- Analytics

## Target

```text
https://staging.nextshiftos.com
```

## Environment

| Item | Status |
| --- | --- |
| DNS | PASS, `staging.nextshiftos.com -> 45.77.171.193` |
| HTTPS | PASS, Let's Encrypt certificate issued |
| Staging app | PASS, `nextshift-app-staging` healthy |
| Staging Redis | PASS, `nextshift-redis-staging` running |
| Staging Supabase | PASS, dedicated staging project configured |
| Staging DB schema | PASS, Prisma schema pushed and migration status clean |
| Staging operator | PASS, created through Supabase Admin API |

No service-role key or password is stored in this report.

## Pre-Checks

Health endpoint:

```json
{"status":"ok","version":"0.1.0","services":{"database":"ok"}}
```

Certificate evidence:

```text
subject=CN = staging.nextshiftos.com
issuer=C = US, O = Let's Encrypt, CN = YR2
notAfter=Sep 17 06:29:38 2026 GMT
```

Prisma staging DB:

```text
3 migrations found in prisma/migrations
Database schema is up to date!
```

## Authenticated Smoke Results

| Smoke Area | Result | Evidence |
| --- | --- | --- |
| Login | PASS | Supabase Auth token endpoint succeeded; `/api/v1/auth/me` returned staging operator |
| Dashboard | PASS | `/dashboard` rendered tenant dashboard for staging operator |
| Interview | PASS | `/brand-builder/step/interview` rendered Brand Discovery interview flow |
| Journey | PASS | `/journey` rendered growth journey and current goal |
| AI COO | PASS | AI/content command surface rendered through `/content-engine` after route resolution |
| Runtime | PASS | `/ai-workforce` rendered AI workforce runtime surface |
| Analytics | PASS | `/analytics` rendered tenant analytics surface |

## Route Evidence

```text
Login: PASS, loginPage=200, auth/me=200
Dashboard: PASS, status=200, /dashboard
Interview: PASS, status=200, /brand-builder/step/interview
Journey: PASS, status=200, /journey
AI COO: PASS, status=200, /content-engine
Runtime: PASS, status=200, /ai-workforce
Analytics: PASS, status=200, /analytics
```

## Notes

- Browser login did not rely on the public signup email path.
- Staging operator was created through Supabase Admin API using the dedicated staging service-role key.
- Staging image was rebuilt with staging `NEXT_PUBLIC_SUPABASE_*` build args so the browser bundle uses the staging Supabase project.
- Build completed with existing non-blocking warnings already seen in E3: optional `posthog-js`, React hook warnings, and build-time dummy DB warnings during static generation.

## Decision

PASS.

The authenticated staging smoke suite is complete.
