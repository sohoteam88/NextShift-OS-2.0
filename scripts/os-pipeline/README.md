# OS 3.8 Pipeline Runner

This directory contains the repository-owned OS 3.8 pipeline. The committed
execution state is
`docs/nextshift-os-3/os-3-8/PIPELINE_MANIFEST.json`; canonical dispatch,
review, remediation, approval, and audit artifacts provide evidence for that
state. The runner validates the Manifest before every command and before and
after each state transaction.

The runner can create and merge bounded product-task and remediation PRs into
the Manifest planning branch. It cannot tag, release, deploy, or modify
production. Both the environment (`AUTO_RELEASE=0`, `AUTO_DEPLOY=0`) and the
Manifest (`auto_release=false`, `auto_deploy=false`, `auto_tag=false`) must keep
those operations disabled.

## Safe first run

Run these commands from a clean checkout of the Manifest `base_branch`:

```bash
scripts/os-pipeline/validate-manifest.sh
scripts/os-pipeline/run-pipeline.sh --plan
```

`--plan` is read-only. It returns the next action selected solely from the
Manifest: a task, task recovery, checkpoint, review wait, remediation,
remediation recovery, human-gate wait, final-audit request/wait, `needs_human`,
or completion.

Before dispatch, verification, merge, or any state transaction, the runner
fetches `origin --prune` and verifies all of the following:

- the expected repository and authorized branch;
- a clean worktree, including no untracked files;
- local HEAD equals the corresponding remote branch HEAD;
- ahead/behind is exactly `0/0`;
- the Manifest planning branch exists remotely; and
- for a PR, repository, base, task/remediation branch, local HEAD, remote HEAD,
  and PR head SHA all agree.

It never repairs a dirty or divergent checkout with reset, rebase, stash, or
file deletion. An operator must reconcile that state deliberately.

## One automatic cycle

The full product-task opt-in is deliberately verbose:

```bash
PIPELINE_ALLOW_PRODUCT_DISPATCH=1 \
PIPELINE_AUTOMATE_TASK_CYCLE=1 \
PIPELINE_ALLOW_PR_MERGE=1 \
AUTO_RELEASE=0 \
AUTO_DEPLOY=0 \
CODEX_CMD='codex exec' \
  scripts/os-pipeline/run-pipeline.sh --cycle
```

The flags mean:

- `PIPELINE_ALLOW_PRODUCT_DISPATCH=1` permits creation of one bounded task or
  remediation worktree and invocation of `CODEX_CMD`.
- `PIPELINE_AUTOMATE_TASK_CYCLE=1` lets `--cycle` continue a product task from
  dispatch through verification and merge. Without it, a task action stops.
- `PIPELINE_ALLOW_PR_MERGE=1` permits a PR merge only after exact-head local
  verification and required GitHub checks pass.
- `CODEX_CMD` is mandatory for task and remediation dispatch and has no
  default. Any CLI approval or sandbox options remain an operator decision.
- `AUTO_RELEASE` and `AUTO_DEPLOY` must both be exactly `0`; any other value is
  rejected before execution.

The planning checkout is the state checkout. A task cycle creates a fresh
`chore/os-3.8-<task>-<timestamp>` worktree from `origin/<base_branch>` and
passes the clean planning checkout internally as `STATE_REPO_DIR` when it
verifies, merges, fast-forwards, and records completion.

Briefs, Codex outcome JSON, and Codex logs live outside every Git worktree under
`CONTROL_ROOT` (default:
`${TMPDIR:-/tmp}/nextshift-os-pipeline-control`). The required task outcome is
JSON containing `pr_url` and a safe repository-relative
`implementation_report`. A failed Codex command or missing outcome leaves a
normal task pending.

For every task PR, the runner verifies the exact PR checkout and runs:

```bash
pnpm type-check
pnpm test
pnpm build
pnpm lint
git diff --check
```

It then waits up to 30 minutes for required GitHub checks, retrying every 30
seconds only while checks have not registered. A failed check, forbidden path,
repository/base/head mismatch, missing report at the exact PR head, or report
absent from the PR diff fails closed.

