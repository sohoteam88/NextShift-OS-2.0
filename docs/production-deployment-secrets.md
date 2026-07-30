# Production Deployment Secrets

This document records the GitHub Actions configuration required by `.github/workflows/deploy.yml`.

Production deployment secrets must use the `PROD_` prefix and must not reuse E2E staging secret names. Do not commit real values.

## Manual Production Gate

`Deploy to Production` has no `push`, `pull_request`, `schedule`, or `workflow_run` trigger. A successful CI run cannot start a production action. Both deploy and rollback are available only through an explicit `workflow_dispatch` request, run in the `production` GitHub Environment, and require:

- `action`: `deploy` or `rollback`;
- `release_sha`: for deploy, the exact approved release SHA; for rollback, the exact rollback-image SHA frozen in Production Readiness evidence. Both must be full 40-character commits contained in `origin/main`;
- `confirmation`: exactly `DEPLOY_PRODUCTION` for deploy or `ROLLBACK_PRODUCTION` for rollback.

The workflow validates the SHA before the production job, checks out that exact SHA, and validates it against `origin/main` again before any build, migration, deploy, or rollback command. Deploy builds and labels the application and migration images from that same SHA.

The workflow control plane is separately bound to the exact current `main` commit. Dispatches from branches, tags, or pull-request refs are rejected. If `main` changes while the GitHub Environment approval is pending, the production job fails closed and the operator must create a new dispatch. One immutable `nextshift-production` concurrency lock serializes every deploy and rollback request.

Manual workflow dispatch and GitHub Environment approval are execution safeguards; neither is Steven Final Release Approval. Before either production job can start, the request validator requires all of the following from the exact `main` control-plane tree:

- `PIPELINE_MANIFEST.json` has `release_gate.status=approved`, bound to the current approved release SHA and Steven;
- `final_release_review.status=passed` is bound to a merged Final Release Architecture Review Request PR, its exact GitHub head/merge identity, and one exact-head `PASS` review;
- the canonical `STEVEN_FINAL_RELEASE_APPROVAL.md` exists as a regular, non-symlink Git file and has the exact SHA-256 recorded by the Manifest;
- the approval contains one authoritative `APPROVED` decision, Steven as approver, the exact release/review identity, and the canonical Production Readiness evidence identity;
- the canonical Production Readiness evidence exists as a regular, non-symlink Git file, matches its recorded SHA-256, says `STATUS=READY`, and binds the approved release SHA, exact-release migration-image revision, explicit Stage 4-pending migration controls, repository-external logical-backup checksum, isolated restore verification, exact rollback image, and a fresh `production` GitHub Environment protection snapshot requiring Steven.

Missing, blocked, duplicate, stale, mismatched, untracked or symlink authority fails before Docker build, SCP, SSH, migration or deployment. The current repository deliberately has `final_release_review.status=pending`, `release_gate.status=blocked`, and no Final Release Approval artifact, so it is not deployable. The existing READY evidence is necessary but never sufficient production authority. This remediation creates neither a real review request nor an approval and does not unlock the gate.

### Final Release governance sequence

The release contract deliberately separates four authorities:

1. **Contract remediation** defines this fail-closed workflow without requesting or granting release authority.
2. **Architecture Review Request** runs `scripts/deployment/request-final-release-review.sh <RELEASE_SHA>` from a clean dedicated branch created at synchronized `origin/main`. The candidate-first transaction writes only the Manifest's `awaiting_review` state and the canonical request artifact. It serializes ordinary and linked worktrees through one owner-bound lock in the canonical Git common-dir. From the first repository write onward, validator, staging, commit, push, or post-push verification failure restores the original HEAD, Manifest bytes, request-artifact state, index, worktree, remote request branch, and owned lock. It never creates a PR or invokes a production workflow.
3. **Final Release Approval** is a later, independent governance change. It may be created only after the Request PR is merged and `scripts/deployment/validate-final-release-review-request.sh --verify-pr <PR_URL>` derives an exact head from GitHub metadata, finds exactly one exact-head `PASS` review from the immutable canonical reviewer policy (`sohoteam88`, `OWNER`), and proves the reviewed release, artifact digest, merge ancestry, and freshness. Request artifacts, review prose, transport envelopes, and caller input cannot alter reviewer authority.
4. **Production Execution Approval** remains a separate explicit human action through the manual workflow and protected `production` Environment. A Final Release Approval never dispatches production automatically.

