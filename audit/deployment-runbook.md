# E3 Deployment Runbook

Date: 2026-06-19
Status: WARN

## Scope

This runbook defines the production deployment sequence for NextShift OS. E3 is an audit-only phase: no production deployment, no DNS change, no VPS change, and no database change were performed.

## Deployment Authority

Canonical production target:

- App domain: `https://nextshiftos.com`
- VPS project directory: `/home/deploy/nextshift`
- Compose file: `docker-compose.prod.yml`
- Production env file: `.env.production`
- Health endpoint: `/api/v1/health`

Current repo evidence:

- `docker-compose.prod.yml` runs the app and Redis with restart policy.
- Project runbook defines the Docker Compose VPS deployment pattern.
- `scripts/deploy-vps.sh` exists but is not canonical for the current VPS path because it uses a PM2/staging-oriented flow.

Decision: WARN.

## Pre-Deploy Gates

All gates must be resolved before a real launch deployment:

1. Confirm clean scoped release branch and reviewed diff.
2. Confirm `.env.production` exists only on the VPS and is not committed.
3. Run `pnpm type-check`.
4. Run security tests.
5. Run tenant isolation tests against a non-production database.
6. Run `pnpm exec prisma validate`.
7. Run `pnpm exec prisma migrate status` against the exact target database.
8. Run `pnpm build` with production-like env values.
9. Confirm backup freshness and rollback checkpoint.
10. Confirm smoke-test operator account and test tenant are available.

## Deployment Steps

Canonical production flow:

1. Package only reviewed release files or sync the reviewed branch.
2. Transfer files to `/home/deploy/nextshift`.
3. Install dependencies if package files changed.
4. Generate Prisma client.
5. Run `prisma migrate deploy` only after `migrate status` is clean and backup is confirmed.
6. Rebuild app container using `docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build app`.
7. Wait for the app container to stabilize.
8. Verify container status.
9. Verify health endpoint returns database `ok`.
10. Run the smoke test suite in `audit/smoke-test-suite.md`.

## Migration Steps

Required sequence:

1. Confirm ADR-024 migration authority remains Prisma.
2. Confirm all migration files are reviewed.
3. Confirm target DB has no unexpected drift.
4. Confirm `pnpm exec prisma validate` passes.
5. Confirm `pnpm exec prisma migrate status` passes against the target DB.
6. Confirm backup was taken before deploy.
7. Run `pnpm exec prisma migrate deploy` during the release window.
8. Re-run health and critical smoke tests.

E3 finding: migration readiness is currently blocked. `prisma validate` passed, but migration status did not pass in audit verification.

## Health Verification

Minimum checks after deploy:

1. `docker compose --env-file .env.production -f docker-compose.prod.yml ps`
2. `curl -s http://localhost:3000/api/v1/health`
3. Confirm response includes `status: ok` and database `ok`.
4. Confirm `/login` renders.
5. Confirm authenticated `/dashboard` renders.
6. Confirm no new P0/P1 errors in app logs.

## Rollback Steps

Application rollback:

1. Stop new deploy if health checks fail.
2. Redeploy previous known-good image or previous known-good source snapshot.
3. Restart app container.
4. Run health check and smoke tests.

Database rollback:

1. Do not rollback schema manually without an approved restore plan.
2. If data corruption or failed destructive migration occurs, restore from the latest verified backup.
3. Validate restored database with health and smoke tests before reopening traffic.

Configuration rollback:

1. Restore previous `.env.production` snapshot from secure storage.
2. Rebuild/restart app if build-time public env changed.
3. Verify health and auth flows.

## E3 Verification Evidence

| Check | Result |
| --- | --- |
| `pnpm type-check` | PASS |
| security tests | PASS, 32 tests |
| tenant isolation tests | PASS, 25 tests |
| `pnpm exec prisma validate` | PASS |
| `pnpm exec prisma migrate status` | FAIL / blocked |
| `pnpm build` | PASS exit code, WARN due build-time warnings and Prisma env noise |

## Decision

WARN. A runbook now exists and the production pattern is known, but the repo still contains stale deployment script evidence and migration readiness blocks launch.
