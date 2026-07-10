# DEP-001 Deployment Readiness Report

Date: 2026-07-06

Branch: `planning/os-3.1-mvp-governance`

Status: Ready for deployment audit with database migration condition

---

## Purpose

Prepare NextShift for first production deployment by documenting the deployment runbook, environment contract, Supabase to Prisma migration sequence, VPS readiness, health checks, and rollback plan.

No runtime feature changes were made.

---

## Deployment Authority

Canonical production target:

| Area | Authority |
| --- | --- |
| Production domain | `https://nextshiftos.com` |
| VPS project directory | `/home/deploy/nextshift` |
| Compose file | [docker-compose.prod.yml](../docker-compose.prod.yml) |
| Production env file | `.env.production` on VPS only |
| Production container | `nextshift-app` |
| Redis container | `nextshift-redis` |
| Public app port | `127.0.0.1:3000` behind reverse proxy |
| Health endpoint | `/api/v1/health` |
| GitHub deployment workflow | [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) |

Deployment must follow STD-004 release governance and STD-005 GitHub alignment before production promotion.

---

## Deployment Runbook

### Pre-Deployment Gates

1. Confirm approved release decision and clean scoped release diff.
2. Confirm deployment branch and commit are aligned with the release decision.
3. Confirm `.env.production` exists only on the VPS or secure deployment environment.
4. Confirm required GitHub secrets exist for deployment workflow:
   - `VPS_HOST`
   - `VPS_SSH_KEY`
5. Confirm production env values are present without printing secrets.
6. Run local validation:
   - `pnpm type-check`
   - `pnpm test`
   - `pnpm exec prisma validate`
7. Confirm database migration readiness for the exact target database.
8. Confirm backup freshness and rollback checkpoint.
9. Confirm smoke-test operator account and test tenant are available.

### Deployment Sequence

1. Build Docker image from the approved commit.
2. Transfer Docker image artifact and [docker-compose.prod.yml](../docker-compose.prod.yml) to `/home/deploy/nextshift`.
3. On VPS, load and tag the image:

   ```bash
   docker load < image.tar.gz
   docker tag nextshift-app:<commit> nextshift-app:latest
   ```

4. Confirm `.env.production` is present and not world-readable.
5. Run Prisma migration sequence only after migration readiness is approved.
6. Start or update the app:

   ```bash
   docker compose --env-file .env.production -f docker-compose.prod.yml up -d app
   ```

7. Confirm container status:

   ```bash
   docker compose --env-file .env.production -f docker-compose.prod.yml ps
   ```

8. Run health checks and smoke tests.
9. Remove transient deployment artifacts such as `image.tar.gz`.
10. Record deployment evidence, commit SHA, health response, smoke results, and rollback checkpoint.

---

## Environment Validation

Production environment values must be provided through `.env.production` on the VPS or the approved deployment secret store. Do not commit real values.

Required variables:

| Variable | Purpose | Source |
| --- | --- | --- |
| `NODE_ENV` | Production runtime mode | [.env.production.example](../.env.production.example) |
| `NEXT_PUBLIC_APP_URL` | Public application origin | [.env.production.example](../.env.production.example) |
| `NEXT_PUBLIC_BASE_DOMAIN` | Public base domain | [.env.production.example](../.env.production.example) |
| `DATABASE_URL` | Prisma runtime database connection | [.env.production.example](../.env.production.example) |
| `DIRECT_URL` | Prisma direct migration connection | [.env.production.example](../.env.production.example) |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser-safe Supabase project URL | [.env.production.example](../.env.production.example) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe Supabase anon key | [.env.production.example](../.env.production.example) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase service role key | [.env.production.example](../.env.production.example) |
| `NEXTAUTH_SECRET` | Auth/session secret | [.env.production.example](../.env.production.example) |
| `NEXTAUTH_URL` | Auth callback origin | [.env.production.example](../.env.production.example) |

Conditional variables:

| Variable | Condition |
| --- | --- |
| At least one AI provider key | Required for AI flows expected in production |
| `REDIS_URL` | Required for Docker Redis or Upstash Redis integration |
| `REDIS_TOKEN` | Required only for Upstash Redis |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Required when Sentry monitoring is enabled |
| Payment provider keys | Required only when payment flows are enabled |
| WhatsApp and email provider keys | Required only when those integrations are enabled |

Validation command pattern:

```bash
node -e "for (const key of ['DATABASE_URL','DIRECT_URL','NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','NEXTAUTH_SECRET','NEXTAUTH_URL']) if (!process.env[key]) { console.error(key); process.exitCode = 1 }"
```

