# E3 Go / No-Go Policy

Date: 2026-06-19
Status: PASS

## Purpose

This policy defines release blockers for NextShift OS production launch decisions.

## Decision Labels

- GO: all P0 gates pass, P1 risks have owner-approved mitigation, release checklist complete.
- CONDITIONAL GO: no P0 issues, limited P1 issues accepted by owner with rollback plan.
- NO-GO: any P0 issue exists, or required launch evidence is missing.

## P0 Release Blockers

Any P0 issue means immediate NO-GO:

- Tenant isolation failure.
- Auth bypass.
- Privilege escalation.
- Data corruption.
- Migration failure or unknown migration status.
- Production database unavailable.
- Login unavailable for normal users.
- App cannot boot.
- Health endpoint fails database check.
- Secrets exposed in repo, client bundle, logs, or audit artifacts.

## P1 Release Blockers

P1 issues require owner review and mitigation before launch:

- Runtime failures in AI COO or agent execution.
- Backup unavailable.
- Restore runbook unavailable.
- Restore drill not completed for launch-critical migration.
- Observability unavailable.
- Error tracking unavailable for production incidents.
- Audit trail unavailable for sensitive/admin actions.
- Smoke suite not executed against release candidate.
- Build passes but emits unexplained production-risk warnings.

## P2 Deferrable Issues

P2 issues can be deferred if documented:

- Minor UI copy inconsistency.
- Low-impact analytics display issue.
- Non-critical design polish.
- Non-blocking warning with known owner and follow-up.

## Mandatory GO Evidence

Before GO:

- `pnpm type-check` passes.
- Security tests pass.
- Tenant isolation tests pass.
- `pnpm exec prisma validate` passes.
- `pnpm exec prisma migrate status` passes against target DB.
- Backup is fresh and restorable.
- Restore drill is completed or explicitly waived for non-migration release.
- Production-like build succeeds without launch-risk warnings.
- Smoke suite passes after deployment.
- Health endpoint reports database `ok`.
- Rollback target is identified.

## E3 Application Of Policy

Current E3 status:

- Migration readiness is not clean.
- Restore drill evidence is not present.
- Production smoke suite is not executed.
- Build completed but emitted warnings/noisy Prisma env errors.

Policy result: NO-GO.

## Decision

PASS. The policy is defined. Applying the policy to current E3 evidence results in NOT READY FOR LAUNCH.
