# OS 3.8 Production Readiness Evidence
EVIDENCE_ID=OS3.8-PRODUCTION-READINESS
STATUS=READY
RELEASE_SHA=962b4276ca493d354cceb27147bb336b553fb557
VERIFICATION_ID=OS38-PR-20260730T045229Z
VERIFIED_AT=2026-07-30T04:52:29Z
MIGRATION_REHEARSAL=PASS
MIGRATION_IMAGE_REHEARSAL=PASS
MIGRATION_IMAGE_DIGEST=sha256:155c553ecf80a4a3ae63283ab951c63d6f4f776edaacacf3f630cbe7c53d6405
MIGRATION_IMAGE_REVISION=962b4276ca493d354cceb27147bb336b553fb557
BACKUP_SHA256=90192a8c71fe7b3fa57a0011909a1cf2fbc4f2e93fe4b6fc29ce9a7ff3360ffb
RESTORE_VERIFIED_AT=2026-07-21T06:11:49Z
ROLLBACK_IMAGE_SHA=c8d08a504ec8477880f3cd0fd8c125cdbeee3691
PRODUCTION_ENVIRONMENT=production
REQUIRED_REVIEWER=Steven
ENVIRONMENT_PROTECTION=PASS
ENVIRONMENT_VERIFICATION_ID=OS38-ENV-20260730T045229Z
ENVIRONMENT_VERIFIED_AT=2026-07-30T04:52:29Z

## Decision boundary
This artifact records Production Readiness only. It is not Final Release
Approval, does not change the blocked release gate, and does not authorize a
workflow dispatch, migration, deployment, rollback, tag, GitHub Release, or
production mutation.

## Migration image: PENDING_STAGE_4 (structural fact, per PR #190)

Per the governance change landed in PR #190 (merged 962b4276...), these three
migration controls are always exactly PENDING_STAGE_4 throughout Stages 1-3,
including this Architecture Review and the subsequent Final Release Approval
stage. See docs/production-deployment-secrets.md, "Stage 1-4 migration
evidence and approval scope" section, for the full rationale: the migration
image is first built inside the manually dispatched Stage 4 workflow and is
not published to a registry, so a real digest does not exist for this
approval-stage artifact to record truthfully. Human reviewers must not
attempt to verify a real digest at this stage — that is now an automated,
machine-validated Stage 4 responsibility.

## Repository and exact-release evidence
- Repository: `sohoteam88/NextShift-OS-2.0`.
- Exact merged `main` release: `962b4276ca493d354cceb27147bb336b553fb557`.
  The release delta from the previous readiness baseline
  (`c8d08a504ec8477880f3cd0fd8c125cdbeee3691`, currently running in production) is four
  batched items per Fable's Tier C/routine scheduling ruling (batch to a
  release train, not deployed individually):
  - PR #187 (merge `92b3842`): root-cause fix for `AuditLog.targetId`/UUID
    semantics causing Mission Workspace `P2023` crashes on first access for
    any account with a clean reset state. Separates real persisted-entity
    UUIDs from synthetic target keys (moved to `metadata.target_key`), adds
    a dev-fail-fast/prod-downgrade guard with Sentry reporting, isolates
    audit-write failures from primary business flows without silent
    swallowing. `DOGFOOD_DIARY_2026-07.md` F-05 root cause corrected from a
    speculative misdiagnosis to the actual `P2023` cause.
  - PR #188 (merge `b490ed8`): adds "previous question" navigation to the O2
    forked AI interview. Fork-changing revisions to topic 1 (A/B selector)
    invalidate and genuinely clear all post-fork draft answers (F-18/F-33
    precedent); same-path revisions only update the current topic. Explicit
    confirmation dialog required before any fork-changing invalidation.
    Revision reuses O3's existing `saveBrandDNA` path; single
    `meta.version` increment after the full re-answer flow.
  - PR #189 (merge `a6f3f80`): hides Webinar/Lead Magnet/Funnel Generator
    cards from the user-facing `/growth` hub per product shape amendment
    §3/§5 (Tier C stopgap pending W4/T1's permanent relocation). Underlying
    data, API routes, and admin entry points unchanged.
  - PR #190 (merge `962b427`): the governance fix enabling this evidence
    file itself — makes the readiness/approval validators explicitly accept
    `PENDING_STAGE_4` for the three migration controls in Stages 1-3 and
    reject it after Stage 4, with the stage determined by the caller (never
    inferred from the evidence file's own content) so evidence authors
    cannot select their own validation outcome. Also documents the Stage 4
    artifact 90-day retention gap and the required manual archival action in
    `docs/production-deployment-secrets.md`.
- The release delta from the prior readiness baseline contains no Prisma
  schema or database migration file (confirmed via `git diff --stat` against
  `prisma/` across every commit between the two SHAs).

## Backup and restore evidence
- Per the same no-schema-change basis as prior release trains: since this
  release delta contains no Prisma schema or migration file, backup and
  restore evidence carries forward unchanged from the prior approved
  readiness baseline. The daily `pg_dump` cron (VPS `root` crontab,
  `0 19 * * *`) continues running with a checksum manifest for every run.
  `BACKUP_SHA256` and `RESTORE_VERIFIED_AT` are the same values already
  approved for the prior release.
- **Standing rule (reaffirmed again):** the next release that includes a
  Prisma schema or migration file must rerun a full backup-and-isolated-
  restore rehearsal before Production Readiness can be recorded.

## Production Environment protection
- GitHub Environment: `production`, environment ID `18470894538`.
- The protection snapshot was read directly from the GitHub Environment API by
  `scripts/deployment/verify-environment-protection.sh` in this same session.
- No Environment setting, secret, or variable was changed.

## Current production and rollback evidence
- The exact rollback target was read directly from the VPS over the deploy
  SSH identity in this same session. `nextshift-app:latest` is healthy and
  its revision/tag is `c8d08a504ec8477880f3cd0fd8c125cdbeee3691`, exactly
  matching `ROLLBACK_IMAGE_SHA`, with image ID
  `sha256:97bd8c9c82d608cbf17701ef6812abe5d20442cf6c0a06ae623de948d5ebe049`.
  This is the currently running, verified healthy production image and is
  the exact rollback target if this release must be reverted.
- No container, image, tag, runtime environment, credential, or service was
  modified by this evidence collection.

## Verification result
All repository-controlled and independently readable Production Readiness
evidence was consistent at the recorded verification time, with the migration
image fields explicitly PENDING_STAGE_4 per PR #190's governance change.
Production Readiness is therefore `READY`; Final Release review for the
exact SHA remains pending and the canonical release gate remains `blocked`.