This command prints missing key names only. It must not print secret values.

---

## Supabase To Prisma Migration Sequence

DEP-001 treats Supabase as the database host/provider and Prisma as the schema migration authority.

Required sequence:

1. Confirm the intended Supabase project and database are non-production, staging, or production according to the release gate.
2. Confirm `DATABASE_URL` points to the pooled/runtime database connection.
3. Confirm `DIRECT_URL` points to the direct database connection used for Prisma migrations.
4. Take a pre-migration backup or Supabase restore point.
5. Confirm application maintenance window and rollback owner.
6. Validate the Prisma schema:

   ```bash
   pnpm exec prisma validate
   ```

7. Check migration status against the exact target database:

   ```bash
   pnpm exec prisma migrate status
   ```

8. If the target database is already baselined, record the baseline decision before deploy.
9. Apply migrations only after backup and status are approved:

   ```bash
   pnpm exec prisma migrate deploy
   ```

10. Generate Prisma client if needed:

    ```bash
    pnpm db:generate
    ```

11. Run Mission Engine and full repository validation against the target or release-validation database.
12. Run application health checks and post-deploy smoke tests.

Migration limitation:

- INT-001 validation showed `prisma migrate deploy` from an empty database fails because migration `20260612110000_mission_engine_core` references existing `tenants` and `users` tables.
- DEP-001 production release must either validate against an already baselined target database or record an approved migration baseline/resolution before production migration execution.

---

## VPS Readiness

Required VPS state:

| Check | Expected State |
| --- | --- |
| Project directory | `/home/deploy/nextshift` exists |
| Compose file | `docker-compose.prod.yml` present |
| Production env | `.env.production` present and not committed |
| Docker | Docker engine available |
| Compose | Docker Compose v2 available |
| Redis | `nextshift-redis` managed by compose |
| App | `nextshift-app` managed by compose |
| Reverse proxy | Routes public traffic to `127.0.0.1:3000` |
| TLS | Valid certificate for `nextshiftos.com` |
| Disk | Enough space for current and previous image |
| Logs | Docker logs accessible to deploy operator |

VPS readiness verification:

```bash
cd /home/deploy/nextshift
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker images | grep nextshift-app
```

No VPS changes were performed during DEP-001 Stop A.

---

## Health Checks

Primary health endpoint:

```bash
curl -fsS http://127.0.0.1:3000/api/v1/health
```

Expected healthy response characteristics:

```text
status: ok
services.database: ok
```

Fallback app-only health endpoint:

```bash
curl -fsS http://127.0.0.1:3000/api/health
```

External health checks:

```bash
curl -fsS https://nextshiftos.com/api/v1/health
curl -I https://nextshiftos.com/login
```

Post-deploy smoke suite:

- [Smoke Test Suite](smoke-test-suite.md)
- Login
- Dashboard
- Interview
- Journey
- AI COO
- Runtime
- Analytics

---

## Rollback Plan

### Rollback Triggers

Immediate rollback or deployment freeze is required for:

- Auth bypass or privilege escalation.
- Tenant isolation failure.
- Failed database migration.
- Data corruption.
- App container crash loop.
- `/api/v1/health` returns degraded due to database failure.
- Login unavailable for normal users.

### Application Rollback

1. Stop the failed rollout.
2. Retag or reload the previous known-good Docker image.
3. Restart the app:

   ```bash
   docker compose --env-file .env.production -f docker-compose.prod.yml up -d app
   ```

4. Verify container status and `/api/v1/health`.
5. Run smoke tests.
6. Record incident and rollback evidence.

### Database Rollback

1. Do not manually reverse production schema changes.
2. Freeze traffic if data integrity is at risk.
3. Restore from the latest verified backup or Supabase restore point.
4. Validate restored schema/app compatibility.
5. Run health checks and smoke tests before reopening traffic.

### Configuration Rollback

1. Restore previous `.env.production` snapshot from secure storage.
2. Rebuild app if public build-time variables changed.
3. Restart app if runtime-only variables changed.
4. Verify health and smoke tests.

---

## Current DEP-001 Decision

DEP-001 readiness documentation is complete.

Production deployment is not authorized by this document alone.

Release promotion remains conditional on:

1. Approved release decision.
2. Verified production/staging database baseline.
3. Successful Prisma migration status against the target database.
4. Backup/restore readiness evidence.
5. Successful health checks and smoke tests against the deployed candidate.
