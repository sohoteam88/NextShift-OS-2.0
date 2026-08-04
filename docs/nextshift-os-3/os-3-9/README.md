# OS 3.9 Batch 1 release control

This is the active Batch 1 production release-control plane. OS 3.8 release
artifacts remain immutable historical records; no OS 3.8 request, approval, or
readiness evidence grants authority to this train.

## Authority invariants

- `VERIFIED_AT` and `ENVIRONMENT_VERIFIED_AT` must be byte-identical.
- The Final Release review must be one exact-head `COMMENT` or `APPROVED`
  review from the allowed owner and contain the three FINAL-RELEASE controls.
- The request PR must be merged with Git's merge method; squash merges fail
  ancestry validation.
- Automatic release and deployment remain disabled. Steven performs review,
  approval, dispatch, and any merge of a HUMAN_GATE PR.

## Migration-image preflight

`MIGRATION_REHEARSAL=PASS`, `MIGRATION_IMAGE_REHEARSAL=PASS`, and an exact
`MIGRATION_IMAGE_DIGEST=sha256:<64 lowercase hex>` are required from Stage 1.
`PENDING_STAGE_4` is not a valid OS 3.9 evidence value. The dispatch workflow
builds the migration image from the approved release and fails before any VPS
operation unless its measured Docker image ID equals the preflight digest.
It checks the same digest again against the transferred artifact before the
migration runs.

## Rollback anchor

The readiness evidence records all three values below:

- `ROLLBACK_IMAGE_TAG=nextshift-app:<tag>`
- `ROLLBACK_IMAGE_ID=sha256:<64 lowercase hex>`
- `ROLLBACK_IMAGE_SCOPE=ENGINE_LOCAL_DOCKER_ID_NO_CROSS_ENGINE_COMPARISON`

The image ID is a Docker engine-local `.Id`, not a portable OCI digest and not
a Git SHA. The rollback workflow checks that exact local ID on the VPS for the
authorized tag, then retags it to `nextshift-app:latest`; it never rebuilds a
rollback image from source.
