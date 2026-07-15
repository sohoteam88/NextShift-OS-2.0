# OS 3.8 Pipeline Wave-mode Upgrade Execution Task

Version: 1.0 Draft

Status: Bootstrap task — awaiting Steven merge approval

Assigned Agent: Codex CLI

Lifecycle Phase: Developer Platform implementation

Inputs: [Wave Execution Contract](WAVE_EXECUTION_CONTRACT.md), [Pipeline Manifest](PIPELINE_MANIFEST.json), uploaded legacy `run-pipeline.sh` and `run-loop.sh`

Outputs: Canonical scripts, tests/fixtures, migration notes, and a draft PR

---

## 1. Task

Perform the one-time bootstrap that converts the legacy local single-item pipeline into the repository-backed OS 3.8 Wave pipeline described by the contract.

## 2. Required Repository Outputs

Create canonical, reviewable files under:

```text
scripts/os-pipeline/run-pipeline.sh
scripts/os-pipeline/run-loop.sh
scripts/os-pipeline/validate-manifest.sh
scripts/os-pipeline/README.md
scripts/os-pipeline/tests/
```

Do not overwrite or delete the operator's existing local scripts. Document how to back them up and switch to the repository versions after merge.

## 3. Required Changes

1. Replace Markdown/awk task selection with `jq` selection from `PIPELINE_MANIFEST.json`.
2. Replace per-task Architecture Review with Wave-end review-request generation.
3. Remove/disable periodic `AUDIT_EVERY_N_PRS` behavior for OS 3.8.
4. Add final-only Audit gating.
5. Add task and Wave state-transition validation.
6. Add cumulative Wave diff evidence using `start_sha`.
7. Add `awaiting_review`, `changes_requested`, remediation, `needs_human`, and `passed` checkpoint handling.
8. Add the STEVEN-IA product gate.
9. Default release/tag/deploy behavior to disabled.
10. Preserve forbidden-path guards, independent local verification, GitHub checks, clean-worktree checks, lock handling, bounded retries, logs, and STOP-file behavior.
11. Update the loop so a successful task cycle automatically starts the next eligible task, subject to daily/abort safeguards.
12. Make restart behavior idempotent.

## 4. Mandatory Safety Corrections

- No hard-coded VPS host, username, application path, SSH key, or production URL in committed scripts.
- Deployment variables must be supplied by the operator environment only.
- `AUTO_RELEASE=0` and `AUTO_DEPLOY=0` by default.
- `--dangerously-bypass-approvals-and-sandbox` may remain an operator override but must not be the committed default Codex invocation.
- A missing CLI, manifest field, base branch, required check, or review result must fail closed.
- The pipeline must not auto-approve its own Architecture Review result.

## 5. Tests

Add shell-level fixtures/tests covering:

- manifest valid/invalid;
- E1 pending selection;
- E1 completed selects E2;
- E1+E2 completed creates AR-W1 request;
- awaiting AR-W1 selects no W2 task;
- AR-W1 PASS selects U1A/U2;
- W2 PASS without STEVEN-IA approval blocks W3;
- approved STEVEN-IA unlocks W3;
- architecture changes requested selects remediation;
- two failed remediations become needs-human;
- all Waves PASS triggers final Audit exactly once;
- final Audit PASS does not auto-release;
- restart does not repeat completed tasks.

Run at minimum:

```bash
bash -n scripts/os-pipeline/run-pipeline.sh
bash -n scripts/os-pipeline/run-loop.sh
bash -n scripts/os-pipeline/validate-manifest.sh
scripts/os-pipeline/tests/run.sh
git diff --check
```

If ShellCheck is available, run it and report findings. Do not add a network dependency solely to run ShellCheck.

## 6. Return Format

Return:

1. Baseline SHA and branch.
2. Files created/changed.
3. Legacy-to-Wave behavior mapping.
4. Test commands and results.
5. Security defaults confirmed.
6. Known operational limitations.
7. Migration steps for the operator's local scripts.
8. Commit SHA and draft PR URL.

## 7. Stop Condition

Stop after the pipeline-upgrade draft PR. Do not run OS 3.8 product tasks, merge the upgrade PR, modify production, tag, deploy, or invoke the final Audit.
