# OS 3.8 Production Readiness Evidence

EVIDENCE_ID=OS3.8-PRODUCTION-READINESS
STATUS=READY
RELEASE_SHA=9bc0cb82f7549a23fc72304f28087eafb7f1842d
VERIFICATION_ID=OS38-PR-20260726T083250Z
VERIFIED_AT=2026-07-26T08:32:50Z
MIGRATION_REHEARSAL=PASS
MIGRATION_IMAGE_REHEARSAL=PASS
MIGRATION_IMAGE_DIGEST=sha256:3626d26f604a1dc1befd27d2e2e6247460c3eab990e18f962899c7ba2c4674d4
MIGRATION_IMAGE_REVISION=9bc0cb82f7549a23fc72304f28087eafb7f1842d
BACKUP_SHA256=90192a8c71fe7b3fa57a0011909a1cf2fbc4f2e93fe4b6fc29ce9a7ff3360ffb
RESTORE_VERIFIED_AT=2026-07-21T06:11:49Z
ROLLBACK_IMAGE_SHA=2a6fd20552573efedd884a578384923a084e69f0
PRODUCTION_ENVIRONMENT=production
REQUIRED_REVIEWER=Steven
ENVIRONMENT_PROTECTION=PASS
ENVIRONMENT_VERIFICATION_ID=OS38-ENV-20260726T083250Z
ENVIRONMENT_VERIFIED_AT=2026-07-26T08:32:50Z

## Decision boundary

This artifact records Production Readiness only. It is not Final Release
Approval, does not change the blocked release gate, and does not authorize a
workflow dispatch, migration, deployment, rollback, tag, GitHub Release, or
production mutation.

## Repository and exact-release evidence

- Repository: `sohoteam88/NextShift-OS-2.0`.
- Exact merged `main` release: `9bc0cb82f7549a23fc72304f28087eafb7f1842d`.
  The release delta from the previous readiness baseline
  (`2a6fd20552573efedd884a578384923a084e69f0`, currently running in
  production) is the full OS 3.9 Wave 3 delivery plus a dogfood-diary commit:
  G2 lead-magnet + webinar-center gateway integration (PR #155, blueprint
  mark PR #162), O2 forked interview funnel (PR #163), O3 Brand DNA default
  fill-in with provenance tracking (PR #164), O4 Review Room retirement in
  favor of just-in-time fields (PR #165), O5 removal of the pre-generation
  hard readiness gate (PR #166), G3 retirement of the legacy video-production
  pipeline plus an ESLint boundaries config fix (PR #167, blueprint mark PR
  #168), G6 content-library draft deduplication plus a vitest include-scope
  fix (PR #169, blueprint mark PR #170), M1 dual-track isolation follow-through
  for the funnel-copy generation route with a safe `track` default (PR #171),
  and the F-33 root-cause blueprint documentation update (PR #161).
- The release delta from the prior readiness baseline contains no Prisma
  schema or database migration file. This was confirmed twice in this same
  verification session by a full `git diff --stat` against `prisma/` across
  every commit between the two SHAs (empty diff both times).
- The production-readiness contract suite completed all 58 fixtures,
  including its disposable PostgreSQL migration rehearsal, at this
  verification session.

## Backup and restore evidence

- Per Fable's release-train #2 ruling (2026-07-26): since this release delta
  contains no Prisma schema or migration file, the backup and restore
  evidence carries forward unchanged from the prior approved readiness
  baseline, on the same basis as the 2a6fd20 carry-forward — the daily
  `pg_dump` cron (PR #130) continues running with a checksum manifest for
  every run, bounding any data-loss window to at most 24 hours, and Steven's
  standing pre-real-user execution posture accepts this residual data risk.
  `BACKUP_SHA256` and `RESTORE_VERIFIED_AT` are the same values already
  approved for the prior release; no new backup or restore action was
  performed for this release.
- **Standing rule (reaffirmed again):** the next release that includes a
  Prisma schema or migration file must rerun a full backup-and-isolated-
  restore rehearsal before Production Readiness can be recorded, using the
  most recent daily-cron dump as its input material.

## Exact-release migration rehearsal

- A migration image was rebuilt locally from the exact release SHA with
  `scripts/deployment/Dockerfile.migrations`. Its image ID (Config digest) is
  `sha256:3626d26f604a1dc1befd27d2e2e6247460c3eab990e18f962899c7ba2c4674d4`,
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
  its revision/tag is `2a6fd20552573efedd884a578384923a084e69f0`, exactly
  matching `ROLLBACK_IMAGE_SHA`, with image ID
  `sha256:4f9c5d7e15611775176b9198da52e80da9608cb3e1d0ea574fd1b3454794f432`.
  This is the currently running, verified healthy production image and is
  the exact rollback target if this release must be reverted.
- No container, image, tag, runtime environment, credential, or service was
  modified by this evidence collection.

## Verification result

All repository-controlled and independently readable Production Readiness
evidence was consistent at the recorded verification time. Production
Readiness is therefore `READY`; Final Release review for the exact SHA remains
pending and the canonical release gate remains `blocked`.
