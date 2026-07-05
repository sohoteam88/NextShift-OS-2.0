# NextShift Runtime Sprint-004 Code Review Report

Version: v1.0
Status: PASS
Sprint: Sprint-004 — Runtime Hardening
Reviewer: Claude Code — Chief Runtime Code Reviewer

---

## Review Result

PASS

All four Sprint-003 advisory findings addressed. All validation passes. No regressions. 12/12 tests pass. Ready for commit.

---

## Validation

| Check | Result |
| --- | --- |
| pnpm type-check (root) | PASS |
| @nextshift/runtime-core typecheck | PASS |
| @nextshift/event-bus typecheck | PASS |
| @nextshift/runtime-orchestrator typecheck | PASS |
| @nextshift/runtime-adapters typecheck | PASS |
| @nextshift/runtime-core tests | PASS — 2 passed (was 1) |
| @nextshift/event-bus tests | PASS — 3 passed (was 1) |
| @nextshift/runtime-orchestrator tests | PASS — 4 passed (was 2) |
| @nextshift/runtime-adapters tests | PASS — 3 passed (was 2) |
| Total tests | 12 passed |
| git diff --check | PASS |
| git diff --cached --check | PASS |
| Trailing whitespace scan | PASS |

---

## 1. F-001 — RuntimeEvent Field Consistency

**Status: Addressed**

No model rename was introduced. `type` and `eventType` remain both present on `RuntimeEvent`. `createRuntimeEvent` continues to set both from `input.type`. Factory behavior is unchanged. Existing Sprint-003 test passes.

New test in `packages/runtime-core/test/runtime-event.test.ts`:

```
"rejects events with mismatched type and eventType"
```

Spreads a valid event and overrides `eventType` to a different value, then asserts `isRuntimeEvent` returns `false`. This directly exercises the `candidate.eventType === candidate.type` branch of the guard. Correct and sufficient to confirm the guard's mismatch rejection behavior.

**Backward compatibility:** Full. No public API changed.

---

## 2. F-002 — Orchestrator Failure Path

**Status: Fully addressed**

`packages/runtime-orchestrator/src/index.ts` changes:

- `RuntimeWorkflowExecution` gains `failedStepId?: string` — optional, backward compatible.
- `errors: string[]` accumulator added to `execute()`.
- Step loop body wrapped in `try-catch`. On catch:
  - `describeRuntimeError(error)` extracts `error.message` for `Error` instances, falls back to `String(error)` for non-Error throws — correct and safe.
  - `"runtime.workflow.failed"` event created with `{ workflowId, stepId, error }` payload and published via `this.publish()` — event is recorded in `emittedEvents` regardless of bus availability.
  - Returns `{ status: "failed", output: { workflowId, completedStepIds, failedStepId: step.id }, events: emittedEvents, errors }`.
- `completedStepIds` correctly reflects only steps that completed before the failure.

All F-002 requirements verified:

| Requirement | Result |
| --- | --- |
| Structured failed result | PASS — `status: "failed"` with `RuntimeResult` |
| Errors included | PASS — `errors: [describeRuntimeError(error)]` |
| Completed step IDs up to failure | PASS — `completedStepIds` at time of catch |
| Failed step ID | PASS — `failedStepId: step.id` |
| `runtime.workflow.failed` event emitted | PASS — via `this.publish()` both to emittedEvents and bus |
| Existing successful workflow behavior | PASS — Sprint-003 tests unchanged and passing |

New tests:

- `"returns a structured failed result when a step throws"`: step-1 completes, step-2 throws. Verifies `status: "failed"`, `completedStepIds: ["step-1"]`, `failedStepId: "step-2"`, `errors: ["step failed"]`. Complete.
- `"emits a failed workflow event when the event bus is available"`: integrates `InMemoryEventBus<RuntimeEvent>`, subscribes to `"runtime.workflow.failed"`, verifies event received with correct `eventType` and payload fields. Complete.

**One observation (non-blocking):** The catch block also applies to `step.isApproved()` on approval gates. If a gate's `isApproved` method throws, it produces `status: "failed"` with `failedStepId` pointing to the gate. This is reasonable behavior — a gate that cannot evaluate its condition is a failure — but it is not tested. Advisory for a future sprint.

**One code observation (non-blocking):** At the end of the success path, `errors: errors.length > 0 ? errors : undefined` evaluates to `undefined` in all reachable cases, because the loop exits immediately on first error via early return. Could be simplified to `undefined` or omitted in the success return. Does not affect correctness.

---

## 3. F-003 — Event Bus Handler Isolation

**Status: Fully addressed**

`packages/event-bus/src/memory/index.ts` changes:

- `EventBusHandlerFailure` interface: `{ eventType: string; handlerIndex: number; error: unknown }` — captures per-handler failure with index into the dispatch array.
- `EventBusPublishError extends Error`: sets `this.name = "EventBusPublishError"`, holds `failures: readonly EventBusHandlerFailure[]`, message includes event type and failure count. Correct custom error class pattern.
- `publish` now uses `Promise.allSettled` — all handlers execute regardless of individual failures. Rejected results are collected into `failures`. `EventBusPublishError` is thrown only if failures exist.
- Handler set is snapshotted to an array before dispatch (`Array.from(...)`) — prevents set mutation during iteration. Correct.

All F-003 requirements verified:

| Requirement | Result |
| --- | --- |
| All subscribers execute when one throws | PASS — `Promise.allSettled` |
| Failures surfaced deterministically | PASS — `EventBusPublishError` with `failures[]` |
| Happy-path publish/subscribe compatible | PASS — Sprint-003 test unchanged |
| Multiple subscriber behavior tested | PASS — new test |

