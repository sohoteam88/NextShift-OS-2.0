# OS 3.8 Wave Execution Contract

Version: 1.0 Draft

Status: Awaiting Steven merge approval

Date: 2026-07-15

Owner: ChatGPT Work — Chief Product Architect / Architecture Review Board

Machine authority: [OS 3.8 Pipeline Manifest](PIPELINE_MANIFEST.json)

Product authority: [OS 3.8 Blueprint](../OS_3_8_BLUEPRINT.md)

---

## 1. Decision

OS 3.8 executes as three Waves. A task completing successfully automatically unlocks the next dependency-satisfied task in the same Wave. The pipeline pauses only at a Wave Architecture Review checkpoint, an explicit human product gate, a failed safety/verification gate, or final release approval.

Architecture Review is cumulative at Wave end. Independent technical Audit occurs once after the complete OS 3.8 scope.

## 2. Separation of Duties

| Role | Authority |
| --- | --- |
| Steven | Product/IA/release approval and final merge authority |
| ChatGPT Work | Blueprint, contract, Wave checkpoint Architecture Review, acceptance decision |
| Codex CLI | Task implementation, tests, implementation report, PR creation |
| Pipeline | Mechanical selection, verification, merge to planning branch, state/evidence recording |
| Claude Code CLI | One independent final OS 3.8 Audit only |

Claude Code must not impersonate ChatGPT Work at Wave checkpoints. The pipeline cannot invoke this conversation directly; it creates a GitHub review-request artifact and sets the checkpoint to `awaiting_review`.

## 3. Wave Plan

| Wave | Automatic task sequence | Pause point |
| --- | --- | --- |
| W1 | E1 Editable Content → E2 Content Library | AR-W1 cumulative Architecture Review |
| W2 | U1A Dead-code Inventory + U2 one-page IA | AR-W2, then Steven approves full IA map |
| W3 | U1B approved removals → U3 navigation → E3A revalidation → E3B proven fixes | AR-W3 cumulative Architecture Review |
| Final | No implementation task | One Claude Code Audit → Steven release decision |

Automated verification runs after every task PR. Deferring Architecture Review does not defer tests or safety guards.

## 4. Canonical Branch Model

```text
main
  └── planning/os-3.8-product-usability
        ├── pipeline/<run-id>-E1
        ├── pipeline/<run-id>-E2
        └── subsequent task branches
```

- Task PRs target the planning branch.
- A task PR may merge automatically only after local verification, GitHub checks, forbidden-path guards, and contract checks pass.
- Wave Architecture Review compares the Wave `start_sha` with the planning branch head after all Wave tasks merge.
- Planning does not merge to `main` automatically.

## 5. Task Selection

The pipeline must load `PIPELINE_MANIFEST.json` with `jq`; it must not infer task order from Markdown table position.

Selection algorithm:

1. Find the first Wave whose checkpoint is not `passed`.
2. If the Wave has not started, record the planning branch HEAD as `start_sha` and set Wave status to `running`.
3. Select the first `pending` task whose `depends_on` references are satisfied.
4. If a task has a committed contract/task path, use them as primary instructions.
5. Otherwise ask the orchestration CLI to produce a bounded task brief from the referenced Blueprint section and current repository evidence.
6. Never select a task marked `running`, `completed`, `blocked`, or `superseded`.

## 6. Per-task Automatic Cycle

For each task:

1. Create a fresh task branch from the planning branch.
2. Dispatch the bounded brief to Codex.
3. Codex implements, tests, writes an implementation report, pushes, and opens a PR.
4. Pipeline independently runs install, Prisma client generation, type-check, test, build, lint, targeted tests, diff checks, and path guards.
5. Wait for required GitHub checks.
6. Merge the task PR into the planning branch.
7. Record task status `completed`, PR URL, merge SHA, validation summary, and implementation-report path in the manifest.
8. If another task in the same Wave is eligible, the next loop cycle starts it automatically without Architecture Review.

Pipeline verification failure leaves the PR open, marks the task `blocked`, records evidence, and stops. It must never weaken tests to continue.

## 7. Wave Architecture Review Checkpoint

When every task in a Wave is completed:

1. Compute the cumulative diff from `start_sha` to planning HEAD.
2. Create the manifest-designated `W*_ARCHITECTURE_REVIEW_REQUEST.md` containing:
   - Wave and task IDs;
   - starting and ending SHA;
   - PR URLs and merge SHAs;
   - files changed;
   - validation/check results;
   - implementation-report links;
   - known limitations;
   - cumulative diff command.
3. Set checkpoint status to `awaiting_review` and exit successfully.
4. Notify Steven that ChatGPT Work review is required.

ChatGPT Work reads GitHub evidence and writes the result artifact:

- `PASS`: checkpoint becomes `passed`; next Wave may start.
- `FAIL`: checkpoint becomes `changes_requested` with bounded remediation requirements.

On `changes_requested`, the pipeline dispatches a Wave remediation task to Codex, verifies and merges it, regenerates the review request, and returns to the same checkpoint. After two failed remediation reviews, status becomes `needs_human`.

## 8. Human Product Gate

W2 contains `STEVEN-IA` because Keep/Merge/Hide/Redirect decisions change the user-facing product structure.

After AR-W2 PASS:

- pipeline stops if `STEVEN-IA.status` is not `approved`;
- Steven approval must be recorded in GitHub with approver and timestamp;
- U1B or U3 cannot start without both AR-W2 PASS and STEVEN-IA approval.

This is an intentional product-decision pause, not an engineering interruption.

## 9. Final Audit

The pipeline must not count merged PRs or use `AUDIT_EVERY_N_PRS` for OS 3.8.

Trigger the single Claude Code Audit only when:

- every task is completed or explicitly superseded;
- AR-W1, AR-W2, and AR-W3 are `passed`;
- STEVEN-IA is `approved`;
- planning branch is clean and synchronized;
- required checks are green.

Audit covers the full diff from the approved OS 3.8 baseline to planning HEAD. `PASS_WITH_CONDITION` or `FAIL` does not unlock release.

## 10. Release Safety

- `AUTO_RELEASE` and `AUTO_DEPLOY` default to `0`.
- Pipeline may prepare an RC report after final Audit PASS.
- It must not merge planning to main, create a tag, edit VPS environment, reveal flags, or deploy without a separate Steven release approval.
- Production rollback is never implemented by deleting user content.

## 11. State Integrity

- Manifest updates occur only on the planning branch after the associated evidence exists.
- State transitions must be validated against an allowlist.
- A task cannot move directly from `pending` to `completed`.
- A Wave cannot pass while a task is pending/running/blocked.
- A downstream dependency cannot start from prose inference; referenced IDs must be satisfied in the manifest.
- Restarting the loop must resume current state rather than repeat a completed task.

## 12. Acceptance Criteria

Wave mode is ready when:

- manifest schema validation passes;
- E1 completion automatically selects E2 without review interruption;
- E2 completion generates AR-W1 request and pauses;
- AR-W1 PASS unlocks W2;
- W2 requires both AR-W2 PASS and STEVEN-IA approval before W3;
- architecture FAIL produces bounded remediation and never advances the Wave;
- no per-task or per-N-PR independent Audit occurs;
- final Audit cannot trigger before all Wave gates pass;
- release and deployment remain manual by default;
- restart/idempotency tests prove completed tasks are not repeated.

## 13. Stop Condition

This contract authorizes only the one-time pipeline Wave-mode upgrade and OS 3.8 execution orchestration. It does not authorize product implementation, production deployment, release tagging, or weakening existing safety guards.
