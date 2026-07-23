# OS 3.8 Production Readiness Evidence

EVIDENCE_ID=OS3.8-PRODUCTION-READINESS
STATUS=READY
RELEASE_SHA=8b2ce429dc58d8f97fca084969fbc30ec4a4c392
VERIFICATION_ID=OS38-PR-20260723T063355Z
VERIFIED_AT=2026-07-23T06:33:55Z
MIGRATION_REHEARSAL=PASS
MIGRATION_IMAGE_REHEARSAL=PASS
MIGRATION_IMAGE_DIGEST=sha256:f514f7351fdf476007898557fd4b28ac0b6d8eefb25efe0556f7413571614ce0
MIGRATION_IMAGE_REVISION=8b2ce429dc58d8f97fca084969fbc30ec4a4c392
BACKUP_SHA256=90192a8c71fe7b3fa57a0011909a1cf2fbc4f2e93fe4b6fc29ce9a7ff3360ffb
RESTORE_VERIFIED_AT=2026-07-21T06:11:49Z
ROLLBACK_IMAGE_SHA=76b573cdbf2f1bec31fe5770c080941469479d25
PRODUCTION_ENVIRONMENT=production
REQUIRED_REVIEWER=Steven
ENVIRONMENT_PROTECTION=PASS
ENVIRONMENT_VERIFICATION_ID=OS38-ENV-20260723T035629Z
ENVIRONMENT_VERIFIED_AT=2026-07-23T03:56:29Z

## Decision boundary

This artifact records Production Readiness only. It is not Final Release
Approval, does not change the blocked release gate, and does not authorize a
workflow dispatch, migration, deployment, rollback, tag, GitHub Release, or
production mutation.

## Repository and exact-release evidence

- Repository: `sohoteam88/NextShift-OS-2.0`
- Exact merged `main`: `8b2ce429dc58d8f97fca084969fbc30ec4a4c392`
- PR #122 merge (rate limiting and drafts):
  `41f8784f09296aa8d85b799f71ade60683c0f359`.
- PR #127 merge (single-build migration artifact integrity and deployment
  diagnostics): `8b2ce429dc58d8f97fca084969fbc30ec4a4c392`.
- PR #127 reviewed head: `db9270a638bcfd7a7f61230658426e6d5a6ea2b2`;
  reviewed-head-to-merge tree delta: zero files.
- PR CI run `29984250240` succeeded for that reviewed head, including the
  migration-image contract, application-image healthcheck contract, complete
  test suite, and E2E suite.
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

- The immutable migration image was rebuilt locally from the exact
  `RELEASE_SHA`; its digest and OCI revision are recorded above and match the
  requested commit.
- The exact image passed the offline migration-image runtime contract.
- No files under `prisma/migrations`, nor the production migration Dockerfile
  or migration runner, changed between the previous rehearsed release SHA
  `41f8784f09296aa8d85b799f71ade60683c0f359` and this exact release SHA.
  The preserved isolated-database Run 1 and Run 2 evidence therefore remains
  applicable to the unchanged migration inputs.
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

- Before this release request, production reported commit
  `86f54a2185d8d981da19a8155055a999af2dc365`, an ancestor of the exact
  release SHA. This evidence does not treat a deploy log as production proof.
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
Readiness is therefore `READY`, while the Final Release review for the exact
SHA above is pending and the canonical release gate remains `blocked`.