The only zero-check outcome is the strict
`not_required_paths_ignored` contract. It is neither PASS nor a generic
`skipped`/`not_triggered` state. The runner derives it from GitHub's exact PR
metadata and file list only when the diff is non-empty, every file matches the
frozen `.github/workflows/ci.yml` `pull_request.paths-ignore` policy
(`docs/**`, `audit/**`, `**/*.md`, or `platform/status.md`), and the exact PR
head has zero check runs. Source, tests, scripts, Prisma, and workflow paths are
always rejected even if a future broad pattern could match them. Any existing
check run—failed, pending, cancelled, skipped, neutral, or successful—routes to
normal check verification and cannot use the exemption.

Every Manifest task must declare exactly one verification policy. A missing or
unknown policy is invalid and fails closed:

| Task | Verification policy |
| --- | --- |
| E1, E2, U1B, U3, E3A, E3B | `actual_checks_required` |
| U1A, U2 | `paths_ignored_zero_checks_allowed` |

`actual_checks_required` accepts only `checks="passed"`.
`paths_ignored_zero_checks_allowed` may still record actual passed checks, but
it is the only policy that can authorize the strict zero-check decision.
Remediation PRs always require actual passed checks regardless of task policy.

The structured evidence binds the Manifest task ID and exact task verification
policy in addition to the repository, PR URL, base branch and SHA, head SHA,
workflow path and blob SHA, exact GitHub changed-file list, zero run count,
policy decision, and verification timestamp. Metadata, task policy, diff, check
runs, and workflow policy are fetched again before persistence, merge, and
merged/running recovery. Caller input, environment variables, task outcomes,
PR bodies, labels, and branch names cannot grant or transfer the exemption.
Evidence for U1A cannot be reused for U2, or vice versa.

An operator can evaluate the same contract read-only, without changing the
Manifest, merging, committing, or pushing:

```bash
scripts/os-pipeline/run-pipeline.sh \
  --evaluate-pr-check-requirement TASK_ID PR_URL EXPECTED_HEAD_SHA EXPECTED_BASE_SHA
```

After those checks and before merge, a short state transaction writes the
exact repository, base, task branch, PR URL, verified head SHA, implementation
report, report-at-head/diff proofs, check status, and verification timestamp to
both the task's canonical `*_DISPATCH.json` and the Manifest task record. The
runner then re-runs the synchronization gate, reloads exact PR metadata and
checks, and merges only with `--match-head-commit <verified-head-sha>`. A head
change between verification and merge is rejected; it cannot produce completed
task evidence.

## Bounded loop

`run-loop.sh` invokes one restart-safe `--cycle` at a time. The same task-cycle
flags are required:

```bash
PIPELINE_ALLOW_PRODUCT_DISPATCH=1 \
PIPELINE_AUTOMATE_TASK_CYCLE=1 \
PIPELINE_ALLOW_PR_MERGE=1 \
AUTO_RELEASE=0 \
AUTO_DEPLOY=0 \
CODEX_CMD='codex exec' \
MAX_CYCLES_PER_DAY=3 \
SLEEP_SECONDS=600 \
  scripts/os-pipeline/run-loop.sh
```

Loop controls are:

- `MAX_CYCLES_PER_DAY` (default `3`);
- `SLEEP_SECONDS` between cycles (default `600`);
- `LOG_DIR` for one result file per cycle;
- `STOP_FILE` (default `$LOG_DIR/STOP`) for a graceful stop;
- `NOTIFY_WEBHOOK` for an optional compact `OK`/`ABORT` POST; and
- an atomic `$LOG_DIR/.loop.lock` that prevents concurrent loops.

Review waits, the STEVEN-IA wait, the final-audit wait, `needs_human`, and a
terminal state are clean stops and do not count as loop failures. Two
consecutive command failures stop the loop for human intervention.

## Transaction-scoped state lock

Automated task lifecycle, checkpoint/review, remediation, STEVEN-IA, and final
audit state transitions use `state_transaction`. The short critical section is:

```text
acquire lock
→ fetch and synchronize
→ validate the latest Manifest and expected transition
→ mutate Manifest and canonical evidence
→ validate again
→ commit and push together
→ verify local HEAD equals remote HEAD
→ release lock
```

Codex execution, package verification, GitHub-check waiting, and PR merge run
outside the lock. After each long operation, the transaction reloads and
revalidates synchronized state before it writes anything.

The lock is `<git-common-dir>/os-pipeline-state.lock`. Its owner file records
PID, host, UTC start time, and command. Contention fails closed. A stale lock is
never removed automatically, and cleanup removes only a lock whose owner still
matches the process that acquired it.

