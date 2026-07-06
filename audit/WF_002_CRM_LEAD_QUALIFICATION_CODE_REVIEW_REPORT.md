# WF-002 CRM Lead Qualification — Code Review Report

- **Verdict:** PASS
- **Reviewer:** Claude Code — NextShift Chief Workflow Code Reviewer
- **Contract:** WF_002_CLAUDE_CODE_REVIEW_CONTRACT_v1.0.md
- **Review Date:** 2026-07-06
- **Packages Reviewed:** runtime-adapters, workspace-runtime
- **Scope:** First business workflow implementation prior to commit

---

## 1. Verdict

**PASS — no required fixes. Release-ready.**

All 5 changed files reviewed. All 21 tests pass across the full monorepo. All typechecks, builds, and git diff checks pass. 4 advisory findings are logged below; none block release.

---

## 2. Workflow Assessment

### Flow Verified

The WF-002 execution order was traced end-to-end:

```
1. CRM lead input
2. crmAdapter.emitLeadCreatedEvent(lead) → session.receiveRepositoryRuntimeEvent()
   → runtime task created (status: awaiting_operator)
   → bus: crm.lead.created, workspace.task.created
   → audit: "recorded"

3. crmAdapter.createLeadScoringRequest(lead)
   → businessAdapter.decide(action: "qualify_crm_lead", subject: lead.id)
   → session.attachBusinessDecision(finalStatus: "awaiting_operator")
   → bus: business.decision.completed
   → audit: "qualified" | "rejected"

4. session.recordOperatorDecision(operator, operatorDecision)
   → bus: workspace.operator.decision_presented
   → audit: "approved" | "rejected"

5. Guard: if (!operatorDecision.approved || !businessDecision.approved) → return early
   (statusUpdate and validation absent from result; no simulation events emitted)

6. crmAdapter.simulateStatusUpdate(lead, "qualified")
   → bus: crm.status_update.simulated
   → audit: "simulated"

7. crmAdapter.validateStatusUpdate? ?? inline validation
   → bus: crm.status_update.validated
   → audit: "validated"

8. Return: { lead, task, scoringRequest, businessDecision,
             operatorDecision, statusUpdate, validation, auditTrailEntries }
```

### Inverted Decision Order

WF-002 runs business qualification **before** operator approval. This is an intentional inversion from the Sprint-005/Sprint-006 Repository Health flow (operator → business). The design is correct for the CRM use case: the business brain qualifies the lead first, then the operator reviews the qualification result and approves or overrides.

The mechanism is `attachBusinessDecision(finalStatus: "awaiting_operator")`, which temporarily parks the task back to `awaiting_operator` after the business decision, so the operator's approval step sees the qualified lead. This is correct and verified by the test assertions (`result.task.title === "Qualify CRM lead"`, audit trail order matches).

### Dual-Guard on Simulation

The early-exit guard at step 5 uses `||` — simulation is blocked if either the operator rejects or the business rejects. This is the conservative and correct policy. Both conditions are independently meaningful; OR is the right combinator.

The test suite covers the operator-rejection path. The business-rejection path is noted as A-003.

---

## 3. Architecture Assessment

### Package Assignment

| Component | Package | Correct |
|---|---|---|
| `CRMLead`, `CRMLeadStatus`, `CRMLeadCreatedEvent` | runtime-adapters/src/crm | Yes |
| `CRMRuntimeAdapter`, `InMemoryCRMRuntimeAdapter` | runtime-adapters/src/crm | Yes |
| `LeadScoringRequest`, `CRMStatusUpdateSimulationResult` | runtime-adapters/src/crm | Yes |
| `LeadQualificationWorkflow` | workspace-runtime/src | Yes |
| `InMemoryLeadQualificationAuditTrailRecorder` | workspace-runtime/src | Yes |
| `WorkspaceSession.recordOperatorDecision` (new) | workspace-runtime/src | Yes |
| `WorkspaceSession.attachBusinessDecision` (new) | workspace-runtime/src | Yes |

`LeadQualificationWorkflow` lives in `workspace-runtime`, not `runtime-orchestrator`. This is consistent with the existing `RepositoryHealthWorkflow` placement and preserves the boundary: orchestrator coordinates runtime steps; workspace-runtime provides the session model and domain-specific workflow wrappers.

### Dependency Direction

No new dependency arcs were introduced. The existing direction is maintained:

```
runtime-core ← runtime-adapters ← workspace-runtime
runtime-core ← event-bus ← workspace-runtime
```

