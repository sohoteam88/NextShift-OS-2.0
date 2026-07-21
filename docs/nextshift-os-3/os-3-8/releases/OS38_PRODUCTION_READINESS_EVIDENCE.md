# OS 3.8 Production Readiness Evidence

EVIDENCE_ID=OS3.8-PRODUCTION-READINESS
STATUS=READY
RELEASE_SHA=86f54a2185d8d981da19a8155055a999af2dc365
VERIFICATION_ID=OS38-PR-20260721T142928Z
VERIFIED_AT=2026-07-21T14:29:28Z
MIGRATION_REHEARSAL=PASS
MIGRATION_IMAGE_REHEARSAL=PASS
MIGRATION_IMAGE_DIGEST=sha256:037d31d3424f809b35ed0793b37cef84e54dcfac2bd90370b97059834a5cb508
MIGRATION_IMAGE_REVISION=86f54a2185d8d981da19a8155055a999af2dc365
BACKUP_SHA256=90192a8c71fe7b3fa57a0011909a1cf2fbc4f2e93fe4b6fc29ce9a7ff3360ffb
RESTORE_VERIFIED_AT=2026-07-21T06:11:49Z
ROLLBACK_IMAGE_SHA=76b573cdbf2f1bec31fe5770c080941469479d25
PRODUCTION_ENVIRONMENT=production
REQUIRED_REVIEWER=Steven
ENVIRONMENT_PROTECTION=PASS
ENVIRONMENT_VERIFICATION_ID=OS38-ENV-20260721T142928Z
ENVIRONMENT_VERIFIED_AT=2026-07-21T14:29:28Z

## Decision boundary

This artifact records Production Readiness only. It is not Final Release
Approval, does not change the blocked release gate, and does not authorize a
workflow dispatch, migration, deployment, rollback, tag, GitHub Release, or
production mutation.

## Repository and exact-release evidence

- Repository: `sohoteam88/NextShift-OS-2.0`
- Exact merged `main`: `86f54a2185d8d981da19a8155055a999af2dc365`
- PR #116 reviewed head: `b1ed0fa034ee75afd557bdea620bea642d09c8fb`
- Reviewed-head-to-merge tree delta: zero files
- Main CI run `29835684227`: 6/6 required jobs succeeded
- Deploy workflow runs for the exact merge SHA: zero

## Backup and restore evidence

- The production logical backup was created read-only on 2026-07-21 and its
  five SQL files plus release marker revalidated successfully against
  `SHA256SUMS.txt`.
- `BACKUP_SHA256` is the SHA-256 of that repository-external
  `SHA256SUMS.txt` checksum manifest.
- Supabase Storage backup: 15 expected, 15 downloaded, zero missing, zero
  failed; all blob checksums revalidated.
- Isolated PostgreSQL 17 restore completed at `RESTORE_VERIFIED_AT`; its
  checksum manifest revalidated successfully.

## Exact-release migration rehearsal

- The immutable migration image was built from `RELEASE_SHA` and has the
  digest and OCI revision recorded above.
- The preserved isolated database passed formal entrypoint Run 1 and Run 2.
- Migration ledgers, constraints, indexes, triggers, functions, RLS, client
  privilege checks, and catalog assertions passed.
- Business row counts remained byte-identical; row-count SHA-256:
  `e70f42acd96b0d9d43ba2fa2f778d64772c658e6c2fd627cceedf22e2d27e2d2`.
- The merged-main Phase B evidence manifest SHA-256 is
  `e547f1103294fb7ec00e899eeb66a27e800f428278cb175887e8aae52a4cb844`.

## Production Environment protection

- GitHub Environment: `production` (environment ID `18470894538`).
- Required-reviewer rule ID: `60472922`.
- The configured reviewer is GitHub user `sohoteam88` (user ID `269462159`),
  the repository identity used for Steven's approval authority.
- Deployment branch policy is restricted to the `main` branch.
- The snapshot was read directly from GitHub during this verification and no
  Environment setting, secret, or variable was changed.

## Current production and rollback evidence

- Production currently reports commit
  `76b573cdbf2f1bec31fe5770c080941469479d25`, which is an ancestor of the
  exact release SHA.
- The active production container was running with Docker health `healthy`,
  zero restarts, and returned liveness `ok` plus readiness `ok` with database
  `ok` during this read-only verification.
- Exact rollback tag:
  `nextshift-app:76b573cdbf2f1bec31fe5770c080941469479d25`.
- Rollback image digest:
  `sha256:758381747097bef4ea20c6e69c47487c27d720497b15f6987fa289aa64467cf4`.
- The rollback image OCI revision exactly matches `ROLLBACK_IMAGE_SHA`.
- No container, image, tag, runtime environment, credential, or service was
  modified.

## Verification result

All repository-controlled and independently readable Production Readiness
evidence was consistent at the recorded verification time. Production
Readiness is therefore `READY`, while Final Release Approval remains absent
and the canonical release gate remains `blocked`.
