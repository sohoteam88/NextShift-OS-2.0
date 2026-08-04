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

## Migration rehearsal and transport integrity

Stage 1–3 requires `MIGRATION_REHEARSAL=PASS` and
`MIGRATION_IMAGE_REHEARSAL=PASS`. A local rehearsal records
`REHEARSAL_IMAGE_ID=sha256:<64 lowercase hex>` plus
`REHEARSAL_IMAGE_ID_SCOPE=ENGINE_LOCAL_REHEARSAL_ONLY_NO_CROSS_BUILD_COMPARISON`.
That ID is evidence of the rehearsal only: it is never compared with another
build and is not a release identity anchor.

Release identity remains the exact Git SHA checkout, OCI revision label, and
runtime validator. At dispatch, the runner builds one migration image, writes
its image ID and the compressed tar SHA-256 into the transport artifact, and
the VPS re-hashes the tar Config blob before migration. The runner-recorded
digest and VPS Config-blob digest must match byte-for-byte. Archive the
workflow run URL and the printed runner/VPS digest chain under `releases/`
after deployment; Actions artifacts expire after 90 days.

## Rollback anchor

The readiness evidence records all three values below:

- `ROLLBACK_IMAGE_TAG=nextshift-app:<tag>`
- `ROLLBACK_IMAGE_ID=sha256:<64 lowercase hex>`
- `ROLLBACK_IMAGE_SCOPE=ENGINE_LOCAL_DOCKER_ID_NO_CROSS_ENGINE_COMPARISON`

The image ID is a Docker engine-local `.Id`, not a portable OCI digest and not
a Git SHA. The rollback workflow checks that exact local ID on the VPS for the
authorized tag, then retags it to `nextshift-app:latest`; it never rebuilds a
rollback image from source.