`runtime-adapters/src/crm/index.ts` imports only from `@nextshift/runtime-core`. No imports from `workspace-runtime` or `event-bus`. No circular dependencies.

### Barrel Exports

`runtime-adapters/src/index.ts` adds `export * from "./crm"` as the third export after `./repository` and `./business`. The order is logical and the export is complete.

`workspace-runtime/src/index.ts` exports all new public types and classes: `LeadQualificationAuditStatus`, `LeadQualificationAuditTrailEntry`, `LeadQualificationAuditTrailRecorder`, `InMemoryLeadQualificationAuditTrailRecorder`, `LeadQualificationWorkflow`, `LeadQualificationWorkflowDependencies`, `ExecuteLeadQualificationInput`, `LeadQualificationWorkflowResult`, `RecordOperatorDecisionInput`, `AttachBusinessDecisionInput`.

### WorkspaceSession Refactor

`presentOperatorDecision` now delegates to two new public methods: `recordOperatorDecision` and `attachBusinessDecision`. The original single-method signature and behaviour are preserved — existing tests pass unchanged. The extraction is backward-compatible.

`AttachBusinessDecisionInput.finalStatus?: RuntimeTaskStatus` allows callers to override the post-business-decision task status. WF-002 uses `finalStatus: "awaiting_operator"` to park the task for operator review. This is an intentional, clean extension point.

---

## 4. Safety Assessment

### No Real CRM Modification

`InMemoryCRMRuntimeAdapter.simulateStatusUpdate` returns a plain object literal. No external I/O, no HTTP calls, no database writes. The `CRMStatusUpdateSimulationResult` interface enforces `simulated: true` and `destructive: false` as **literal types** — not `boolean`, not assignable from arbitrary values. This is the strongest possible type-level safety guarantee.

`validateStatusUpdate` in `InMemoryCRMRuntimeAdapter` checks `result.simulated && !result.destructive` — the validation logic reads back the safety literals from the simulation result. If a non-in-memory adapter were to return `simulated: false` or `destructive: true`, the validation would flag it.

### Mandatory Operator Approval

The simulation guard is a hard code path:

```ts
if (!operatorDecision.approved || !businessDecision.approved) {
  return { ..., statusUpdate: undefined, validation: undefined };
}
```

There is no way to reach `simulateStatusUpdate` without passing this guard. The "requires operator approval" test confirms `simulatedUpdates` is empty when `operatorDecision.approved = false`.

### Business Decision Capture

`createLeadScoringRequest` produces a `LeadScoringRequest` with `requestId` sourced from `idFactory()`. `businessAdapter.decide()` receives `action: "qualify_crm_lead"` and `subject: lead.id` — both verified in test assertions. The result is stored and propagated through the return value.

### Audit Trail Completeness

5 audit entries are recorded for the happy path, in order:
1. `crm.lead.created` → `"recorded"`
2. `business.lead_qualification.completed` → `"qualified"` | `"rejected"`
3. `workspace.operator.decision_presented` → `"approved"` | `"rejected"`
4. `crm.status_update.simulated` → `"simulated"`
5. `crm.status_update.validated` → `"validated"`

On early exit (operator or business rejection), entries 4 and 5 are not recorded — correct.

---

## 5. Test Assessment

### Test Counts

| Package | Tests | Status |
|---|---|---|
| runtime-core | 2 | PASS (unchanged) |
| event-bus | 3 | PASS (unchanged) |
| runtime-orchestrator | 6 | PASS (unchanged) |
| runtime-adapters | 4 | PASS (+1 CRM adapter test) |
| workspace-runtime | 6 | PASS (+2 WF-002 tests) |
| **Total** | **21** | **PASS** |

### New Tests

**`runtime-adapters/test/runtime-adapters.test.ts`** — `"creates CRM lead scoring requests and simulated status updates"`:
- Instantiates `InMemoryCRMRuntimeAdapter` with injected `now` and `idFactory`.
- Calls `emitLeadCreatedEvent`, `createLeadScoringRequest`, `simulateStatusUpdate`, `validateStatusUpdate` in sequence.
- Asserts `eventType === "crm.lead.created"`, `scoringRequest.signals === lead.scoreSignals`, `simulated: true`, `destructive: false`, `validation.valid === true`.

