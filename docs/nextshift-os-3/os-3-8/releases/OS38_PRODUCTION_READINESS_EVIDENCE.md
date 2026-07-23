# OS 3.8 Production Readiness Evidence

EVIDENCE_ID=OS3.8-PRODUCTION-READINESS
STATUS=READY
RELEASE_SHA=8b2ce429dc58d8f97fca084969fbc30ec4a4c392
VERIFICATION_ID=OS38-PR-20260723T084743Z
VERIFIED_AT=2026-07-23T08:47:43Z
MIGRATION_REHEARSAL=PASS
MIGRATION_IMAGE_REHEARSAL=PASS
MIGRATION_IMAGE_DIGEST=sha256:5d0995b94644af9eef0f51b57958dc4a2a3c7b8201d563b87fdecaaef9a20823
MIGRATION_IMAGE_REVISION=8b2ce429dc58d8f97fca084969fbc30ec4a4c392
BACKUP_SHA256=90192a8c71fe7b3fa57a0011909a1cf2fbc4f2e93fe4b6fc29ce9a7ff3360ffb
RESTORE_VERIFIED_AT=2026-07-21T06:11:49Z
ROLLBACK_IMAGE_SHA=86f54a2185d8d981da19a8155055a999af2dc365
PRODUCTION_ENVIRONMENT=production
REQUIRED_REVIEWER=Steven
ENVIRONMENT_PROTECTION=PASS
ENVIRONMENT_VERIFICATION_ID=OS38-ENV-20260723T084743Z
ENVIRONMENT_VERIFIED_AT=2026-07-23T08:47:43Z

## Decision boundary

This artifact records Production Readiness only. It is not Final Release
Approval, does not change the blocked release gate, and does not authorize a
workflow dispatch, migration, deployment, rollback, tag, GitHub Release, or
production mutation.

## Repository and exact-release evidence

- Repository: `sohoteam88/NextShift-OS-2.0`
- Exact deploy release: `8b2ce429dc58d8f97fca084969fbc30ec4a4c392`.
- Current control-plane `main`: `89064babb1ebbdca17821a73a10cb7f30de7c757`
  (includes #130 backup operations and #131 fixture-time repair).
- PR #122 merge (rate limiting and drafts):
  `41f8784f09296aa8d85b799f71ade60683c0f359`.
- PR #127 merge (single-build migration artifact integrity and deployment
  diagnostics): `8b2ce429dc58d8f97fca084969fbc30ec4a4c392`.
- PR #127 reviewed head: `db9270a638bcfd7a7f61230658426e6d5a6ea2b2`;
  reviewed-head-to-merge tree delta: zero files.
- Control-plane CI run `29989917677` succeeded for the current `main`,
  including migration-image and application-image contracts, complete tests,
  and E2E.
- Deploy workflow runs for the exact merge SHA: zero

## Backup and restore evidence

- Steven explicitly approved reuse of `BACKUP_SHA256` and
  `RESTORE_VERIFIED_AT` on 2026-07-23 because exact release `8b2ce429` has no
  database-schema migration delta. These are the only carried-forward fields.
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

- The immutable migration image was rebuilt locally from exact
  `RELEASE_SHA`; its image ID and OCI revision are recorded above and match
  the requested commit.
- The rebuilt image passed the offline migration-image runtime contract:
  pinned Bash, PostgreSQL client, pnpm, Prisma, entrypoint, exact revision,
  and credential-free image environment were all verified.
- The repository's disposable PostgreSQL migration rehearsal was re-executed
  from the exact release checkout. It completed its migration-inventory,
  ledger, catalog, RLS, and atomicity assertions without contacting
  production.

## Production Environment protection

- GitHub Environment: `production` (environment ID `18470894538`).
- Required-reviewer rule ID: `60472922`.
- The configured reviewer is GitHub user `sohoteam88` (user ID `269462159`),
  the repository identity used for Steven's approval authority.
- Deployment branch policy is restricted to the `main` branch.
- The snapshot was read directly from GitHub during this same verification
  session by `scripts/deployment/verify-environment-protection.sh`; no
  Environment setting, secret, or variable was changed.

## Current production and rollback evidence

- The current production rollback image was re-derived and read directly from
  the VPS: `nextshift-app:86f54a2185d8d981da19a8155055a999af2dc365` exists,
  has image ID
  `sha256:c453be3cef192d6ac2319b06a960bb4d138c97cbb1bec11f8bda546c5fb31121`,
  and its OCI revision exactly matches `ROLLBACK_IMAGE_SHA`.
- No container, image, tag, runtime environment, credential, or service was
  modified.

## Verification result

All repository-controlled and independently readable Production Readiness
evidence was consistent at the recorded verification time. Production
Readiness is therefore `READY`, while the Final Release review for the exact
SHA above is pending and the canonical release gate remains `blocked`.
