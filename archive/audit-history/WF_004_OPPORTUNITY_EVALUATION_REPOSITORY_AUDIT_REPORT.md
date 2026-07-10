# WF-004 Opportunity Evaluation — Repository Audit Report

- **Verdict:** PASS
- **Reviewer:** Claude Code — NextShift Repository Audit Engineer
- **Contract:** WF_004_REPOSITORY_AUDIT_CONTRACT.md
- **Review Date:** 2026-07-06
- **Scope:** WF-004 implementation only — domain, application, contracts layers

---

## 1. Verdict

**PASS — no required fixes. 3 advisory findings logged below.**

All new files reviewed across `packages/domain`, `packages/application`, and `packages/contracts`. 293 domain tests (32 files) and 216 application tests (35 files) pass. All typechecks pass. No unrelated modifications. DATABASE_URL issue excluded per contract scope.

---

## 2. Changed Files

| File | Type | Status |
|---|---|---|
| `packages/domain/src/opportunity-evaluation/opportunity-evaluation.ts` | New | Reviewed |
| `packages/domain/src/opportunity-evaluation/opportunity-evaluation-repository.ts` | New | Reviewed |
| `packages/domain/src/opportunity-evaluation/in-memory-opportunity-evaluation-repository.ts` | New | Reviewed |
| `packages/domain/src/opportunity-evaluation/index.ts` | New | Reviewed |
| `packages/domain/src/index.ts` | Modified (+1 line) | Reviewed |
| `packages/application/src/opportunity-evaluation/index.ts` | New | Reviewed |
| `packages/application/src/index.ts` | Modified (+1 line) | Reviewed |
| `packages/contracts/src/opportunity-evaluation/index.ts` | New | Reviewed |
| `packages/contracts/src/index.ts` | Modified (+1 line) | Reviewed |
| `packages/domain/test/opportunity-evaluation.test.ts` | New | Reviewed |
| `packages/application/test/opportunity-evaluation-application-service.test.ts` | New | Reviewed |

---

## 3. Repository Architecture Consistency

### Package placement

All changes land in the correct package layers:

- `packages/domain` — aggregate, value logic, repository interface, in-memory implementation
- `packages/application` — application service, commands, queries, event publisher interface
- `packages/contracts` — cross-boundary event payload types

No domain logic in the application layer. No application concerns in the domain. No domain imports in contracts.

### Dependency direction

```
@nextshift/shared ← @nextshift/contracts ← @nextshift/domain ← @nextshift/application
```

`contracts/src/opportunity-evaluation/index.ts` imports only from `@nextshift/shared`. No domain import present. `application/src/opportunity-evaluation/index.ts` imports from `@nextshift/domain` and `@nextshift/shared`. No circular dependency introduced.

### Barrel exports

Each package adds exactly one line to its root `src/index.ts`:

- `packages/domain/src/index.ts` → `export * from "./opportunity-evaluation"`
- `packages/application/src/index.ts` → `export * from "./opportunity-evaluation"`
- `packages/contracts/src/index.ts` → `export * from "./opportunity-evaluation"`

All additions are appended last. No existing exports displaced.

---

## 4. DDD Compliance

### Aggregate root

`OpportunityEvaluation` is a properly formed aggregate root:

- **Private constructor.** `new OpportunityEvaluation(snapshot)` is inaccessible outside the class. All construction goes through `OpportunityEvaluation.create()` or `OpportunityEvaluation.rehydrate()`.
- **Encapsulated snapshot.** The internal `snapshot: OpportunityEvaluationSnapshot` is private. `toSnapshot()` returns a clone via `cloneSnapshot()`. No reference to the internal snapshot escapes.
- **Invariants enforced on every transition.** `replace()` calls `validateSnapshot()` before updating `this.snapshot`. Invalid states are rejected at write time.

### Scoring and priority as domain behavior

`createOpportunityScore` and `deriveOpportunityEvaluationPriority` are exported domain functions. The scoring formula:

```
total = Math.round((marketFit + businessValue + urgency + confidence + (100 − effort)) / 5)
```

`effort` is inverted — higher effort reduces total score. Priority thresholds are:

| Total | Priority |
|---|---|
| 0–39 | `low` |
| 40–69 | `medium` |
| 70–89 | `high` |
| 90–100 | `critical` |

The formula and thresholds are tested at boundary-adjacent values: 20 (low), 55 (medium), 82 (high), 95 (critical). Two composite score cases are verified against expected `total` values (78 and 90), confirming the arithmetic is correct.

### State machine

```
draft → evaluated              (via evaluate)
evaluated → accepted           (via accept)
evaluated → rejected           (via reject)
any non-archived → archived    (via archive — idempotent no-op if already archived)
```

`evaluate()` additionally accepts `accepted` and `rejected` states — re-evaluation is permitted. The spread in `evaluate()` explicitly clears `acceptedAt`, `rejectedAt`, and `decisionReason`, so the aggregate transitions cleanly back to `evaluated`. This is an intentional design choice. See A-001.

### Invariant guards

- `assertMutable()` blocks all mutations on `archived` evaluations.
- `assertEvaluated()` calls `assertMutable()` then checks `status === "evaluated"` — blocks `accept`/`reject` on draft, accepted, or rejected states.
- `createScoreComponent(value, field)` validates each score input is numeric, finite, and in [0, 100].
- `validateSnapshot()` enforces status-specific constraints:
  - `evaluated` → score required
  - `accepted` → acceptedAt required
  - `rejected` → rejectedAt required
  - `archived` → archivedAt required
- `createOpportunityEvaluationSource()` validates the source type against the allowed enum: `"lead" | "customer" | "content" | "campaign" | "manual" | "system"`. Unknown source types throw at construction time.

---

## 5. Application Service Quality

### Command coverage

The `OpportunityEvaluationApplicationService` exposes:

| Method | Command |
|---|---|
| `createOpportunityEvaluation` | `CreateOpportunityEvaluation` |
| `evaluateOpportunity` | `EvaluateOpportunity` |
| `acceptOpportunity` | `AcceptOpportunity` |
| `rejectOpportunity` | `RejectOpportunity` |
| `archiveOpportunityEvaluation` | `ArchiveOpportunityEvaluation` |
| `getOpportunityEvaluation` | `GetOpportunityEvaluation` |
| `listOpportunityEvaluations` | `ListOpportunityEvaluations` |
| `listOpportunityEvaluationsByStatus` | `ListOpportunityEvaluationsByStatus` |
| `listOpportunityEvaluationsByPriority` | `ListOpportunityEvaluationsByPriority` |

All commands return `Result<OpportunityEvaluationApplicationResult, OpportunityEvaluationApplicationError>`. All queries return plain result types (no `Result` wrapping — consistent with existing NextShift query pattern).

### `recordDecision` private method

`acceptOpportunity` and `rejectOpportunity` delegate to the private `recordDecision(command, decision)` method. The two type casts (`as AcceptOpportunityCommand`, `as RejectOpportunityCommand`) in the event builder invocations are safe — the `decision` parameter has already narrowed the union before the cast is applied.

### Business isolation

`loadEvaluation` checks `evaluation.businessId !== command.context.businessId` before returning the aggregate. Foreign evaluations return `ValidationFailed`. This guard is present on all mutating command paths.

### No cross-aggregate operations

Unlike WF-003 `schedulePlannedContent`, this service loads and mutates only `OpportunityEvaluation`. No other aggregates are involved. Simpler correctness model; no partial-update risk between repositories.

### Error mapping

`mapOpportunityEvaluationApplicationError` maps all `Error` instances to `ValidationFailed`. The error code union includes `OpportunityEvaluationPersistenceFailed` and `OpportunityEvaluationEventPublicationFailed`, which are currently unreachable — consistent with the pattern established across all WF-002/WF-003 application services.

---

## 6. Contracts Quality