The request artifact intentionally has no `REQUEST_PR_HEAD`, future review ID, or reviewed SHA. A commit cannot truthfully contain its own final Git object ID. It instead binds the synchronized pre-request main SHA, release/readiness/audit/rollback evidence, timestamp, and blocked release gate. The GitHub verifier obtains the exact request head only from the Request PR metadata and requires the review `commit_id` to equal it.

The exact-head GitHub review body has exactly three machine-authority controls. Each must occur once, with canonical case, spacing and delimiter; duplicate, conflicting, malformed, padded, or case-variant controls fail closed. Every other uppercase control-shaped key (including reviewer, approver, review/request identity, or release-gate fields) is forbidden rather than treated as prose. Explanatory prose that is not control-shaped may appear on other lines. A duplicate request invocation clean-stops only after the caller's release SHA matches both the canonical Manifest release and the digest-verified existing request artifact.

```text
CHECKPOINT: FINAL-RELEASE
VERDICT: PASS
REVIEWED_RELEASE_SHA=<authorized release SHA>
```

Canonical request controls are:

```text
REQUEST_ID=OS3.8-FINAL-RELEASE-ARCHITECTURE-REVIEW
RELEASE_SHA=<authorized release SHA>
PRE_REQUEST_MAIN_SHA=<synchronized main before the request commit>
REQUESTED_AT=<UTC>
PRODUCTION_READINESS_EVIDENCE=docs/nextshift-os-3/os-3-8/releases/OS38_PRODUCTION_READINESS_EVIDENCE.md
PRODUCTION_READINESS_EVIDENCE_SHA256=<exact SHA-256>
PRODUCTION_READINESS_VERIFICATION_ID=<exact READY verification ID>
FINAL_AUDIT_REPORT_SHA256=<exact SHA-256>
ROLLBACK_IMAGE_SHA=<exact rollback image SHA>
RELEASE_GATE=BLOCKED
```

The future canonical Final Release Approval control fields are:

```text
APPROVAL_ID=OS3.8-FINAL-RELEASE-APPROVAL
RELEASE_GATE=OS3.8-FINAL-RELEASE
DECISION=APPROVED
APPROVER=Steven
APPROVED_AT=<UTC>
RELEASE_SHA=<exact SHA>
REQUEST_PR_URL=https://github.com/sohoteam88/NextShift-OS-2.0/pull/<number>
REQUEST_PR_NUMBER=<number>
REQUEST_PR_HEAD=<GitHub PR exact head>
REQUEST_MERGE_SHA=<merged request commit>
REQUEST_ARTIFACT=docs/nextshift-os-3/os-3-8/releases/OS38_FINAL_RELEASE_ARCHITECTURE_REVIEW_REQUEST.md
REQUEST_ARTIFACT_SHA256=<exact SHA-256>
REVIEW_ID=<exact review ID>
REVIEW_COMMIT_ID=<same exact request PR head>
REVIEWED_RELEASE_SHA=<authorized release SHA>
PRODUCTION_READINESS_EVIDENCE=docs/nextshift-os-3/os-3-8/releases/OS38_PRODUCTION_READINESS_EVIDENCE.md
PRODUCTION_READINESS_EVIDENCE_SHA256=<exact SHA-256>
PRODUCTION_READINESS_VERIFICATION_ID=<exact evidence ID>
```

This is a validation contract only. A separate, reviewed governance change must create the genuine artifacts and approved Manifest state.

The canonical Stage 1-3 readiness artifact used by Architecture Review and Final Release Approval must additionally contain exactly one of each of the following controls. `ENVIRONMENT_VERIFIED_AT` must equal the enclosing readiness `VERIFIED_AT`, so an older Environment snapshot cannot be carried into a newer READY decision.

```text
MIGRATION_REHEARSAL=PENDING_STAGE_4
MIGRATION_IMAGE_REHEARSAL=PENDING_STAGE_4
MIGRATION_IMAGE_DIGEST=PENDING_STAGE_4
MIGRATION_IMAGE_REVISION=<approved release SHA>
PRODUCTION_ENVIRONMENT=production
REQUIRED_REVIEWER=Steven
ENVIRONMENT_PROTECTION=PASS
ENVIRONMENT_VERIFICATION_ID=OS38-ENV-<UTC compact timestamp>
ENVIRONMENT_VERIFIED_AT=<same UTC as readiness VERIFIED_AT>
```

### Stage 1-4 migration evidence and approval scope