Transactions receive a fixed function callback plus separately quoted
positional data arguments. They never use `eval` or reconstruct a shell command
from Manifest, Codex outcome, PR, report-path, or evidence data. Mutation
callbacks register canonical persistence paths separately from their data
arguments; the transaction rejects unregistered repository changes. Safe
repository-relative paths reject absolute paths, leading options, `.`, `..`,
and `.git` path components, backslashes, control characters, directories, and
symlink targets. Quotes, semicolons, and `$()` in accepted data remain literal
data and are never evaluated.

Manifest and canonical evidence are committed and pushed in the same
transaction. Identical STEVEN-IA and Final Audit results are clean no-ops;
conflicting terminal evidence is rejected.

## Synchronization, restart, and recovery

Canonical `*_DISPATCH.json` and remediation run artifacts hold the PR, branch,
report, verification, and merge evidence required to resume without a second
dispatch.

- A normal task recorded as `running` selects `recovery`. Recovery reads the
  canonical dispatch artifact and validates its task/base/branch/PR/report and
  persisted verification against exact GitHub repository, head-repository,
  base, head branch, head SHA, checks, report-at-head/diff, and merge metadata.
  A merged PR is completed only after a clean planning fast-forward and proof
  that its 40-character merge SHA is on authorized planning history. An open
  PR is restored in a clean detached worktree, reverified, and merged against
  the exact head without a second Codex dispatch.
- An `active_remediation` selects `remediation_recovery`, not another Codex
  call. A uniquely identifiable open PR is restored at its exact remote head,
  reverified, and merged. A previously merged PR is completed only when its
  persisted pre-merge verification, report, checks, repository, base, head,
  and merge SHA still agree.
- If only a remediation branch is known, exactly one matching PR must be found.
  Missing, multiple, or ambiguous PR/evidence state moves to or stops at
  `needs_human`; it is never guessed. For a normal task, any repository, base,
  head, report, checks, or merge-ancestry ambiguity fails closed with the task
  still `running` and requires explicit human recovery.
- A final audit in `running` selects `awaiting_final_audit` and exits cleanly.
  It does not regenerate the request and does not report completion.

Operator recovery procedure:

1. Run `--plan` and inspect the Manifest plus the referenced dispatch,
   remediation, review, approval, or audit artifact.
2. Run `git fetch origin --prune`, `git status --short`, and compare local and
   remote heads. Preserve any user work; do not auto-reset, stash, or delete it.
3. For an unambiguous open or merged normal-task PR, run
   `PIPELINE_ALLOW_PR_MERGE=1 scripts/os-pipeline/run-pipeline.sh --recover-task
   <TASK_ID>` from the clean planning checkout. It restores the recorded exact
   task head when needed and never redispatches Codex. Do not override a
   mismatch; investigate the canonical dispatch artifact and GitHub metadata.
4. For `remediation_recovery`, rerun one opted-in `--cycle`; do not invoke
   Codex manually for the same reserved run.
5. For a lock failure, inspect
   `<git-common-dir>/os-pipeline-state.lock/owner`. Only after proving the
   recorded process is gone, no runner is active, and local/remote state is
   synchronized may an operator remove `owner` and then the empty lock
   directory. Never remove a live or unknown owner's lock.
6. For `needs_human`, an ambiguous PR, failed checks, or unauthorized product
   changes after review, resolve the evidence/state explicitly before retrying.

Temporary worktrees and external control directories are diagnostic evidence.
Remove them only after their PR and Manifest state have been reconciled.

## Governance dispatch gates

A task with `dispatch_gate` is never eligible from `depends_on` alone. Its
dependency must be a completed task with a matching `governance_gate`, exact
verification/evidence, and a canonical gate artifact. The production runner
validates the gate at three independent boundaries:

1. `select_action()` validates before returning the gated task;
2. a short state transaction synchronizes planning, acquires the common-dir
   lock, reloads the Manifest, and authorizes the exact gate digest before any
   branch or Codex work; and
3. the final locked task-start transaction revalidates the gate and the same
   digest before `pending → running` and dispatch-artifact persistence.

The Manifest validator also enforces lifecycle dependencies generically. A
task may be `running` or `completed` only when every declared prerequisite has
reached the terminal state for its authority type: a normal task must be
`completed`, an Architecture Review checkpoint must be `passed`, and a human
approval gate must be `approved`. Unknown, missing, duplicate, or incompatible
dependency authorities fail closed. A `superseded` task is an explicit
governance cancellation and does not claim execution progress; it also never
satisfies another task's dependency implicitly.

