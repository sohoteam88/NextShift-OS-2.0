# WF-003 Content Planning & Approval — Repository Audit Report

- **Verdict:** PASS
- **Reviewer:** Claude Code — NextShift Repository Audit Engineer
- **Contract:** WF_003_REPOSITORY_AUDIT_CONTRACT.md
- **Review Date:** 2026-07-06
- **Scope:** WF-003 implementation only — domain, application, contracts layers

---

## 1. Verdict

**PASS — no required fixes. 4 advisory findings logged below.**

7 changed files reviewed across `packages/domain`, `packages/application`, and `packages/contracts`. 288 domain tests and 213 application tests pass. All typechecks and build pass. No unrelated modifications found. DATABASE_URL issue excluded per contract scope.

---

## 2. Changed Files

| File | Type | Status |
|---|---|---|
| `packages/domain/src/content/plan.ts` | Modified (+232 lines) | Reviewed |
| `packages/domain/src/content/content-plan-repository.ts` | Modified (+4 lines) | Reviewed |
| `packages/domain/src/content/in-memory-content-plan-repository.ts` | Modified (+27 lines) | Reviewed |
| `packages/domain/test/content-plan.test.ts` | Modified (+115 lines) | Reviewed |
| `packages/application/src/content-plan/index.ts` | Modified (+262 lines) | Reviewed |
| `packages/application/test/content-plan-application-service.test.ts` | Modified (+135 lines) | Reviewed |
| `packages/contracts/src/index.ts` | Modified (+1 line) | Reviewed |
| `packages/contracts/src/content-plan/index.ts` | New file | Reviewed |

---

## 3. Repository Architecture Consistency

### Package placement

All changes are in the correct packages:

- `packages/domain` — aggregate root, value objects, repository interface, in-memory implementation
- `packages/application` — application service, commands, queries, event publisher interface
- `packages/contracts` — workflow event payloads for cross-boundary communication

No domain logic leaked into the application layer. No application layer concerns in the domain.

### Dependency direction

The dependency chain is:

```
@nextshift/shared ← @nextshift/contracts ← @nextshift/domain ← @nextshift/application
```

`packages/contracts/src/content-plan/index.ts` imports only from `@nextshift/shared`. No import from `@nextshift/domain`. This is correct — contracts are domain-agnostic cross-boundary types.

`packages/application/src/content-plan/index.ts` imports from `@nextshift/domain` and `@nextshift/shared`. No circular reference.

### Barrel exports

`packages/domain/src/content/index.ts` exports `plan.ts`, `content-plan-repository.ts`, and `in-memory-content-plan-repository.ts` at lines 377–379. The domain root `src/index.ts` re-exports `./content`. Full chain is intact.

`packages/application/src/index.ts` exports `./content-plan` at line 19. Intact.

`packages/contracts/src/index.ts` adds `export * from "./content-plan"` as the final export. One line, no displacement of existing exports.

---

## 4. DDD Compliance

### Aggregate root

`ContentPlan` is a well-formed aggregate root:

- **Private constructor.** `new ContentPlan(snapshot)` is inaccessible outside the class. State is created exclusively through `ContentPlan.create()`, `ContentPlan.createApprovalPlan()`, or `ContentPlan.rehydrate()`.
- **Encapsulated state.** The internal `snapshot: ContentPlanSnapshot` is private. All reads go through getters or `toSnapshot()`, which returns a clone. No reference to the internal snapshot escapes.
- **Immutable entries.** All collections stored with `Object.freeze()`. `PlannedContentSnapshot` and `ContentApprovalSnapshot` entries are cloned on every read.
- **Invariant enforcement.** `replace()` calls `validateSnapshot()` on every state transition. Invalid state is rejected at write time, not deferred to read time.

### Value objects

`PlannedContentSnapshot` and `ContentApprovalSnapshot` are value objects embedded in the aggregate. They are not entities — no identity key, copied not referenced, frozen in place. This is correct.

### Two factory paths

The aggregate exposes two distinct creation paths:

| Factory | Status | Has calendar | Has approval fields |
|---|---|---|---|
| `ContentPlan.create()` | `"active"` | Required | No |
| `ContentPlan.createApprovalPlan()` | `"draft"` | None | Required |

This is intentional. Calendar-linked plans are immediately active and used for planning/scheduling. Approval plans are standalone content proposals that go through a review lifecycle before being linked to a calendar.

### Lifecycle transitions enforced

```
draft → pending_review (via submitForReview)
needs_revision → pending_review (via submitForReview — resubmit path)
pending_review → approved | rejected | needs_revision (via approval methods)
any non-archived → archived (via archive)
archived → active (via restore)
```

Illegal transitions throw at the domain level. Guards are present for:
- `submitForReview`: rejects if status is not `draft` or `needs_revision`
- `approve / reject / requestRevision`: rejects if status is not `pending_review`
- `addPlannedContent / markContentScheduled / removePlannedContent`: rejects if status is `archived`