`contracts/src/opportunity-evaluation/index.ts` is domain-agnostic. All `evaluationId` fields are typed as `string` (not branded `OpportunityEvaluationId`). All payloads are fully `readonly`. No import from `@nextshift/domain` or `@nextshift/application`.

The file exports 5 event payload interfaces covering all 5 domain event types (`Created`, `Evaluated`, `Accepted`, `Rejected`, `Archived`), the source payload shape, the score payload shape, the priority union, and the event type union.

`OpportunityEvaluationSourcePayload.type` in contracts is an inline union literal — not a named type alias. This is intentional: contracts do not depend on the domain's named type `OpportunityEvaluationSourceType`, preserving independence.

---

## 7. Public API Exports

### Domain (`@nextshift/domain`)

Types: `OpportunityEvaluationId`, `OpportunityEvaluationTitle`, `OpportunityEvaluationSummary`, `OpportunityEvaluationStatus`, `OpportunityEvaluationPriority`, `OpportunityEvaluationSourceType`, `OpportunitySourceSnapshot`, `OpportunityScoreSnapshot`, `OpportunityEvaluationSnapshot`, `CreateOpportunityEvaluationInput`, `EvaluateOpportunityInput`, `DecideOpportunityInput`, `OpportunityEvaluationEventMetadata`, `OpportunityEvaluationEventType`, all 5 domain event interfaces, `OpportunityEvaluationDomainEvent` union.

Classes/functions: `OpportunityEvaluation`, `InMemoryOpportunityEvaluationRepository`, `createOpportunityEvaluationTitle`, `createOpportunityEvaluationSummary`, `createOpportunityEvaluationSource`, `createOpportunityScore`, `deriveOpportunityEvaluationPriority`.

Interface: `OpportunityEvaluationRepository`.

All exports complete. No stranded type.

### Application (`@nextshift/application`)

All 5 commands, 4 queries, 3 result types, `OpportunityEvaluationEventPublisher`, `OpportunityEvaluationApplicationService`, and `OpportunityEvaluationApplicationError` exported.

### Contracts (`@nextshift/contracts`)

5 event payload interfaces, 2 supporting payload interfaces (`Source`, `Score`), `OpportunityEvaluationPriority`, and `OpportunityEvaluationEventType` union exported.

---

## 8. Test Quality

### New tests

**`packages/domain/test/opportunity-evaluation.test.ts`** — 5 tests:

| Test | Covers |
|---|---|
| Creates a draft opportunity evaluation | `create()` snapshot shape, initial status |
| Calculates opportunity score and priority | `deriveOpportunityEvaluationPriority` at 4 boundary-adjacent values; `createOpportunityScore` formula |
| Evaluates and accepts an opportunity | `evaluate()` → score persisted; `accept()` → status transition, decisionReason |
| Rejects invalid lifecycle transitions | `accept()` before `evaluate()` throws; `evaluate()` after `archive()` throws |
| Saves, retrieves, and filters | `findById`, `findByBusinessId`, `findByStatus`, `findByPriority`, `exists` |

**`packages/application/test/opportunity-evaluation-application-service.test.ts`** — 3 tests:

| Test | Covers |
|---|---|
| Creates and evaluates with integration events | Full create→evaluate flow; event types, payloads, aggregateType verified; `listByPriority` returns correct result |
| Accepts, rejects, and archives | accept→archive lifecycle; event sequence verified in order |
| Rejects missing and foreign evaluations | `OpportunityEvaluationNotFound` on missing; `ValidationFailed` on foreign business |

### Test counts

| Package | Files | Tests | Status |
|---|---|---|---|
| domain | 32 | 293 | PASS (+5) |
| application | 35 | 216 | PASS (+3) |
| **Total** | **67** | **509** | **PASS** |

---

## 9. Type Safety