Authorization has three separate layers. The immutable gate policy comes only
from the synchronized planning Manifest and defines the gate/task/consumer
identity, option allowlist, required decisions, protected paths, review and
freshness rules, Option C proof contract, decision artifact, and canonical
policy version/digest. A machine-readable decision artifact at the reviewed
Git SHA selects one allowed option and resolves every required decision while
binding the policy and protected-path digests. The external adoption envelope
is transport-only: it identifies the decision SHA, review, PR, canonical
decision path, and decision blob digest. It cannot select an option, amend an
allowlist, remove a protected path, assert freshness, or define completion.

The runner reads the decision with `git show DECISION_SHA:DECISION_ARTIFACT`,
requires it in the reviewed PR diff, and binds one exact PASS Architecture
Review to that SHA. The decision SHA and merge SHA must be in current planning
history. Changes to trusted protected paths after the decision make the gate
stale. Option C additionally requires its policy-designated proof at the same
reviewed SHA and PR diff, with the decision artifact recording the exact proof
SHA-256.

The current U3ADR policy requires six exact decision IDs. In addition to audit
scope/storage, target mapping, failure durability, and tenant-deletion
retention, it requires (1) terminal deleted-tenant enforcement across the
shared auth/session, tenant-resolution, webhook, automation, publishing,
AI/workforce, and queued-execution authorities and (2) a dedicated database
idempotency key plus payload digest for the final `AuditLog` row. Those current
and future authority roots are protected paths. Removing either decision,
renaming it, changing the policy digest, or changing an authority after review
causes adoption and U3B dispatch to fail closed.

Missing, partial, unknown, stale, symlinked, SHA-mismatched, or manually
toggled evidence fails closed. Environment variables, task outcomes, PR body,
labels, and `u3b_dispatch_authorized` by itself are never authority. A failure
occurring before locked authorization creates no task branch, PR, dispatch
artifact, task transition, or Codex invocation.

Adopt an independently reviewed and already merged gate from a regular JSON
source outside the repository:

```bash
scripts/os-pipeline/run-pipeline.sh \
  --adopt-governance-gate U3ADR U3B /path/outside/repository/gate-result.json \
  https://github.com/OWNER/REPOSITORY/pull/NUMBER
```

Before touching the worktree, the command builds an external candidate tree
containing the proposed canonical gate and Manifest transition, then runs the
same validator and cross-field rules used for repository state. Inside
`state_transaction`, it resynchronizes, rebuilds every source/policy/decision/
proof/protected-path digest, requires the locked bundle to equal the candidate,
and validates a fresh candidate again. Only then are same-directory temporary
files flushed and renamed into place for one Manifest+gate commit and push.
The transaction snapshots only those two owned paths. A post-write validator,
commit, or push failure restores their original bytes, removes transaction
temporaries, releases the common-dir lock, and requires a clean unchanged local
HEAD; it never resets or stashes unrelated work. An identical adoption is a
clean stop, while a different or stale adoption is rejected. Governance
adoption tasks are not eligible for ordinary Codex product dispatch.

## Architecture Review checkpoints

When every task in a wave is `completed` or `superseded`, `--cycle` (or
`--checkpoint`) creates the Manifest-designated request and atomically changes
the checkpoint from `pending` to `awaiting_review`. The request records:

- checkpoint and wave;
- cumulative start SHA and exact product end SHA;
- completed-task PR, merge, and implementation-report evidence;
- cumulative changed files; and
- the remediation run, when the request follows remediation.

The reviewer writes a result source containing these control lines:

```text
VERDICT=PASS
REVIEWED_SHA=<the request's exact 40-character product end SHA>
```

or:

```text
VERDICT=CHANGES_REQUESTED
REVIEWED_SHA=<the request's exact 40-character product end SHA>
```

Record it with:

```bash
scripts/os-pipeline/run-pipeline.sh \
  --record-review-result AR-W1 PASS /path/to/review-result.md
```

The transaction rechecks checkpoint status, requested SHA, result SHA, and
freshness before copying the source to the Manifest-designated canonical result
path. Product/code changes after the request reject the old review; only
authorized pipeline governance artifacts may follow the requested product SHA.

## Architecture remediation