---

## 5. Aggregate Boundaries

`ContentPlan` is the only aggregate root in the changed files. `PlannedContentSnapshot` and `ContentApprovalSnapshot` are properly embedded as value objects within its boundary.

The application service correctly crosses aggregate boundaries by loading `ContentCalendar` and `ContentAsset` through their own repositories rather than navigating through `ContentPlan`. The `schedulePlannedContent` operation coordinates two aggregates (`ContentPlan` and `ContentCalendar`) in a single application service method — correct for an eventual-consistency model.

No aggregate directly holds a reference to another aggregate root. All cross-aggregate access goes through repository lookups.

---

## 6. Public API Exports

### Domain exports (via `@nextshift/domain`)

Types: `ContentPlanId`, `ContentPlanName`, `ContentPlanStatus`, `ContentPlanPriority`, `ContentApprovalDecision`, `PlannedContentStatus`, `ContentApprovalSnapshot`, `PlannedContentSnapshot`, `ContentPlanSnapshot`, `CreateContentPlanInput`, `CreateApprovalContentPlanInput`, `AddPlannedContentInput`, `ContentApprovalInput`, `ContentPlanEventMetadata`, `ContentPlanEventType`, all 10 domain event interfaces, `ContentPlanDomainEvent` union.

Classes/functions: `ContentPlan`, `InMemoryContentPlanRepository`, `createContentPlanName`.

Interface: `ContentPlanRepository`.

All exports are complete. No public type is stranded.

### Application exports (via `@nextshift/application`)

All commands, queries, result types, `ContentPlanEventPublisher`, and `ContentPlanApplicationService` are exported. The `ContentPlanApplicationError` error type and its code union are exported for callers to discriminate failures.

### Contracts exports (via `@nextshift/contracts`)

5 workflow event payload types: `ContentPlanCreatedPayload`, `ContentSubmittedForReviewPayload`, `ContentApprovalDecisionPayload`, `ContentPlanWorkflowEventType`, `ContentPlanWorkflowDecision`. These are the cross-boundary representations, correctly separate from the domain event types.

---

## 7. Test Quality

### New tests added

**`packages/domain/test/content-plan.test.ts`** — 10 tests:

| Test | Covers |
|---|---|
| Creates active plan linked to calendar | `ContentPlan.create()` snapshot shape |
| Adds planned content with normalized platforms | `addPlannedContent()`, platform deduplication |
| Prevents duplicate active planned content | `assertNoActiveEntry()` guard |
| Marks planned content as scheduled and removed | `markContentScheduled()`, `removePlannedContent()` |
| Prevents modifying archived content plans | `assertActive()` on archived |
| Creates content approval plans as drafts | `createApprovalPlan()` snapshot shape |
| Enforces content approval lifecycle transitions | Full approve/reject/revision/re-submit cycle, illegal transitions throw |
| Repository saves and retrieves plans by ID | `save()`, `findById()` |
| Repository lists plans and entries | `findByBusinessId()`, `findByCalendarId()`, `listEntries()`, `exists()` |
| Repository lists pending and approved plans | `findPendingApprovals()`, `findApproved()` |

**`packages/application/test/content-plan-application-service.test.ts`** — 7 tests:

| Test | Covers |
|---|---|
| Creates content plan linked to existing calendar | Full create flow, event published |
| Adds content to plan and publishes event | `addContentToPlan()`, `PlannedContentAdded` event |
| Creates, submits, and approves approval plans | Full approval lifecycle, events in order |
| Rejects and requests revisions | `needs_revision` → re-submit → `rejected` cycle, events in order |
| Schedules planned content onto calendar | Cross-aggregate: plan entry updated, calendar updated |
| Rejects missing or foreign dependencies | `ContentCalendarNotFound`, `ContentAssetNotFound`, business mismatch |
| Removes, archives, and restores plans | Full lifecycle, event sequence verified |

### Test quality assessment

All tests assert event types, aggregate state, and repository counts. Event sequences are verified in order (`publisher.events.map(e => e.eventType)`). Business isolation is tested (foreign dependencies return `ValidationFailed`). The dependency injection pattern (injected `now`, `createEventId`, `createPlanId`) ensures deterministic tests with no randomness.

### Total test counts

| Package | Files | Tests | Status |
|---|---|---|---|
| domain | 31 | 288 | PASS (+10 from content-plan) |
| application | 34 | 213 | PASS (+7 from content-plan) |
| **Total** | **65** | **501** | **PASS** |

---

## 8. Type Safety