New tests:

- `"delivers one event to multiple subscribers"`: two handlers on same event type, both called in insertion order. Confirms `Set` ordering is preserved.
- `"continues dispatching when one handler throws"`: handler[0] throws, handler[1] appends "second" to received. `publish` rejects with `EventBusPublishError`. Verified via `rejects.toMatchObject` with `satisfies Partial<EventBusPublishError>` — type-safe partial matching. `received` confirms handler[1] ran. Complete.

**One interaction to note (non-blocking):** The orchestrator calls `this.eventBus?.publish(event)` without a try-catch. If a bus subscriber throws and `EventBusPublishError` propagates back, it will be caught by the orchestrator's step-level catch block and treated as a step failure. For example, if a `"runtime.workflow.started"` handler fails, the orchestrator would emit `runtime.workflow.failed` for what is actually a bus-layer error. This is a cross-layer interaction that callers should be aware of. Not a bug at bootstrap scale where bus subscribers are controlled.

---

## 4. F-004 — Business Decision Integrity

**Status: Addressed via factory**

`packages/runtime-adapters/src/business/index.ts` changes:

- `CreateBusinessDecisionResultInput` interface: `{ requestId, decision, reason?, metadata? }` — no `approved` field; callers cannot set it directly.
- `createBusinessDecisionResult` factory: derives `approved: input.decision === "approved"` — single source of truth, divergence is impossible through this path.
- `StaticBusinessRuntimeAdapter.decide` now calls `createBusinessDecisionResult(...)` instead of constructing the result inline — consistent with the factory.

`BusinessDecisionResult` interface is unchanged — `approved: boolean` remains a direct field. Manual construction without the factory can still produce inconsistent values, but all production code paths now route through the factory.

New test:

- `"creates business decision results with consistent approval state"`: `"approved"` → `approved: true`, `"rejected"` → `approved: false`. Correct.

**Remaining gap (advisory, not blocking):** `needs_review` → `approved: false` is not tested. The factory derives `approved` from `=== "approved"`, so `needs_review` correctly produces `false`, but the test does not verify this.

---

## 5. Regression Risk Assessment

**Risk: Low**

| Area | Change | Regression Risk |
| --- | --- | --- |
| runtime-core | Test only — no source change | None |
| runtime-orchestrator | Additive: try-catch, `failedStepId?`, `describeRuntimeError` | Low — optional field, catch doesn't alter success path |
| event-bus | `Promise.all` → `Promise.allSettled` + `EventBusPublishError` | Low — behavior change is additive (more handlers run); callers receive structured error instead of raw throw |
| runtime-adapters | Additive: factory function; adapter uses factory internally | None — same public interface, same output values |

All Sprint-003 tests still pass unchanged. The `Promise.all` → `Promise.allSettled` change is the most material behavioral shift: callers that caught raw handler errors now receive `EventBusPublishError`. No current caller catches publish errors, so no regression in tested paths.

---

## 6. API Compatibility Assessment

**All changes additive. No breaking changes.**

| Export | Change | Compatible |
| --- | --- | --- |
| `RuntimeWorkflowExecution.failedStepId` | Added optional field | Yes |
| `EventBusHandlerFailure` | New interface export | Yes |
| `EventBusPublishError` | New class export | Yes |
| `CreateBusinessDecisionResultInput` | New interface export | Yes |
| `createBusinessDecisionResult` | New function export | Yes |
| All existing exports | Unchanged | Yes |

---

## 7. Test Coverage Assessment

| Package | Sprint-003 | Sprint-004 | Delta |
| --- | --- | --- | --- |
| runtime-core | 1 | 2 | +1 mismatch guard test |
| event-bus | 1 | 3 | +2 multiple subscriber + failure isolation |
| runtime-orchestrator | 2 | 4 | +2 failure path + bus failure emission |
| runtime-adapters | 2 | 3 | +1 factory consistency |
| **Total** | **6** | **12** | **+6** |

All F-001 through F-004 advisory items now have direct test coverage.

**Remaining gaps (carry-forward advisories):**

- `needs_review` → `approved: false` not tested in F-004 factory test
- Approval gate throwing — caught by orchestrator catch, not tested
- `unsubscribe` via returned subscription object — still not tested
- `isRuntimeEvent` with null input, empty string id/type, invalid Date — still not tested
- Orchestrator + event bus cross-layer failure (bus publish throws EventBusPublishError into orchestrator catch)

---

## 8. Required Fixes

None.

---

## Optional Improvements

- Test `needs_review` → `approved: false` in `createBusinessDecisionResult`.
- Test `RuntimeApprovalGate.isApproved` throwing — confirm orchestrator catch handles it and produces `failedStepId` pointing to the gate.
- Test `EventSubscription.unsubscribe()` — confirm handler is no longer called after unsubscribe.
- Simplify the success-path `errors: errors.length > 0 ? errors : undefined` to `undefined` (or omit it) since the accumulator is always empty when the success path is reached.
- Consider whether `EventBusPublishError` should be caught at the orchestrator's `publish()` call site to prevent bus-layer failures from masquerading as step failures.

---

## Release Recommendation

PASS. Sprint-004 Runtime Hardening correctly and completely addresses all four Sprint-003 advisory findings. Implementation is clean, additive, and backward compatible. 12 tests pass. All typechecks clean. No regressions. Ready for commit.
