# NextShift Runtime Sprint-003 Code Review Report

Version: v1.0
Status: PASS
Sprint: Sprint-003 — Runtime Core Bootstrap
Reviewer: Claude Code — Chief Runtime Code Reviewer

---

## Review Result

PASS

No blocking issues. Advisory findings documented below. Ready for commit.

---

## Validation

| Check | Result |
| --- | --- |
| pnpm type-check (root) | PASS |
| @nextshift/runtime-core typecheck | PASS |
| @nextshift/event-bus typecheck | PASS |
| @nextshift/runtime-orchestrator typecheck | PASS |
| @nextshift/runtime-adapters typecheck | PASS |
| @nextshift/runtime-core build | PASS |
| @nextshift/event-bus build | PASS |
| @nextshift/runtime-orchestrator build | PASS |
| @nextshift/runtime-adapters build | PASS |
| @nextshift/runtime-core tests | PASS — 1/1 |
| @nextshift/event-bus tests | PASS — 1/1 |
| @nextshift/runtime-orchestrator tests | PASS — 2/2 |
| @nextshift/runtime-adapters tests | PASS — 2/2 |
| git diff --check | PASS |
| git diff --cached --check | PASS |

---

## 1. Architecture Assessment

**Dependency direction: correct.**

```
@nextshift/runtime-core         (no runtime deps)
  ↑
@nextshift/event-bus            (+ @nextshift/contracts, @nextshift/shared)
  ↑
@nextshift/runtime-orchestrator (+ @nextshift/runtime-core, @nextshift/event-bus)

@nextshift/runtime-core
  ↑
@nextshift/runtime-adapters     (runtime-core only — no event-bus dep)
```

No circular dependencies. `runtime-adapters` correctly does not depend on `event-bus` — adapters produce events but delegate publishing to callers. Clean port/adapter separation.

**Package boundaries: appropriate for bootstrap.** Each package has a single concern: types+factory (runtime-core), pub/sub infrastructure (event-bus), workflow execution (runtime-orchestrator), domain-specific adapters (runtime-adapters).

**Monorepo consistency:** All four packages follow the same structure — `src/index.ts`, `test/`, `tsconfig.json` extending `tsconfig.base.json`, `composite: true` for project references, `vitest.config.ts`, identical `version: 0.1.0-alpha`. tsconfig.base.json is clean: `strict: true`, `es2022`, `moduleResolution: bundler`. All four packages registered in `tsconfig.base.json` path aliases. Consistent.

**Two event families coexist on the same bus.** `InMemoryEventBus` defaults to `BusinessEvent` but the orchestrator uses `InMemoryEventBus<RuntimeEvent>`. These are structurally incompatible (different field naming: `id` vs `eventId`, `type/eventType` vs `eventType`). Separate bus instances are required per family, or a union type. This is an acceptable bootstrap separation — callers must be aware.

---

## 2. Code Quality Assessment

### runtime-core — `packages/runtime-core/src/index.ts`

**`(string & {})` extension pattern on union types** — correct TypeScript idiom for open-ended unions with autocomplete. No issue.

**`readonly` everywhere** — immutable interfaces and function inputs throughout. Good.

**`isRuntimeEvent` guard** — validates id trimmed length, type trimmed length, `eventType === type`, `occurredAt instanceof Date` with NaN check, and `"payload" in candidate`. Thorough defensive guard.

**`createRuntimeEvent` factory** — defaults `id` to `crypto.randomUUID()` and `occurredAt` to `new Date()`. Clean. Uses native `crypto` available in Node 19+/ES2022 — consistent with `target: "es2022"` in tsconfig.

### event-bus — `packages/event-bus/src/`

**`InMemoryEventBus`** — `Map<string, Set<EventHandler>>` is correct data structure. O(1) subscribe/publish lookup. `unsubscribe(eventType)` with no handler deletes all handlers for that type — this is a blunt instrument if multiple independent subscribers share an event type. Documented by code shape but not obvious to callers.

**`EventPublisher` / `EventSubscriber`** — empty interfaces. Scaffolding markers with no current value. No blocking concern at bootstrap.

**`handlers/index.ts`** re-exports `EventHandler` and `EventSubscription` from `../types` — this indirection layer adds no value. The re-export bridge creates confusion about canonical import source.

**`BusinessProfileEventPublisher`** — 7 publish methods, all structurally identical. No DRY concern at bootstrap — explicit typed methods are safer for domain code than a generic factory.