- `OpportunityEvaluationId`, `OpportunityEvaluationTitle`, `OpportunityEvaluationSummary` — branded nominal types.
- All snapshot interfaces fully `readonly`.
- `createScoreComponent` validates numeric, finite, and 0–100 range — runtime enforcement of score bounds.
- `Object.freeze()` applied to `source` and `score` objects in factory functions — runtime immutability.
- `validateSnapshot()` called inside `replace()` on every state transition.
- `cloneSnapshot()` creates deep copies of `source` and `score` objects — internal state does not escape by reference.
- `Result<T, E>` on all command returns — callers required to discriminate `ok` branch.
- No `any` types in any changed file.

---

## 10. No Unrelated Modifications

Confirmed. All changed files are scoped to `opportunity-evaluation`:

- 4 new domain source files + 1 domain barrel update
- 1 new application source file + 1 application barrel update
- 1 new contracts source file + 1 contracts barrel update
- 2 new test files

No changes to any other domain aggregate, application service, UI, contracts module, or infrastructure.

---

## 11. Validation Checks

| Check | Result |
|---|---|
| `pnpm --filter @nextshift/domain typecheck` | PASS |
| `pnpm --filter @nextshift/contracts typecheck` | PASS |
| `pnpm --filter @nextshift/application typecheck` | PASS |
| `pnpm --filter @nextshift/domain test` (293 tests) | PASS |
| `pnpm --filter @nextshift/application test` (216 tests) | PASS |
| `pnpm type-check` (monorepo) | PASS |
| `git diff --check` | PASS (exit 0) |
| `git diff --cached --check` | PASS (exit 0) |

---

## 12. Advisory Findings

None of the following block release.

### A-001 — Re-evaluation of accepted/rejected evaluations is allowed but untested

**Location:** `packages/domain/src/opportunity-evaluation/opportunity-evaluation.ts:211`

`evaluate()` calls `assertMutable()`, which only blocks mutations on `archived` evaluations. An evaluation in `accepted` or `rejected` status can be re-evaluated. The `evaluate()` spread explicitly clears `acceptedAt`, `rejectedAt`, and `decisionReason`:

```ts
this.replace({
  ...this.snapshot,
  status: "evaluated",
  acceptedAt: undefined,
  rejectedAt: undefined,
  decisionReason: undefined,
});
```

This is a deliberate design decision — re-evaluation cleanly resets the prior decision. However, this path is not tested and not documented. A future implementer may not expect it to be permitted.

**Recommendation:** Add a domain test for "re-evaluating an accepted opportunity resets the decision" and consider whether `assertMutable()` should instead be `assertNotArchived()` to make the intent explicit.

---

### A-002 — Parallel `OpportunityEvaluationPriority` type in contracts and domain

**Location:** `packages/contracts/src/opportunity-evaluation/index.ts:10` and `packages/domain/src/opportunity-evaluation/opportunity-evaluation.ts:27`

`OpportunityEvaluationPriority = "low" | "medium" | "high" | "critical"` is defined identically in both packages. The parallel is by design — contracts must not import from domain. The same pattern was noted for WF-003 (`ContentPlanWorkflowDecision` vs `ContentApprovalDecision`).

**Recommendation:** If the priority value set ever changes in the domain, the contracts type must be updated in the same sprint. A co-location note in both files would prevent future drift.

---

### A-003 — Idempotent `archive()` no-op not tested

**Location:** `packages/domain/src/opportunity-evaluation/opportunity-evaluation.ts:265`

`archive()` returns silently when the evaluation is already archived. This is intentional. The path is not covered by tests (same pattern as WF-003 A-003).

**Recommendation:** Add a domain test for "archiving an already-archived evaluation is a no-op" to prevent future accidental breakage.

---

## 13. Release Recommendation

**PASS — recommend for release.**

The WF-004 `OpportunityEvaluation` domain is a clean, well-typed DDD aggregate. The scoring formula is domain-encapsulated and independently testable. Invariant enforcement covers all status-specific constraints. The application service follows the established NextShift command pattern with business isolation and typed `Result` returns. Contracts are domain-agnostic. All 509 tests pass.