`CHANGES_REQUESTED` selects a real remediation PR cycle. Before invoking Codex,
the runner reserves a unique run ID, attempt, branch, and canonical run artifact
in one state transaction. The external remediation brief includes the wave,
checkpoint, attempt, cumulative start/end SHA, Architecture Review findings,
fixed scope, and required planning target.

Codex must create a PR and implementation report. The runner verifies exact
repository/base/head/report identity, executes local and GitHub checks, records
pre-merge verification, merges with the verified head, fast-forwards planning,
archives the prior review request/result, increments the attempt once, and
generates a fresh checkpoint request for the new product SHA. The resulting
checkpoint is `awaiting_review`; remediation never self-approves it.

A Codex failure leaves the reservation recoverable and does not increment
`remediation_attempts`. A second reviewed remediation failure changes the
checkpoint to `needs_human`; a third remediation cannot start. There is no
production `--record-remediation-result` shortcut.

## STEVEN-IA gate

STEVEN-IA can be recorded only after AR-W2 is `passed` with a valid reviewed
SHA. Use a GitHub-style approver identity and a UTC RFC3339 timestamp:

```bash
scripts/os-pipeline/run-pipeline.sh \
  --record-steven-ia stevenmacmini 2026-07-15T12:00:00Z
```

The transaction commits the Manifest approval and this canonical artifact
together:

```text
HUMAN_GATE=STEVEN-IA
DECISION=APPROVED
APPROVED_BY=stevenmacmini
APPROVED_AT=2026-07-15T12:00:00Z
AR_W2_REVIEWED_SHA=<AR-W2 reviewed SHA>
```

An identical replay is a clean no-op. A different or incomplete duplicate
fails closed. Each required control field must appear exactly once, the
artifact must be a regular non-symlink repository file, and the legacy
`GATE=` / `APPROVER=` aliases are rejected rather than treated as a second
authority schema.

## Final Audit

The final audit becomes eligible only when every task is completed/superseded,
every wave checkpoint has passed with a reviewed SHA, and every human gate is
approved with matching canonical evidence. One `--cycle` transaction creates
`audit/OS38_FINAL_CODE_REVIEW_REQUEST.md`. The last wave checkpoint reviewed
SHA must be a valid commit and an ancestor of the synchronized planning HEAD;
it is a prerequisite, not the Final Audit target. The transaction records the
current planning HEAD immediately before the request commit as
`requested_product_sha`, records `requested_at`, and changes
`final_audit.status` from `pending` to `running`. This makes the independent
audit cover the complete repository state, including reviewed product,
Prisma/migrations, Pipeline changes, governance documents, and checkpoint
results merged after the last Architecture Review.

The request contains:

```text
AUDIT_ID=AUDIT-OS3.8
BASELINE_SHA=<first wave start SHA>
LAST_CHECKPOINT_REVIEWED_SHA=<last passed wave checkpoint SHA>
REQUESTED_PRODUCT_SHA=<synchronized planning HEAD before this request commit>
REQUESTED_AT=<UTC timestamp>
REPORT_PATH=audit/OS38_FINAL_CODE_REVIEW_REPORT.md
RELEASE_GATE=BLOCKED
```

While status is `running`, restarts cleanly wait and never generate a second
request. The independent auditor writes a regular, non-symlink result file
outside the repository with exactly one verdict and one reviewed SHA:

```text
VERDICT=PASS
REVIEWED_SHA=<REQUESTED_PRODUCT_SHA>
```

or `VERDICT=FAIL`. `PASS_WITH_CONDITION` is not accepted as PASS. Record the
external source with:

```bash
scripts/os-pipeline/run-pipeline.sh \
  --record-final-audit PASS /path/outside/repository/final-audit-result.md
```

The source checksum is rechecked inside the state transaction. The runner also
revalidates every wave/gate, the canonical request, the requested SHA, and the
absence of any repository change after the canonical request commit. The sole
commit between `REQUESTED_PRODUCT_SHA` and result recording must be the request
commit, and that commit must change exactly the Manifest and canonical request
artifact. It then copies the result to the
Manifest-configured report path and atomically records `pass` or `fail`, the
same `requested_at`, the matching `reviewed_sha`, and `completed_at`.

For `running`, `pass`, and `fail` states, the validator requires the configured
request/report paths and their state-specific timestamps/SHA invariants. A
terminal result must retain a valid `requested_at`, and its `reviewed_sha` must
equal `requested_product_sha`.