Starting with PR #190, `MIGRATION_REHEARSAL`, `MIGRATION_IMAGE_REHEARSAL`, and `MIGRATION_IMAGE_DIGEST` are always exactly `PENDING_STAGE_4` throughout Stages 1-3, including the human Architecture Review and Final Release Approval stages. The migration image is first built inside the manually dispatched Stage 4 workflow and is not published to a registry, so a real digest does not exist for the approval-stage artifact to record truthfully.

Human reviewers therefore cannot and must not try to verify a real migration-image digest during Final Release Approval. The earlier "63-character ghost" incident occurred during human inspection of a purported real digest; finding it demonstrated that visual inspection of digest characters is not a reliable integrity control. This is an intentional governance change from **pre-deployment human review of a digest** to **post-deployment automated generation and validation of the record**, not an approval omission or downgrade.

After the migration image has been built, its runtime contract has passed, the production migration and deployment have succeeded, and the smoke check has passed, Stage 4 automatically creates a separate final evidence artifact. That artifact must contain:

```text
MIGRATION_REHEARSAL=PASS
MIGRATION_IMAGE_REHEARSAL=PASS
MIGRATION_IMAGE_DIGEST=sha256:<64 lowercase hex>
```

The Stage 4 validator rejects `PENDING_STAGE_4`, validates the 64-character lowercase digest format, and derives the digest from the CI-built migration artifact rather than from reviewer-authored prose. Machine validation is the authority for these three controls.

### REQUIRED MANUAL ACTION — archive Stage 4 evidence before expiry

GitHub Actions retains the Stage 4 final evidence artifact for only 90 days. **After every successful production deployment, an operator must manually download the artifact from that exact `Deploy to Production` workflow run and commit it to the repository before the 90-day retention period expires.** This is a required human operation; it is not automated by the deployment workflow.

The artifact is named `nextshift-production-readiness-stage4-<release_sha>` and contains `OS38_PRODUCTION_READINESS_EVIDENCE_STAGE4.md` plus its SHA-256 checksum. Archive both files under a release-specific repository path such as:

```text
docs/nextshift-os-3/os-3-8/releases/deployed/<release_sha>/
```

The archive commit must preserve the workflow run URL, exact release SHA, evidence file, and checksum so a future operator can establish provenance. Do not wait until the next release: rollback-target derivation is repeated for every release and depends on durable historical deployment evidence. If the Actions artifact expires before repository archival, the real Stage 4 digest record is permanently lost and the rollback evidence chain is incomplete.

The workflow intentionally does not write this evidence back to the repository automatically; allowing a production deployment job to mutate the control-plane repository is a separate risk and is outside PR #190.

## VPS Access Secrets

| Name | Type | Purpose |
|---|---|---|
| `VPS_HOST` | Secret | Production VPS host for SSH/SCP deployment. |
| `VPS_SSH_KEY` | Secret | Private SSH key for the `deploy` user on the production VPS. |

## Production Build Secrets

These values are passed as Docker build arguments so Next.js can embed public runtime configuration into the production JavaScript bundle.

| Name | Type | Purpose |
|---|---|---|
| `PROD_NEXT_PUBLIC_APP_URL` | Secret | Public production app URL, for example `https://nextshiftos.com`. |
| `PROD_NEXT_PUBLIC_BASE_DOMAIN` | Secret | Public production base domain, for example `nextshiftos.com`. |
| `PROD_NEXT_PUBLIC_SUPABASE_URL` | Secret | Production Supabase project URL. |
| `PROD_NEXT_PUBLIC_SUPABASE_ANON_KEY` | Secret | Production Supabase anon key used by browser/client code. |
| `PROD_NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Secret | Optional Supabase publishable key if the project uses one. |
| `PROD_NEXT_PUBLIC_SENTRY_DSN` | Secret | Browser-visible Sentry DSN. |
| `PROD_NEXT_PUBLIC_POSTHOG_KEY` | Secret | Browser-visible PostHog project key. |
| `PROD_NEXT_PUBLIC_POSTHOG_HOST` | Secret | Browser-visible PostHog host. |
| `PROD_NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Secret | Browser-visible Stripe publishable key. |
| `PROD_SENTRY_AUTH_TOKEN` | Secret | Sentry auth token for source map upload during build. |
| `PROD_SENTRY_ORG` | Secret | Sentry organization slug for source map upload. |
| `PROD_SENTRY_PROJECT` | Secret | Sentry project slug for source map upload. |

## Production Build Variables