### runtime-orchestrator — `packages/runtime-orchestrator/src/index.ts`

**`isApprovalGate` duck-typing guard** uses `"isApproved" in step`. Works correctly given the two interface shapes (`RuntimeStep.execute` vs `RuntimeApprovalGate.isApproved` are mutually exclusive), but a `kind` discriminant field would be more robust against accidental structural overlap in future step types.

**`completedStepIds.push(step.id)`** happens after both the approval gate (when approved) and the execution step — approved gates are correctly included in completed IDs.

**`eventBus` is optional** — good. Orchestrator works without a bus (useful in tests and simple execution contexts).

### runtime-adapters — `packages/runtime-adapters/src/`

**`createRepositoryHealthEvent` type assertion** (`as RepositoryHealthEvent`) — necessary because TypeScript cannot narrow `createRuntimeEvent`'s return type to the literal-type intersection. The implementation is correct; the cast is safe.

**`StaticBusinessRuntimeAdapter` default `needs_review`** — conservative safe default. Good for bootstrap.

**`BusinessDecisionResult.approved`** is a redundant boolean alongside `decision: "approved" | "rejected" | "needs_review"`. A third-party adapter implementation could set them inconsistently (`approved: true`, `decision: "rejected"`). The field is a convenience for callers but introduces a contract integrity gap.

---

## 3. API Review

**`RuntimeEvent` dual field: `type` and `eventType`**

`RuntimeEvent` carries both fields set to the same value. `createRuntimeEvent` sets `eventType: input.type`. `isRuntimeEvent` enforces `candidate.eventType === candidate.type`.

This redundancy exists to bridge two naming conventions: `BusinessEvent` uses `eventType` (contracts package convention), while runtime internals use `type`. The duplication works but is the most likely source of future bugs — any manually constructed event that diverges between the two fields silently fails `isRuntimeEvent`.

**`EventBus.subscribe` takes `eventType: string` not `TEvent["eventType"]`** — callers can subscribe to any string key regardless of the generic type. This is a type safety gap: subscribing to a typo'd event type will compile without error. Acceptable for bootstrap but should be tightened as the type system matures.

**`RuntimeWorkflowExecution` output is flat** — `completedStepIds` plus optional `pendingApprovalStepId`. No step-level output is carried through. Step outputs are returned inside `RuntimeStepResult` but not aggregated into the final execution output. Callers cannot inspect individual step results from the top-level `RuntimeResult`.

---

## 4. Test Coverage Assessment

| Package | Tests | Cases | Coverage Assessment |
| --- | --- | --- | --- |
| runtime-core | 1 | 1 | Minimal — creation and validation happy path only |
| event-bus | 1 | 1 | Minimal — single subscriber happy path only |
| runtime-orchestrator | 1 | 2 | Adequate for bootstrap — simple workflow + approval gate |
| runtime-adapters | 1 | 2 | Adequate for bootstrap — health event + business decision |

**Missing test cases by package:**

runtime-core:
- `isRuntimeEvent` with null, non-object, empty string id/type, mismatched `eventType !== type`, invalid Date
- `createRuntimeEvent` with auto-generated id (verify UUID format) and auto-generated occurredAt

event-bus:
- Multiple subscribers on same event type — all notified
- `unsubscribe` via returned subscription object — handler not called after
- `unsubscribe(eventType)` with no handler — all handlers cleared
- Publish with no subscribers — no error
- Multiple event types — only correct handlers fire
- Handler that throws — behavior (currently stops subsequent handlers on same event)

runtime-orchestrator:
- Step that throws an exception (currently uncaught — see advisory F-002)
- Approved gate proceeds and adds to completedStepIds
- Step producing events — verify events appear in result
- Mixed workflow: step → gate → step
- eventBus integration — verify events are published to bus

runtime-adapters:
- `degraded` and `blocked` health statuses
- `needs_review` and `rejected` business decisions
- `StaticBusinessRuntimeAdapter` with each of the three decision values
- `ValidationResult` construction

---

## 5. Performance Concerns

**`Promise.all` for handler dispatch in `InMemoryEventBus.publish`** — handlers run concurrently. Correct for independent handlers. If handler order matters, sequential dispatch would be needed. Not a concern at bootstrap volume.

**Unbounded handler sets** — no handler count limit per event type. Not a concern at bootstrap scale.

