# OS 3.9 Release Chain Incident — 2026-08-04

## Scope and invariant

Candidate release SHA: `8f8c231b177349436f8a204ded0c7da5cdb80248`.

This record preserves the four release-chain attempts. The Stage 1–3
Production Readiness evidence remains immutable and is not changed by this
incident record.

## R1 — request #220 / approval #221

- Control-plane repair: #222 (`scp` overwrite repair) merged after approval.
- Dispatch run: `30920167667`.
- Result: the manual-request validation failed closed on control-plane drift.
  The build, transfer/deploy, and rollback jobs were all skipped; none started.

## R2 — request #224 / approval #225

- Dispatch runs: `30924347897` and `30927961807`.
- Result: both runs reached the deploy job but failed in
  `appleboy/scp-action` during `Copy exact release artifacts to VPS`.
  The remote migration/deploy step was skipped in both runs.
- Environment exclusion evidence and the conclusion that the failure was in
  the action's embedded Go SCP implementation are retained in #226's PR
  description.

## R3 — request #228 / approval #229

- Dispatch run: `30933749725`.
- Result: runner-native OpenSSH transfer completed. The copy step took about
  4 minutes 2 seconds. The remote step loaded the application archive,
  accepted `migration-image.tar.gz: OK`, and emitted
  `MIGRATION_VPS_ARTIFACT_CONFIG_DIGEST=sha256:cbe3aa3b49e939386f2b9ed6def4ac7bcf63ca48cd4feb2217ed4c544d04202e`.
- The deploy job's 15-minute budget expired while the remote
  `Migrate and deploy exact release SHA` step was running; the run was
  cancelled. There is no completion record for the later application tag,
  compose, or smoke commands.

## R4 — reset after #230

- #230 increases the deploy timeout to 40 minutes and the rollback timeout to
  20 minutes, with contract assertions that lock both values.
- This reset voids the R3 request and approval before any new request is made.

## Post-cancellation observations

- Public VPS endpoint check: cache-busted `GET /api/version` returned HTTP 404.
- VPS application container check (2026-08-04): `nextshift-app:latest`
  remained `8e126f2f9c57`, was `Up 15 hours (healthy)`, and had been created on
  2026-08-03; it was not replaced by the cancelled run.
- Rollback anchor check (2026-08-04): both
  `nextshift-app:pre-batch1-rollback` and `nextshift-app:previous` resolved
  to `8e126f2f9c57`.
- Staged but inactive images from the cancelled run were present:
  `nextshift-app:8f8c231b…` (`aa7482d786a9`) and
  `nextshift-migrations:8f8c231b…` (`724431efbce4`).
- Staged artifacts were present on the VPS:
  `image.tar.gz` (218,251,102 B) and `migration-image.tar.gz`
  (449,074,933 B). Steven removed both before R4, so the next dispatch starts
  from a clean stage.
- `docker ps -a` showed no residual migration container. The site root
  returned HTTP 307, which is normal for the June snapshot.
- Production `_prisma_migrations` read-only aggregate:
  - `20260731072936_add_user_accounts_and_business_start_at`: no record and
    not applied.
  - completed migration count: 7.
  - total migration record count: 7.
- The migration did not complete. The run did, however, dispatch and reach the
  remote migration/deploy command, so this record does not claim that the VPS
  had no transport or image-staging side effects.

## Governance conclusion

Authorization is consumed when a release is dispatched. A cancelled or failed
dispatch cannot reuse its prior request review or approval, especially after a
control-plane change. R4 therefore returns the Manifest to `pending` request
review and `blocked` release gate; a new exact-head request, COMMENT review,
approval, and dispatch are required.
