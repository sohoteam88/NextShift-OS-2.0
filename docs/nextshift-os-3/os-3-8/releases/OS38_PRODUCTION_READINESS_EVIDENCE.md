# OS 3.8 Production Readiness Evidence

EVIDENCE_ID=OS3.8-PRODUCTION-READINESS
STATUS=READY
RELEASE_SHA=c57722b082002c0fe546b1141f9f0e7b3a4f4ad0
VERIFICATION_ID=OS38-PR-20260724T061825Z
VERIFIED_AT=2026-07-24T06:18:25Z
MIGRATION_REHEARSAL=PASS
MIGRATION_IMAGE_REHEARSAL=PASS
MIGRATION_IMAGE_DIGEST=sha256:c752f3dbfcf68bbc2c3e4701ec793c63838354c0b521542db5b0d232d9afd6a0
MIGRATION_IMAGE_REVISION=c57722b082002c0fe546b1141f9f0e7b3a4f4ad0
BACKUP_SHA256=90192a8c71fe7b3fa57a0011909a1cf2fbc4f2e93fe4b6fc29ce9a7ff3360ffb
RESTORE_VERIFIED_AT=2026-07-21T06:11:49Z
ROLLBACK_IMAGE_SHA=86f54a2185d8d981da19a8155055a999af2dc365
PRODUCTION_ENVIRONMENT=production
REQUIRED_REVIEWER=Steven
ENVIRONMENT_PROTECTION=PASS
ENVIRONMENT_VERIFICATION_ID=OS38-ENV-20260724T061825Z
ENVIRONMENT_VERIFIED_AT=2026-07-24T06:18:25Z

## Decision boundary

This artifact records Production Readiness only. It is not Final Release
Approval, does not change the blocked release gate, and does not authorize a
workflow dispatch, migration, deployment, rollback, tag, GitHub Release, or
production mutation.

## Repository and exact-release evidence

- Repository: `sohoteam88/NextShift-OS-2.0`.
- Exact merged `main` release: `c57722b082002c0fe546b1141f9f0e7b3a4f4ad0`,
  the merge commit for PR #141 (batch 2 data-sync and stale Brand DNA
  banners). The PR CI run `30070421893` passed all six required jobs.
- The release delta from the PR #141 first parent contains no Prisma schema or
  database migration file, so the previously approved backup/restore carry
  forward remains within the no-schema-migration rule.
- The production-readiness contract suite completed all 58 fixtures, including
  its disposable PostgreSQL migration rehearsal, at this verification session.

## Backup and restore evidence

- Steven explicitly approved reuse of `BACKUP_SHA256` and
  `RESTORE_VERIFIED_AT` on 2026-07-23 because this release has no database
  schema migration delta. These are the only carried-forward readiness fields.
- `BACKUP_SHA256` is the previously verified checksum-manifest SHA-256; the
  logical backup and isolated restore timestamps remain exactly the approved
  evidence above. No production write was performed for this release.

## Exact-release migration rehearsal

- A migration image was rebuilt locally from the exact release SHA with
  `scripts/deployment/Dockerfile.migrations`. The saved tar's
  `manifest.json` Config entry was `blobs/sha256/c752f3dbfcf68bbc2c3e4701ec793c63838354c0b521542db5b0d232d9afd6a0`,
  and the Config bytes rehashed to the recorded digest; its OCI revision is
  the exact release SHA.
- `scripts/deployment/validate-migration-image-runtime.sh` passed the pinned
  Bash, PostgreSQL client, pnpm, Prisma, entrypoint, exact revision, and
  credential-free environment checks.
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

- The exact rollback target was read directly from the VPS over the deploy SSH
  identity. `nextshift-app:86f54a2185d8d981da19a8155055a999af2dc365` exists,
  has image ID
  `sha256:c453be3cef192d6ac2319b06a960bb4d138c97cbb1bec11f8bda546c5fb31121`,
  and its OCI revision exactly matches `ROLLBACK_IMAGE_SHA`.
- No container, image, tag, runtime environment, credential, or service was
  modified by this evidence collection.

## Verification result

All repository-controlled and independently readable Production Readiness
evidence was consistent at the recorded verification time. Production
Readiness is therefore `READY`; Final Release review for the exact SHA remains
pending and the canonical release gate remains `blocked`.
