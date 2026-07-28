# OS 3.8 Production Readiness Evidence

EVIDENCE_ID=OS3.8-PRODUCTION-READINESS
STATUS=READY
RELEASE_SHA=c8d08a504ec8477880f3cd0fd8c125cdbeee3691
VERIFICATION_ID=OS38-PR-20260728T122043Z
VERIFIED_AT=2026-07-28T12:20:43Z
MIGRATION_REHEARSAL=PASS
MIGRATION_IMAGE_REHEARSAL=PASS
MIGRATION_IMAGE_DIGEST=sha256:f480dc17a807857a6d65cba86f1bca4a017a4edd12c21df53ba8494214912c18
MIGRATION_IMAGE_REVISION=c8d08a504ec8477880f3cd0fd8c125cdbeee3691
BACKUP_SHA256=8f084cd0a2bb393089514eb6e7c989c358712d876996a5dcbd7ba64f37d3bed9
RESTORE_VERIFIED_AT=2026-07-21T06:11:49Z
ROLLBACK_IMAGE_SHA=9bc0cb82f7549a23fc72304f28087eafb7f1842d
PRODUCTION_ENVIRONMENT=production
REQUIRED_REVIEWER=Steven
ENVIRONMENT_PROTECTION=PASS
ENVIRONMENT_VERIFICATION_ID=OS38-ENV-20260728T122043Z
ENVIRONMENT_VERIFIED_AT=2026-07-28T12:20:43Z

## Decision boundary

This artifact records Production Readiness only. It is not Final Release
Approval, does not change the blocked release gate, and does not authorize a
workflow dispatch, migration, deployment, rollback, tag, GitHub Release, or
production mutation.

## Repository and exact-release evidence

- Repository: `sohoteam88/NextShift-OS-2.0`.
- Exact merged `main` release: `c8d08a504ec8477880f3cd0fd8c125cdbeee3691`.
  The release delta from the previous readiness baseline
  (`9bc0cb82f7549a23fc72304f28087eafb7f1842d`, currently running in
  production) is: the brand-builder interview-restart fix (PR #178,
  `8b1370d` — `getUserLatestInterview` now excludes completed interviews so
  restarting the interview cannot resurrect a finished run), documentation
  preservation for the product shape amendment and Fable role charter plus
  business-pack additions (PR #179), the M1 blueprint reversion recording
  that PR #171 only added a `track` default and folding the real
  dual-track-isolation work into W4/T2 (PR #180), the SA1 super-admin user
  data reset work order entering the blueprint index under
  `HUMAN_GATE_ITEMS` (PR #181), and the SA1 implementation itself (PR #182,
  `94ec9b7`/`657e012`/`a516374` — transactional per-user business-data reset
  across 21 tables plus `User.metadata` Brand DNA and wizard-progress keys,
  gated to `platform_admin`, with a deletion receipt and success/failure
  audit trail; Fable-reviewed with two follow-up fixes for confirmation-email
  normalization and best-effort failure-audit isolation).
- The release delta from the prior readiness baseline contains no Prisma
  schema or database migration file. This was confirmed by a `git diff
  --stat` against `prisma/` between the two SHAs (empty diff) in this same
  verification session.
- The production-readiness contract suite completed all 58 fixtures,
  including its disposable PostgreSQL migration rehearsal, at this
  verification session.

## Backup and restore evidence

- Per Fable's release-train #2 ruling (2026-07-26, reaffirmed for this
  release): since this release delta contains no Prisma schema or migration
  file, the full isolated backup-and-restore rehearsal was not rerun.
  `RESTORE_VERIFIED_AT` carries forward unchanged from the last actual
  rehearsal.
- The daily `pg_dump` cron (PR #130) was freshly confirmed healthy in this
  same verification session: the most recent dump is
  `nextshift-20260727-190001.dump` (2026-07-27T19:00:01Z, roughly 16 hours
  before this verification), with checksum
  `BACKUP_SHA256` above recorded directly from the VPS `SHA256SUMS`
  manifest — not hand-typed. This bounds any data-loss window to at most 24
  hours, consistent with Steven's standing pre-real-user execution posture.
- **Standing rule (reaffirmed again):** the next release that includes a
  Prisma schema or migration file must rerun a full backup-and-isolated-
  restore rehearsal before Production Readiness can be recorded, using the
  most recent daily-cron dump as its input material.

## Exact-release migration rehearsal

- A migration image was rebuilt locally from the exact release SHA with
  `scripts/deployment/Dockerfile.migrations`. Its image ID (Config digest) is
  `sha256:f480dc17a807857a6d65cba86f1bca4a017a4edd12c21df53ba8494214912c18`,
  matching `MIGRATION_IMAGE_DIGEST`; its OCI revision is the exact release
  SHA.
- `scripts/deployment/validate-migration-image-runtime.sh` passed all six
  checks: pinned Bash, PostgreSQL client, pnpm, Prisma, entrypoint, exact
  revision, and credential-free environment.
- `scripts/deployment/tests/production-readiness.sh` passed all 58 fixtures,
  including the disposable PostgreSQL migration rehearsal and its catalog,
  ledger, RLS, privilege, atomicity, and idempotency assertions. The rehearsal
  used an isolated local database and did not contact production.

## Production Environment protection

- GitHub Environment: `production`, environment ID `18470894538`.
- The protection snapshot was read directly from the GitHub Environment API by
  `scripts/deployment/verify-environment-protection.sh` in this same session.
- Required reviewer `sohoteam88`, protection rules `branch_policy` and
  `required_reviewers`, and the custom main-branch policy all matched the
  Final Release gate expectations. No Environment setting, secret, or
  variable was changed.

## Current production and rollback evidence

- The exact rollback target was read directly from the VPS over the deploy
  SSH identity in this same session. `nextshift-app:latest` is healthy and
  its revision/tag is `9bc0cb82f7549a23fc72304f28087eafb7f1842d`, exactly
  matching `ROLLBACK_IMAGE_SHA`, with image ID
  `sha256:0ad284250ba791cec4fb29d67282ebd8c5f056ef783b356b5653c4f69edf933c`.
  This is the currently running, verified healthy production image and is
  the exact rollback target if this release must be reverted.
- No container, image, tag, runtime environment, credential, or service was
  modified by this evidence collection.

## Verification result

All repository-controlled and independently readable Production Readiness
evidence was consistent at the recorded verification time. Production
Readiness is therefore `READY`; Final Release review for the exact SHA remains
pending and the canonical release gate remains `blocked`.
