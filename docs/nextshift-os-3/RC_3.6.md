# OS 3.6 Release Candidate

Version: `v3.6.0`

Status: **RC ready — awaiting Steven's manual merge to `main` and tag creation**

Candidate baseline: `planning/os-3.3-runtime-platform` at `198457f` (PR #61 merge commit)

Prepared: 2026-07-13

---

## Release identity

- Proposed version: `v3.6.0`
- Proposed annotated-tag message: `v3.6.0 — Business Brain Remembers`
- Release intent: make Business Discussion write and read bounded Business Memory, feed repeated discussion signals into recommendations, complete the OS 3.6 hygiene work, and retain the CI evidence needed for a docs-only release package.

This package does **not** merge `main`, create a tag, deploy, change environment files, or alter production state. Those are Steven's explicit follow-up actions after review.

## Scope: PR #50–#61

| PR | Release contribution |
| --- | --- |
| #50 | Added the Master Roadmap and the OS 3.6 Blueprint for Stage A, "Business Brain Remembers." |
| #51 | Wired PostHog initialization and the guarded dashboard, discussion, and weekly-activity telemetry events. |
| #52 | Confirmed no production `admin` users and removed the legacy `admin` role from active authorization paths. |
| #53 | Remeasured the UI-escape baseline at 4,260 arbitrary class values, 8 local Button implementations, and 42 local Card implementations. |
| #54 | Added discussion-memory event types, successful-turn persistence, bounded prompt reads, and failure-tolerant memory fallback behavior. |
| #55 | Unified five rate-limit routes on the trusted nginx real-IP helper and tested forged forwarded-IP handling. |
| #56 | Closed CI-evidence PR that proved a docs-only change creates no workflow run; it was not merged into the release branch. |
| #57 | Closed CI-evidence PR that proved a mixed change still runs the full CI workflow successfully; it was not merged into the release branch. |
| #58 | Added the CI `paths-ignore` configuration that skips workflows only for docs-only changes. |
| #59 | Made the recommendation path consume repeated discussion-memory signals and added the recommendation-loop coverage. |
| #60 | Recorded the Business Memory storage and index evaluation, with measured scale assumptions and explicit reevaluation thresholds. |
| #61 | Cleared the Round 6 F-1/F-3 conditions by correcting the M0 completion record and collecting the five previously uncollected tests. |

## Audit disposition

[Round 6 audit](../../audit/OS36_R6_PR50_PR60_CODE_REVIEW_REPORT.md) reviewed PR #50–#60 at `db70620` and recorded **PASS WITH CONDITION**. The two conditions were not code defects:

- **F-1:** the M0 Blueprint entry was stale and did not state the delivered analytics wiring.
- **F-3:** five valid tests used a suffix excluded by Vitest collection.

PR #61 cleared both conditions. The [OS 3.6 Blueprint](OS_3_6_BLUEPRINT.md) records that F-1 now reflects the delivered M0 work and that F-3 renamed the two files so all five tests are collected and pass. The original Round 6 audit verdict remains unchanged; its conditions are now cleared, making this RC ready.

### Non-blocking advisories for follow-up

- **A-1:** off-topic discussion results emit the client `discussion_turn_sent` telemetry event but do not create a server-side Memory event, leaving a minor telemetry/Memory mismatch to evaluate after release.
- **A-2:** the Blueprint's production nginx path and the repository nginx configuration path differ, although both set `X-Real-IP`; keep those references aligned in a later documentation pass.

Neither advisory blocks `v3.6.0`.

## Local validation

All commands ran from the candidate baseline in a clean linked worktree.

| Command | Result |
| --- | --- |
| `pnpm type-check` | Passed with 0 errors. |
| `pnpm lint` | Passed with 0 errors and 416 existing warnings. |
| `pnpm lint:boundaries:check` | Passed: `eslint-boundaries.config.mjs is in sync.` |
| `pnpm test` | Passed: 80 test files passed, 7 skipped; 436 tests passed, 44 skipped. |
| `pnpm build` | Passed (exit 0); Next.js completed the optimized production build with existing non-failing warnings. |

The CI configuration from PR #58 intentionally suppresses a workflow run for this documentation-only RC package. The implementation itself has the full local gates above; no synthetic source change was added merely to trigger CI.

## Steven handoff

1. Review this RC package and the cleared conditions in the Blueprint.
2. Manually merge `planning/os-3.3-runtime-platform` into `main` when approved.
3. Create the `v3.6.0` annotated tag using: `v3.6.0 — Business Brain Remembers`.
4. Authorize and perform the normal production deployment and verification only after the merge and tag.
