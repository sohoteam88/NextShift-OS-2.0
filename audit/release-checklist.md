# E3 Canonical Release Checklist

Date: 2026-06-19
Status: WARN

## Scope

This is the canonical release checklist for moving NextShift OS from release candidate toward launch candidate. E3 did not deploy to production.

## 1. Source Control

- [ ] Release branch identified.
- [ ] Diff reviewed.
- [ ] Unrelated local changes excluded.
- [ ] No `.env` files, secrets, passwords, service-role keys, or database URLs with credentials committed.
- [ ] GitHub push/PR completed if release process requires it.

## 2. Type Check

- [x] Run `pnpm type-check`.
- [x] E3 result: PASS.

## 3. Tests

- [x] Run targeted security tests.
- [x] Run tenant isolation tests against non-production DB.
- [ ] Run full regression suite before launch.
- [ ] Run browser-based authenticated smoke tests against staging or production candidate.

E3 results:

- Security tests: PASS, 32 tests.
- Tenant isolation tests: PASS, 25 tests.

## 4. Security

- [x] RBAC test coverage checked.
- [x] Rate limit/security tests checked.
- [x] Tenant isolation proof checked.
- [x] Webhook/security remediation evidence checked.
- [ ] Confirm production secrets are present only in secure runtime env.
- [ ] Confirm no public secret leak in built client bundle.

## 5. Backups

- [x] Backup strategy exists.
- [x] Restore runbook exists.
- [x] Restore drill schedule exists.
- [ ] Fresh pre-deploy backup confirmed.
- [ ] Restore drill executed and logged.

## 6. Migrations

- [x] ADR-024 migration authority exists.
- [x] Prisma schema validation passed.
- [ ] `prisma migrate status` passed against target DB.
- [ ] Pending migrations reviewed.
- [ ] `prisma migrate deploy` approved for release window.

E3 result: FAIL for migration readiness. Launch is blocked until migration status is clean against the release target.

## 7. Build

- [x] Run `pnpm build`.
- [x] Build exited successfully.
- [ ] Resolve build warnings before launch:
  - Missing optional/imported `posthog-js` warning surfaced through telemetry tracker import trace.
  - React hook dependency warnings in AI UI components.
  - Static generation logged Prisma errors when database env resolved empty in build context.

## 8. Deployment

- [ ] Confirm production deploy target `/home/deploy/nextshift`.
- [ ] Confirm `docker-compose.prod.yml`.
- [ ] Confirm `.env.production` exists on VPS and is not committed.
- [ ] Confirm previous known-good rollback target.
- [ ] Deploy only after all P0/P1 gates pass.

## 9. Health Checks

- [ ] Confirm app container is running.
- [ ] Confirm `/api/v1/health` returns app `ok`.
- [ ] Confirm database service returns `ok`.
- [ ] Confirm no app crash loop.
- [ ] Confirm logs show no new P0/P1 errors.

## 10. Smoke Tests

- [ ] Login.
- [ ] Dashboard.
- [ ] Interview.
- [ ] Journey.
- [ ] AI COO.
- [ ] Runtime.
- [ ] Analytics.

Use `audit/smoke-test-suite.md`.

## Release Decision Rules

- Any P0 blocker means NO-GO.
- Any failed migration readiness gate means NO-GO.
- Any failed tenant isolation or auth gate means NO-GO.
- Any missing backup before migration means NO-GO.
- P1 issues require explicit owner approval and mitigation before launch.

## Decision

WARN. The checklist exists and several gates passed locally, but full launch execution remains blocked by migration readiness, unexecuted restore drill, and unexecuted staging/production smoke suite.
