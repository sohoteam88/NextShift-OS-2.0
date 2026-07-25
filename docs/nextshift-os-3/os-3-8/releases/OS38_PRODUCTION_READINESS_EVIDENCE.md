# OS 3.8 Production Readiness Evidence

EVIDENCE_ID=OS3.8-PRODUCTION-READINESS
STATUS=READY
RELEASE_SHA=2a6fd20552573efedd884a578384923a084e69f0
VERIFICATION_ID=OS38-PR-20260725T031918Z
VERIFIED_AT=2026-07-25T03:19:18Z
MIGRATION_REHEARSAL=PASS
MIGRATION_IMAGE_REHEARSAL=PASS
MIGRATION_IMAGE_DIGEST=sha256:43189ded4c4d72ba0f27e326feec610520f39cb297bb3bda29a15f07d9fbdc08
MIGRATION_IMAGE_REVISION=2a6fd20552573efedd884a578384923a084e69f0
BACKUP_SHA256=90192a8c71fe7b3fa57a0011909a1cf2fbc4f2e93fe4b6fc29ce9a7ff3360ffb
RESTORE_VERIFIED_AT=2026-07-21T06:11:49Z
ROLLBACK_IMAGE_SHA=c57722b082002c0fe546b1141f9f0e7b3a4f4ad0
PRODUCTION_ENVIRONMENT=production
REQUIRED_REVIEWER=Steven
ENVIRONMENT_PROTECTION=PASS
ENVIRONMENT_VERIFICATION_ID=OS38-ENV-20260725T031918Z
ENVIRONMENT_VERIFIED_AT=2026-07-25T03:19:18Z

## Decision boundary

This artifact records Production Readiness only. It is not Final Release
Approval, does not change the blocked release gate, and does not authorize a
workflow dispatch, migration, deployment, rollback, tag, GitHub Release, or
production mutation.

## Repository and exact-release evidence

- Repository: `sohoteam88/NextShift-OS-2.0`.
- Exact merged `main` release: `2a6fd20552573efedd884a578384923a084e69f0`.
  The release delta from the previous readiness baseline
  (`c57722b082002c0fe546b1141f9f0e7b3a4f4ad0`) contains PR #145 (funnel
  version banner and editable titles), the OS 3.9 blueprint restructure, and
  the OS 3.9 Wave 1/Wave 2 pipeline deliveries: G0 unified generation gateway
  (PR #147), G1 content-engine gateway wiring (PR #148), a guardrail-test
  follow-up for G1 (PR #150), O1 business-pack data pack (PR #149), G4
  compliance hard-filter with its two Fable-review remediation passes (PR
  #151), and G5 failure visibility with the usage-telemetry best-effort fix
  (PR #152).
- The release delta from the prior readiness baseline contains no Prisma
  schema or database migration file. The business pack (O1) is a static,
  versioned JSON asset with no schema or migration footprint; this was
  confirmed by a full commit-log and schema-diff check across every commit
  between the two SHAs.
- The production-readiness contract suite completed all 58 fixtures, including
  its disposable PostgreSQL migration rehearsal, at this verification session.

## Backup and restore evidence

- Steven and Fable jointly approved reuse of `BACKUP_SHA256` and
  `RESTORE_VERIFIED_AT` on 2026-07-25, on the same no-schema-migration basis
  as the prior carry-forward, plus two additional facts specific to this
  approval: the daily `pg_dump` cron (PR #130) has been running since
  2026-07-23 with a checksum manifest for every run, bounding any data-loss
  window to at most 24 hours; and Steven's standing pre-real-user execution
  posture accepts this residual data risk. These are the only carried-forward
  readiness fields.
- `BACKUP_SHA256` is the previously verified checksum-manifest SHA-256; the
  logical backup and isolated restore timestamps remain exactly the approved
  evidence above. No production write was performed for this release.
- **Standing rule (reaffirmed):** the next release that includes a Prisma
  schema or migration file must rerun a full backup-and-isolated-restore
  rehearsal before Production Readiness can be recorded, and that rehearsal
  must use the most recent daily-cron dump as its input material — end-to-end
  proving the new backup line is actually restorable, not only that it runs.

## Exact-release migration rehearsal

- A migration image was rebuilt locally from the exact release SHA with
  `scripts/deployment/Dockerfile.migrations`. Its image ID (Config digest) is
  `sha256:43189ded4c4d72ba0f27e326feec610520f39cb297bb3bda29a15f07d9fbdc08`,
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

- The exact rollback target was read directly from the VPS over the deploy SSH
  identity. `nextshift-app:latest` is healthy and its revision/tag is
  `c57722b082002c0fe546b1141f9f0e7b3a4f4ad0`, exactly matching
  `ROLLBACK_IMAGE_SHA`, with image ID
  `sha256:8eb5c207b2a8c11b3e792983b546f4a912a05fc78bc2b61afcfb6c7130e6be46`.
  This is the currently running, verified healthy production image and is
  the exact rollback target if this release must be reverted.
- No container, image, tag, runtime environment, credential, or service was
  modified by this evidence collection.

## Verification result

All repository-controlled and independently readable Production Readiness
evidence was consistent at the recorded verification time. Production
Readiness is therefore `READY`; Final Release review for the exact SHA remains
pending and the canonical release gate remains `blocked`.