No other performance concerns at this stage.

---

## 6. Security Concerns

**`crypto.randomUUID()`** — uses native Web Crypto API. Cryptographically secure UUIDs for event IDs. No concern.

**`metadata?: Readonly<Record<string, unknown>>`** — untyped metadata bag on `RuntimeEvent` and `RuntimeExecutionContext`. Accept-anything fields are fine for extensibility but should not carry sensitive data (auth tokens, secrets) in production. Not exploitable at this layer; worth noting for future data governance.

**No input validation on `RuntimeExecutionContext`** — `executionId` and `workspaceId` are strings with no format enforcement. Downstream consumers should validate before trusting these as identifiers.

No injection, privilege escalation, or auth concerns in this bootstrap layer.

---

## 7. Required Fixes

None blocking commit.

---

## 8. Advisory Findings

**F-001 — `RuntimeEvent` carries both `type` and `eventType` holding the same value**

File: `packages/runtime-core/src/index.ts:38-47`

Both fields are set to `input.type` in `createRuntimeEvent` and enforced equal by `isRuntimeEvent`. The duplication creates a confusing API surface and a latent bug vector for manual event construction. Consider whether `type` or `eventType` should be the single canonical field and provide a compatibility shim or migration path.

Severity: Advisory. Does not block bootstrap use.

---

**F-002 — Orchestrator produces no `status: "failed"` path — step errors are unhandled**

File: `packages/runtime-orchestrator/src/index.ts:95`

`const result = await step.execute(context)` has no try-catch. If a step throws, the exception propagates out of `execute()` unhandled. `RuntimeStatus.failed` is defined but unreachable through the orchestrator. The `"runtime.workflow.failed"` event type is similarly unused.

This means callers must wrap `orchestrator.execute()` in their own try-catch to handle step failures, and they receive no structured `RuntimeResult` — just a raw exception.

Before production use, the orchestrator should catch step errors and return `{ status: "failed", errors: [...] }` with a `runtime.workflow.failed` event.

Severity: Advisory. Safe for bootstrap where steps are controlled. Should be addressed before production workflow execution.

---

**F-003 — `InMemoryEventBus.publish` does not isolate handler errors**

File: `packages/event-bus/src/memory/index.ts:10-13`

`Promise.all` rejects on the first handler error, preventing subsequent handlers from executing. In a multi-subscriber environment, one bad handler silently blocks all others. For production use, consider per-handler try-catch with error logging before resolving.

Severity: Advisory. No impact in current test setup with single subscribers.

---

**F-004 — `BusinessDecisionResult.approved` can diverge from `decision` in third-party adapters**

File: `packages/runtime-adapters/src/business/index.ts:14-20`

`approved: boolean` and `decision: BusinessDecision` are redundant. A future adapter could set `approved: true` with `decision: "rejected"`. Consider removing `approved` and computing it at the call site from `decision === "approved"`, or making it a derived getter.

Severity: Advisory.

---

## 9. Optional Improvements

- **`isApprovalGate` discriminant**: Add `readonly kind: "step" | "approval-gate"` to `RuntimeWorkflowStep` variants for more robust type narrowing than duck-typing `"isApproved" in step`.

- **`EventPublisher`/`EventSubscriber` empty interfaces**: Remove or fill. Empty marker interfaces add no type safety.

- **`handlers/index.ts` re-export bridge**: Remove. Import `EventHandler`/`EventSubscription` directly from `types` at call sites.

- **`EventBus.subscribe` type safety**: Constrain `eventType` parameter to `TEvent["eventType"]` once the event type union is mature, to catch subscribe-to-wrong-event-type bugs at compile time.

- **Step output aggregation in `RuntimeResult`**: Consider `output: { workflowId, completedStepIds, stepOutputs: Record<string, unknown> }` to give callers access to individual step results without re-running.

---

## 10. Release Recommendation

PASS. Sprint-003 Runtime Core Bootstrap is architecturally sound and ready for commit. All four packages typecheck and test clean against root type-check. Dependency direction is correct. No circular dependencies. Type safety is strict throughout. The identified advisory findings (F-001 through F-004) are not blockers for a bootstrap sprint — they are forward guidance for production hardening.

Priority order for the next sprint: F-002 (orchestrator error handling) is the highest-priority advisory since it affects runtime reliability at scale. F-001 (type/eventType duplication) is the highest-priority API design concern.