**`workspace-runtime/test/workspace-runtime.test.ts`** — `"executes WF-002 end-to-end..."`:
- Subscribes to all 6 event types and collects `routedEvents`.
- Asserts `result.task.title === "Qualify CRM lead"`.
- Asserts `result.businessDecision.approved === true`.
- Asserts `result.statusUpdate` matches `{ leadId, previousStatus: "new", nextStatus: "qualified", simulated: true, destructive: false }`.
- Asserts audit trail has exactly 5 entries in correct order.
- Asserts `businessRequests[0].action === "qualify_crm_lead"` and `subject === "lead-1"`.
- Asserts `routedEvents` sequence is exactly the 6 expected event types in order.

**`workspace-runtime/test/workspace-runtime.test.ts`** — `"requires operator approval before simulating CRM status update"`:
- Sets `operatorDecision.approved = false`.
- Asserts `result.businessDecision.approved === true` (business approved regardless).
- Asserts `result.statusUpdate === undefined`.
- Asserts `result.validation === undefined`.
- Asserts `simulatedUpdates === []` (no simulation event emitted).

### Validation Checks

| Check | Result |
|---|---|
| `pnpm --filter @nextshift/runtime-adapters tsc --noEmit` | PASS |
| `pnpm --filter @nextshift/workspace-runtime tsc --noEmit` | PASS |
| `pnpm --filter @nextshift/runtime-adapters test` | 4/4 PASS |
| `pnpm --filter @nextshift/workspace-runtime test` | 6/6 PASS |
| `pnpm --filter @nextshift/runtime-core test` | 2/2 PASS |
| `pnpm --filter @nextshift/event-bus test` | 3/3 PASS |
| `pnpm --filter @nextshift/runtime-orchestrator test` | 6/6 PASS |
| `pnpm build` (all packages) | PASS |
| `pnpm type-check` (monorepo) | PASS |
| `git diff --check` | PASS (exit 0) |
| `git diff --cached --check` | PASS (exit 0) |

---

## 6. Required Fixes

None.

---

## 7. Advisory Findings

These findings do not block release. They are recorded for awareness and future sprints.

### A-001 — WorkspaceSession: no closed-session guard (carry-forward)

**Location:** `packages/workspace-runtime/src/index.ts` — `WorkspaceSession`

After `close()` is called, `receiveRepositoryRuntimeEvent`, `presentOperatorDecision`, `recordOperatorDecision`, and `attachBusinessDecision` can still be invoked without error. Closed-session mutations are silently accepted.

**Recommendation:** Add a guard at the top of each mutating method:
```ts
if (this.status === "closed") throw new Error("WorkspaceSession is closed");
```

This was noted in Sprint-006 (A-001) and remains unaddressed.

---

### A-002 — `attachBusinessDecision(finalStatus: "awaiting_operator")` is non-obvious

**Location:** `packages/workspace-runtime/src/index.ts` — `LeadQualificationWorkflow.execute()`

Using `finalStatus: "awaiting_operator"` to park a task back to awaiting_operator after the business decision is a subtle flow control mechanism. There is no comment explaining why the status is set back rather than left at whatever the business decision sets it to. A future implementer may not understand the intent.

**Recommendation:** Add a brief inline comment at the call site explaining that the task is intentionally parked back to `awaiting_operator` so the operator reviews the business qualification result before approving.

---

### A-003 — Business rejection path not tested

**Location:** `packages/workspace-runtime/test/workspace-runtime.test.ts` — `LeadQualificationWorkflow`

The existing no-approval test sets `operatorDecision.approved = false` while `businessDecision.approved = true`. The path where `businessDecision.approved = false` (business rejects the lead outright before the operator acts) is not covered.

In this path, the operator is still asked and their decision is recorded, but simulation is blocked. The test would confirm that `result.statusUpdate === undefined` when the business rejects, regardless of operator input.

**Recommendation:** Add a test `"blocks simulation when business decision is rejected"` with a business adapter that returns `decision: "rejected"`.

---

### A-004 — `"pending"` RuntimeTaskStatus unused (carry-forward)

**Location:** `packages/workspace-runtime/src/index.ts` — `RuntimeTaskStatus`

The `"pending"` status is present in the `RuntimeTaskStatus` union but is never assigned by any workflow in the monorepo. `WorkspaceSession` creates tasks directly in `"awaiting_operator"` status. If `"pending"` is intended for a future async queuing pattern, it is harmless. If it is vestigial from an earlier design, it can be removed.

This was noted in Sprint-006 advisory findings.

---

## 8. Release Recommendation

**Recommend PASS for commit and release.**

WF-002 is the first complete business workflow in the NextShift Runtime. The implementation is architecturally sound, the safety boundaries are enforced at the type level, the audit trail is complete, and the test suite covers both the happy path and the critical safety rejection path. All advisory findings are low severity and can be addressed in a follow-up sprint.
