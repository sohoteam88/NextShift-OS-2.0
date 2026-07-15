# OS 3.8 Pipeline Runner

This is the repository-owned, manifest-driven runner for OS 3.8. Its only
execution state is `docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json`, which
is committed and pushed atomically with every state/evidence transition.
The runner starts no product work unless an operator explicitly sets
`PIPELINE_ALLOW_PRODUCT_DISPATCH=1`; `AUTO_RELEASE=0` and `AUTO_DEPLOY=0` are
mandatory and release/deploy commands do not exist in this runner.

## Operator workflow

```bash
scripts/os-pipeline/validate-manifest.sh
scripts/os-pipeline/run-pipeline.sh --plan
```

When all tasks in a wave are complete, run `--checkpoint`. It writes the
manifest-designated wave-end Architecture Review request with task IDs, PR
URLs, merge SHAs, changed files, validation evidence, reports, and known
limitations. It sets the checkpoint to `awaiting_review`. A human saves the
manifest-designated result artifact with `VERDICT=PASS` or
`VERDICT=CHANGES_REQUESTED` plus `REVIEWED_SHA`; the pipeline never approves a
review itself.

```bash
scripts/os-pipeline/run-pipeline.sh --checkpoint
scripts/os-pipeline/run-pipeline.sh --record-review-result AR-W1 PASS /path/to/result.md
scripts/os-pipeline/run-pipeline.sh --record-steven-ia steven 2026-07-15T12:00:00Z
```

Completed work requires a verified merged PR. Direct completion is disabled
outside the test harness; `--merge-task-pr` validates the exact PR checkout,
checks, merge SHA, and implementation report before completing it.

```bash
TASK_BRANCH=chore/os-3.8-e1-example \
STATE_REPO_DIR=/clean/planning-checkout \
IMPLEMENTATION_REPORT=docs/nextshift-os-3/os-3-8/reports/E1.md \
PIPELINE_ALLOW_PR_MERGE=1 scripts/os-pipeline/run-pipeline.sh --merge-task-pr E1 https://github.com/sohoteam88/NextShift-OS-2.0/pull/123
```

This prevents a restart from treating a pending task as completed. The runner
also refuses a second transition, so completed tasks are idempotent on restart.
For `CHANGES_REQUESTED`, `--plan` selects remediation. Record its result with
`--record-remediation-result`; after the policy limit of failed attempts the
checkpoint becomes `needs_human` and the loop stops.

Before every dispatch, validation, and merge, the synchronization gate runs
`git fetch origin --prune` and rejects wrong repository/branch, dirty or
untracked worktrees, nonzero ahead/behind, or local/remote mismatch. PR
verification also requires repository identity, manifest base branch, and
local HEAD = remote task head = PR head before it runs local gates against that
exact checkout.

`--dispatch` creates a fresh task branch from the synchronized planning branch,
creates a bounded brief from the committed contract (or the Manifest where the
contract is null), invokes the explicit `CODEX_CMD`, and requires a JSON task
outcome containing a PR URL and implementation report. A nonzero Codex exit or
missing outcome leaves the Manifest task pending.

For a task PR, `--verify-pr` runs the required local gates and waits up to 30
minutes for GitHub checks (retrying only while checks have not registered).
`--merge-task-pr` repeats that verification and requires the separate explicit
`PIPELINE_ALLOW_PR_MERGE=1` opt-in before it can merge to the manifest base.
Forbidden paths (`.env`, deploy workflows, migrations, and `packages/`) fail
closed. No docs-only exception weakens verification for product tasks.

The final independent audit is eligible only after every wave checkpoint and
human gate passes. A PASS requires the configured audit report to contain
`VERDICT=PASS` and a `REVIEWED_SHA` that matches the final wave review.
Recording a final-audit PASS leaves `release_gate.status`
as `blocked`; it never tags, releases, or deploys.

## Loop and stop controls

`run-loop.sh` uses an atomic directory lock, a daily limit of three cycles,
a ten-minute default pause, and stops after two consecutive failures.
Create `scripts/os-pipeline/logs/STOP` to end it gracefully. An optional
`NOTIFY_WEBHOOK` receives one compact result per cycle (for example an ntfy
topic URL); when omitted no notification is sent.

```bash
PIPELINE_ALLOW_PRODUCT_DISPATCH=1 CODEX_CMD='codex exec' \
  scripts/os-pipeline/run-loop.sh
```

`CODEX_CMD` has no default, and any operator-supplied CLI permissions remain
the operator's decision. The runner does not default to bypassing approvals or
sandboxing. Missing tools, dirty worktrees, a missing base branch, STOP, and
unknown review/check states fail closed.

## Migration from local operator scripts

Do not overwrite or delete an existing local pipeline installation. After this
branch is merged, back up its scripts outside the repository, update the local
checkout, and first run `validate-manifest.sh` plus `run-pipeline.sh --plan`.
Only switch the scheduled/operator command after that read-only check succeeds.
No VPS address, SSH identity, production URL, or deployment path is stored in
these scripts; deployment settings must remain external operator configuration.