Even a valid Final Audit PASS leaves `release_gate.status=blocked`,
`auto_tag=false`, and `auto_deploy=false`. A separate explicit Steven release
approval and a manual release/deploy procedure outside this runner are always
required.

## Final Release Architecture Review

Final Audit PASS does not directly create a Final Release Approval. The
Manifest has a sibling `final_release_review` state machine (`pending`,
`awaiting_review`, `passed`) while the production `release_gate` remains only
`blocked` or `approved`. Pending and awaiting review require a blocked gate,
no approval artifact, and all auto actions disabled.

The canonical request transaction is:

```bash
scripts/deployment/request-final-release-review.sh <RELEASE_SHA>
```

It runs only from a clean dedicated branch at synchronized `origin/main`,
uses candidate-first validation plus a lock-held TOCTOU recheck, and commits
only the Manifest and canonical request artifact. Ordinary and linked
worktrees share an owner-bound lock in the canonical Git common-dir. Every
failure after the first owned write restores the original HEAD, Manifest,
artifact state, index, worktree, remote request branch and owned lock. The artifact binds
`PRE_REQUEST_MAIN_SHA`; it never claims its own future commit/PR head or a
future review identity. GitHub is the sole authority for the exact request PR
head.

After that separate Request PR is reviewed and merged, verify it with:

```bash
scripts/deployment/validate-final-release-review-request.sh \
  --verify-pr https://github.com/sohoteam88/NextShift-OS-2.0/pull/<number>
```

The verifier obtains repository/base/head/merge and changed files from GitHub,
requires the request artifact at that exact Git tree, and accepts exactly one
review from the Manifest's immutable `sohoteam88`/`OWNER` reviewer policy,
with `CHECKPOINT: FINAL-RELEASE`, `VERDICT: PASS`, a `commit_id` equal to the
exact request head, and `REVIEWED_RELEASE_SHA` equal to the authorized
release. Those three body controls must each appear exactly once in canonical
case and format; malformed, padded, duplicate or conflicting authority lines
fail closed. A later independent approval artifact persists that PR/review
identity and is revalidated live before deploy or rollback. Request drift,
unmerged requests, review/head mismatches, artifact digest changes, or release
drift fail closed.

## Validation suite

Run the complete pipeline validation from the repository root:

```bash
scripts/os-pipeline/validate-manifest.sh

while IFS= read -r file; do bash -n "$file"; done \
  < <(find scripts/os-pipeline -type f -name '*.sh' -print)

shellcheck $(find scripts/os-pipeline -type f -name '*.sh' -print)

scripts/os-pipeline/tests/run.sh
scripts/os-pipeline/tests/git-integration.sh
scripts/os-pipeline/tests/remediation-integration.sh
scripts/os-pipeline/tests/governance-integration.sh
scripts/os-pipeline/tests/safety-integration.sh
scripts/os-pipeline/tests/docs-only-ci-policy.sh
scripts/os-pipeline/tests/governance-dispatch-gate.sh
scripts/deployment/tests/final-release-review.sh

git diff --check
pnpm type-check
pnpm test
pnpm lint
pnpm build
```

Expected pipeline-specific coverage is:

- Bash syntax and ShellCheck: **10 Pipeline/test shell files**, with zero
  ShellCheck issues.
- `tests/run.sh`: **42 state-machine/Manifest assertions**, including generic
  rejection of running or completed downstream tasks whose declared task
  dependency is incomplete.
- `tests/git-integration.sh`: a real temporary bare-Git
  **E1 → Codex outcome → exact PR verification → merge → planning
  reconciliation → E1 completion → automatic E2 selection/completion → AR-W1
  request → clean `awaiting_review` stop** flow.
- `tests/remediation-integration.sh`: **18 named Group C real-Git fixtures**
  covering atomic reservation, failed-Codex restart state, exact PR
  verify/merge, regenerated checkpoint, source-review archival, attempt limits,
  branch-only/open/merged recovery, and two reviewed failures to
  `needs_human`.