- `ContentPlanId` and `ContentPlanName` are nominal types (`Brand<string, "...">`) — string identity cannot substitute.
- All snapshot interfaces are `readonly` throughout; no mutable field anywhere in the public API.
- `Object.freeze()` applied to all arrays at every state transition — runtime and compile-time immutability enforced together.
- `validateSnapshot()` is called inside `replace()`, which is the only method that updates `this.snapshot`. This means every state transition is validated.
- `cloneSnapshot()`, `cloneEntries()`, `cloneEntry()`, `cloneApprovals()` form a consistent defensive copy layer — internal state does not escape via reference.
- `Result<T, E>` return type on all application service commands — callers are required to handle both `ok` and error branches.
- `createBaseEvent` uses `TEventType extends ContentPlanDomainEvent["eventType"]` generic — event type literal is constrained to the known union at compile time.

---

## 9. No Unrelated Modifications

Confirmed. All 8 changed items are scoped to the `ContentPlan` domain:

- 3 domain source files (aggregate, repository interface, in-memory implementation)
- 1 domain test file
- 1 application source file (application service + commands/queries)
- 1 application test file
- 1 new contracts directory (`packages/contracts/src/content-plan/`)
- 1 contracts barrel update (`packages/contracts/src/index.ts` — one line added)

No changes to unrelated domain aggregates, application services, UI, routing, or infrastructure.

---

## 10. Validation Checks

| Check | Result |
|---|---|
| `pnpm --filter @nextshift/domain typecheck` | PASS |
| `pnpm --filter @nextshift/contracts typecheck` | PASS |
| `pnpm --filter @nextshift/application typecheck` | PASS |
| `pnpm --filter @nextshift/domain test` (288 tests) | PASS |
| `pnpm --filter @nextshift/application test` (213 tests) | PASS |
| `pnpm type-check` (monorepo) | PASS |
| `pnpm build` | PASS (DATABASE_URL excluded per contract) |
| `git diff --check` | PASS (exit 0) |
| `git diff --cached --check` | PASS (exit 0) |

---

## 11. Advisory Findings

None of the following block release.

### A-001 — `assertActive()` name does not reflect its behaviour

**Location:** `packages/domain/src/content/plan.ts:418`

`assertActive()` is called by `addPlannedContent`, `markContentScheduled`, and `removePlannedContent`. It only throws when status is `"archived"`. It does not block mutations in `"pending_review"`, `"approved"`, `"rejected"`, or `"needs_revision"` states.

The name implies "assert status is active" but the implementation means "assert status is not archived." As a result, content entries can be added or removed from a plan that is under review or has already been approved.

If the intent is that content can only be modified while the plan is in `"active"` or `"draft"` status (and modifications during review are not allowed), the guard should be tightened. If content mutation during review is intentional, the method should be renamed to `assertNotArchived()` to prevent future confusion.

---

### A-002 — Parallel type: `ContentPlanWorkflowDecision` vs `ContentApprovalDecision`

**Location:** `packages/contracts/src/content-plan/index.ts` and `packages/domain/src/content/plan.ts`

`ContentPlanWorkflowDecision = "approved" | "rejected" | "needs_revision"` in contracts is structurally identical to `ContentApprovalDecision` in the domain. Because contracts must not import from domain, this duplication is by design in the contracts-first architecture.

There is a risk of the two drifting if a new decision value is added to one and not the other. Future sprints that extend the approval decision set should update both types and add a note to both files.

---

### A-003 — Idempotent `archive` and `restore` no-ops are not tested

**Location:** `packages/domain/src/content/plan.ts:368,383`

`archive()` on an already-archived plan returns silently. `restore()` on a non-archived plan returns silently. Both are intentional silent no-ops — correct for safe repeated calls. Neither path is covered by the test suite.

A future sprint could add two tests: "archiving an already-archived plan is a no-op" and "restoring a non-archived plan is a no-op." This prevents accidental future breakage if the logic is changed.

---

### A-004 — `schedulePlannedContent` has no rollback if event publication fails

**Location:** `packages/application/src/content-plan/index.ts:273`

`schedulePlannedContent` saves both `calendar` and `plan` repositories before publishing the `PlannedContentScheduled` event. If event publication fails after both saves succeed, repositories are updated but the event is lost. The `ContentPlanEventPublicationFailed` error code exists in the error union, suggesting this case was considered, but `mapContentPlanApplicationError` maps it to `ValidationFailed`.

This is a known limitation of the synchronous save-then-publish pattern and affects all commands, not only this one. In the in-memory development setting this has no observable impact. It is flagged here for awareness when moving to a production persistence layer.

---

## 12. Release Recommendation

**PASS — recommend for release.**

The WF-003 ContentPlan domain is well-structured DDD implementation. The aggregate correctly encapsulates state, enforces invariants on every transition, and prevents external mutation. The application service correctly coordinates cross-aggregate operations, propagates domain events, and returns typed `Result` values. All 501 tests across domain and application pass. Type safety is thorough throughout the stack.
