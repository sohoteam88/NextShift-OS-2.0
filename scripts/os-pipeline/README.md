# OS 3.8 Pipeline Runner

This is the repository-owned, manifest-driven runner for OS 3.8. Its only
execution state is `docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json`.
The runner starts no product work unless an operator explicitly sets
`PIPELINE_ALLOW_PRODUCT_DISPATCH=1`; `AUTO_RELEASE=0` and `AUTO_DEPLOY=0` are
mandatory and release/deploy commands do not exist in this runner.

## Operator workflow

```bash
scripts/os-pipeline/validate-manifest.sh
scripts/os-pipeline/run-pipeline.sh --plan
```

When all tasks in a wave are complete, run `--checkpoint`. It writes the
wave-end Architecture Review request under the OS 3.8 review directory and
sets the manifest checkpoint to `awaiting_review`. A human records either
`PASS` or `CHANGES_REQUESTED`; the pipeline never approves a review itself.

```bash
scripts/os-pipeline/run-pipeline.sh --checkpoint
scripts/os-pipeline/run-pipeline.sh --record-review-result AR-W1 PASS
scripts/os-pipeline/run-pipeline.sh --record-steven-ia steven 2026-07-15T12:00:00Z
```

Completed work requires evidence and is intentionally a two-stage transition:

```bash
scripts/os-pipeline/run-pipeline.sh --record-task-start E1
TASK_EVIDENCE_JSON='{"pr":"https://github.com/example/repo/pull/1","checks":"passed"}' \
  scripts/os-pipeline/run-pipeline.sh --record-task-completed E1
```

This prevents a restart from treating a pending task as completed. The runner
also refuses a second transition, so completed tasks are idempotent on restart.
For `CHANGES_REQUESTED`, `--plan` selects remediation. Record its result with
`--record-remediation-result`; after the policy limit of failed attempts the
checkpoint becomes `needs_human` and the loop stops.

For a task PR, `--verify-pr` runs the required local gates and waits up to 30
minutes for GitHub checks (retrying only while checks have not registered).
`--merge-task-pr` repeats that verification and requires the separate explicit
`PIPELINE_ALLOW_PR_MERGE=1` opt-in before it can merge to the manifest base.
Forbidden paths (`.env`, deploy workflows, migrations, and `packages/`) fail
closed. No docs-only exception weakens verification for product tasks.

The final independent audit is eligible only after every wave checkpoint and
human gate passes. Recording a final-audit PASS leaves `release_gate.status`
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
