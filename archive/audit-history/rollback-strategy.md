# E3 Rollback Strategy

Date: 2026-06-19
Status: WARN

## Scope

This strategy covers application rollback, database rollback, and configuration rollback. It is a readiness document only; no production rollback was executed during E3.

## Rollback Principles

- Prefer forward-fix only for low-risk UI/content issues.
- Roll back immediately for P0 issues: auth bypass, tenant isolation failure, data corruption, migration failure, or production-wide outage.
- Do not attempt ad hoc database reversal in production.
- Treat database restore as a controlled incident response path that requires backup verification and post-restore smoke tests.

## Application Rollback

Required capability:

1. Identify the previous known-good commit or build artifact.
2. Redeploy that version to `/home/deploy/nextshift`.
3. Rebuild/restart the app container with the same production env.
4. Verify `/api/v1/health`.
5. Run smoke tests for login, dashboard, interview, journey, AI COO, runtime, and analytics.

Readiness:

- Docker Compose restart path exists.
- Project runbook has a VPS deployment pattern.
- Previous-image retention is not documented in repo.

Decision: WARN.

## Database Rollback

Required capability:

1. Take a pre-deploy backup before any migration.
2. Confirm restore command is documented.
3. Confirm restore target is isolated from production until validated.
4. Confirm schema and app version compatibility after restore.
5. Reopen traffic only after health and smoke tests pass.

Readiness:

- `audit/backup-strategy.md` exists.
- `audit/restore-runbook.md` exists.
- Restore drill schedule exists in documentation.
- No executed restore drill evidence was found in E3.
- Prisma migration status is currently not clean, which blocks safe launch deployment.

Decision: WARN, with migration readiness as launch blocker.

## Configuration Rollback

Required capability:

1. Keep previous `.env.production` snapshot in secure storage.
2. Roll back build-time public env values by rebuilding the app.
3. Roll back runtime env values by restarting the app container.
4. Confirm no secrets are committed to git or printed in logs.

Readiness:

- `.env.production.example` and `audit/env-contract-v1.md` exist as contract references.
- Production env remains external to git.
- No automated env diff or signed config snapshot process was verified.

Decision: WARN.

## Rollback Triggers

Immediate rollback or traffic freeze:

- Tenant data leakage.
- Auth bypass or privilege escalation.
- Failed migration during deploy.
- Data corruption.
- Login unavailable for normal users.
- Health endpoint database failure.
- App container crash loop.

Controlled rollback or forward fix:

- Non-critical UI copy issue.
- Isolated low-impact feature warning.
- Recoverable analytics-only issue.

## Recovery Validation

After rollback or restore, run:

1. `/api/v1/health`
2. Login smoke test.
3. Dashboard smoke test.
4. Brand interview smoke test.
5. Journey smoke test.
6. AI COO/runtime smoke test.
7. Analytics visibility smoke test.
8. Error/log review for new P0/P1 events.

## Decision

WARN. Rollback paths are documented, but a launch-grade rollback posture requires a verified restore drill, previous artifact/image retention evidence, and clean migration readiness.