- `tests/governance-integration.sh`: **31 named Group D real-Git fixtures**:
  `steven_ia_transaction`, `steven_ia_duplicate_rejected`,
  `final_audit_request_once`, `final_audit_running_clean_wait`,
  `final_audit_pass_persistence`, `final_audit_wrong_sha_rejected`,
  `final_audit_product_change_rejected`, and
  `final_audit_cannot_release`, plus ten Final Audit target-contract fixtures:
  `final_audit_targets_current_planning_head`,
  `final_audit_checkpoint_sha_must_be_ancestor`,
  `final_audit_includes_reviewed_pipeline_changes_after_checkpoint`,
  `final_audit_request_sha_matches_pre_request_head`,
  `final_audit_request_commit_not_part_of_requested_sha`,
  `final_audit_result_must_match_requested_planning_sha`,
  `final_audit_code_change_after_request_rejected`,
  `final_audit_request_duplicate_clean_stop_or_rejected_without_mutation`,
  `final_audit_request_push_failure_rolls_back`, and
  `final_audit_request_keeps_release_gate_blocked`; plus thirteen STEVEN-IA
  artifact-contract fixtures: `canonical_human_gate_artifact_accepted`,
  `legacy_gate_key_rejected`, `legacy_approver_key_rejected`,
  `mixed_canonical_and_legacy_authority_rejected`,
  `duplicate_human_gate_field_rejected`,
  `duplicate_approved_by_field_rejected`,
  `mismatched_human_gate_id_rejected`, `mismatched_approved_by_rejected`,
  `mismatched_approved_at_rejected`, `mismatched_reviewed_sha_rejected`,
  `approval_artifact_symlink_rejected`,
  `pipeline_generated_approval_uses_canonical_fields`, and
  `real_repository_steven_ia_artifact_satisfies_final_audit_prerequisites`.
- `tests/safety-integration.sh`: **14 named Round 5 real-Git fixtures** covering
  normal task merged/running crash recovery and ambiguous identity, exact-head
  merge races, Wave checkpoint PASS persistence and stale-product rejection,
  tracked/untracked dirty gates, local/remote divergence, live/stale common-dir
  lock contention, quoted metacharacter injection, pre-write final-component
  symlink rejection, and invalid/missing/out-of-PR implementation reports. The
  invalid-report fixture contains independent invalid, missing-at-head, and
  absent-from-diff subcases.
- `tests/docs-only-ci-policy.sh`: **34 named docs-only CI policy fixtures**—the
  original 18 exact-diff/check/workflow/validator cases plus 16 task-policy
  cases covering U1A/U2 authorization, rejection for every actual-check task,
  missing/unknown policies, forged/mismatched/cross-task evidence, caller
  non-authority, recovery revalidation, and exact PR #84 U1A evidence.
- `tests/governance-dispatch-gate.sh`: **49 named real-Git production-path
  fixtures**. Twenty-one policy/candidate/rollback fixtures prove immutable
  option and protected-path policy, reviewed decision/digest binding, required
  ADR completeness (including separate rejection of decisions that predate
  tenant-deletion retention, terminal operational deactivation, or final-row
  idempotency, plus an explicit idempotency-decision identity mismatch),
  transport-envelope non-authority, candidate-before-write,
  locked drift rejection, byte-identical post-write/push rollback, atomic
  adoption, and duplicate clean stop. Twenty-eight dispatch/lifecycle fixtures
  cover pending/missing/non-PASS/mismatched/stale/unknown/manual gates,
  gate-ID/partial-schema rejection, Option C proof, dependency evidence, valid
  exact-PASS dispatch, selection-to-lock and planning-head TOCTOU, duplicate/
  stale/valid adoption, state-independent pending E3A/E3B/AR-W3 setup, generic
  rejection of running/completed downstream tasks with incomplete dependencies,
  and named proof that a rejected U3B gate cannot select E3A/E3B, generate a
  checkpoint, invoke Codex, create or push a branch, create a PR, write dispatch
  evidence, or mutate/commit the Manifest.

The real-Git fixtures use temporary bare remotes/worktrees plus fake GitHub and
Codex commands. They do not contact GitHub, execute real E1/E2 product work,
tag, release, deploy, or touch production. `PIPELINE_TEST_MODE` and
`PIPELINE_ALLOW_LOCAL_TEST_REMOTE` are fixture-only controls and must not be
used for operator runs.

## Migration from local operator scripts

Do not overwrite or delete an existing local pipeline installation. Back it up
outside the repository, update the authorized checkout, then run the validator
and `--plan` before changing any scheduled command. No VPS address, SSH key,
production URL, or deployment path belongs in this runner or its configuration;
production settings remain external and release/deploy remain manual.