Use GitHub repository variables for non-secret feature flags.

| Name | Type | Default | Purpose |
|---|---|---|---|
| `PROD_NEXT_PUBLIC_ENABLE_EVOLUTION_PROJECTION_V6` | Variable | `false` | Enables Evolution Projection v6 in production bundles. |
| `PROD_NEXT_PUBLIC_ENABLE_RUNTIME_MISSION` | Variable | `true` | Enables Mission Runtime Adapter in production bundles; set to `false` only for rollback or staged production reveal. |
| `PROD_NEXT_PUBLIC_ENABLE_RUNTIME_BUSINESS_STATE` | Variable | `true` | Enables Business State Runtime Adapter in production bundles; set to `false` only for rollback or staged production reveal. |
| `PROD_NEXT_PUBLIC_ENABLE_RUNTIME_CRM` | Variable | `true` | Enables CRM Runtime Adapter in production bundles; set to `false` only for rollback or staged production reveal. |
| `PROD_NEXT_PUBLIC_ENABLE_COMMAND_CENTER` | Variable | `true` | Enables Command Center recommendation datapath in production bundles; set to `false` only for rollback. |
| `PROD_NEXT_PUBLIC_ENABLE_AI_DISCUSSION` | Variable | `false` | Enables the Command Center "Discuss with AI" service-layer API in production bundles. |

Release note for OS 3.5 G1: the Mission, Business State, CRM, and Command Center flags are default-on at the image/build level. The production VPS `.env.production` file currently contains explicit `NEXT_PUBLIC_ENABLE_RUNTIME_MISSION=false`, `NEXT_PUBLIC_ENABLE_RUNTIME_BUSINESS_STATE=false`, and `NEXT_PUBLIC_ENABLE_RUNTIME_CRM=false` values. Because the env file has higher precedence than image defaults at runtime/deploy time, those three production paths remain OFF after the v3.5.0 deployment until Steven updates the VPS env file. This is the final reveal switch by design, not a defect.

## VPS Runtime Environment

The production VPS still owns runtime-only secrets in `/home/deploy/nextshift/.env.production`, including:

- `DATABASE_URL`
- `DIRECT_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXTAUTH_SECRET`
- AI provider keys
- payment provider secrets
- Redis configuration

GitHub Actions must not print these values. The deploy workflow builds a dedicated migration image from the exact release SHA using a digest-pinned Node base, lockfile-resolved Prisma CLI and pinned Bash/psql packages. It records the migration image ID and archive checksum, then revalidates the archive checksum, image digest, OCI revision and toolchain labels after loading the image on the VPS. The VPS performs no `apk`, npm, npx, Corepack or other network installation during migration.

The migration image runs the complete OS 3.8 entrypoint. It acquires the database advisory lock, validates the Prisma and Supabase ledgers, and applies the Content migration first. On a fresh install, the U3B audit schema, additive RLS hardening, and both Supabase ledger records commit in one transaction so no externally visible U3B state can precede RLS/revocation. If U3B is already fully committed, only the additive RLS migration runs. Partial catalog/ledger states fail closed. Final catalog assertions must pass before the application image can be retagged or started. A production migration failure is fail closed; it does not authorize deleting, resetting or rebuilding the production database.

## Rollback

Every newly built image carries the OCI label `org.opencontainers.image.revision=<release_sha>` and the immutable local tag `nextshift-app:<release_sha>`. The optional `nextshift-app:previous` tag created during deploy is only a convenience reference; it is not rollback authority.

Before the first deployment through this gate, Production Readiness must confirm that an intended exact-SHA rollback image is present on the production host with the matching OCI revision label. This remediation does not create or modify any production image.

To roll back:

1. Open the `Deploy to Production` workflow in GitHub Actions.
2. Run `workflow_dispatch`.
3. Select `rollback`.
4. Enter the exact target image SHA recorded as `ROLLBACK_IMAGE_SHA` in the approved release's Production Readiness evidence. It must also be a full SHA contained in `origin/main`.
5. Enter `ROLLBACK_PRODUCTION` as the confirmation.

The Final Release Approval remains bound to the current approved release; it is not rebound to the older rollback commit. The rollback job requires `nextshift-app:<release_sha>` to exist and verifies that its OCI revision label exactly matches `release_sha` before retagging it as `latest`, recreating the app service, and running `scripts/deploy-smoke.sh`. It never builds an image or runs a migration. A missing, unlabeled, mismatched, or non-evidenced image fails closed.
