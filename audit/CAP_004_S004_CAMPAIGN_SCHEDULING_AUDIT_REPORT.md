# CAP-004 S-004 Audit Report — Campaign Scheduling

**Audit Type:** Implementation Slice Audit  
**Auditor:** Claude Code (Independent Architecture Auditor)  
**Date:** 2026-06-28  
**Capability:** CAP-004 Campaign  
**Slice:** S-004 Campaign Scheduling  
**Prerequisites:** CAP-001 (Frozen) · CAP-002 (Released) · CAP-003 (Released) · CAP-004 S-001–S-003 (PASS)  
**Engineering Baseline:** Blueprint v1.0 · Core Runtime v1.0 · Engineering Playbook v1.1

---

## Overall Result

**PASS**

S-004 introduces `CampaignSchedule` as a second aggregate within CAP-004, establishing campaign scheduling as an independent domain concept rather than a property of the `Campaign` aggregate. The design uses `schedule()` as the factory name (domain-appropriate vs the standard `create()`), records domain events internally via a `pendingEvents` buffer drained by `pullDomainEvents()`, and enforces future-only scheduling with a strict `scheduledFor > createdAt` guard. The application service adds explicit business ownership checks absent in S-002 and enforces at-most-one active schedule per campaign at the application layer. 142 domain tests and 109 application tests pass with 0 typecheck errors. No findings.

---

## Findings

### Critical

None.

### Major

None.

### Minor

None.

---

## Domain Audit

### `CampaignSchedule` Aggregate

| Check | Result |
|---|---|
| Private mutable constructor | ✅ PASS |
| `CampaignSchedule.schedule(input)` — validated factory; records `CampaignLaunchScheduled` event | ✅ PASS |
| `CampaignSchedule.rehydrate(snapshot)` — `validateSnapshot()` + `cloneSnapshot()` | ✅ PASS |
| `CampaignSchedule.toSnapshot()` — flat clone | ✅ PASS |
| Exposed getters: `scheduleId`, `campaignId`, `businessId`, `status`, `scheduledFor` | ✅ PASS |
| `reschedule(input)` — `assertScheduled()` + `assertCampaignCanBeScheduled()` + future-time guard; records `CampaignLaunchRescheduled` with `previousScheduledFor` | ✅ PASS |
| `cancel(cancelledAt)` — `assertScheduled()`; transitions to `"cancelled"`; records `CampaignLaunchScheduleCancelled` | ✅ PASS |
| `isPending(asOf)` — `status === "scheduled" && scheduledFor > asOf` | ✅ PASS |
| `pullDomainEvents()` — returns frozen snapshot of buffer, clears buffer | ✅ PASS |
| `validateSnapshot()` called on every `replace()` | ✅ PASS |

**Factory name `schedule()` vs `create()`:**  
The factory is named `schedule()` rather than the conventional `create()`. This is intentional domain language — the act of creating this aggregate *is* the act of scheduling. The snapshot is still stored and rehydrated in the standard way. ✅

**Status model:**
```
scheduled ──reschedule()──► scheduled  (overwrite scheduledFor, record event)
scheduled ──cancel()──────► cancelled
```
`assertScheduled()` blocks both `reschedule()` and `cancel()` on a cancelled schedule. There is no `restore()` — a cancelled schedule is terminal. ✅

**`validateSnapshot()` — status-conditional requirements:**
- `"cancelled"` → `cancelledAt` required

`"scheduled"` status has no additional required timestamps beyond `createdAt`, `updatedAt`, and `scheduledFor`. Note: `validateSnapshot()` does **not** re-enforce the future-time constraint — a rehydrated schedule can have a `scheduledFor` in the past (reflecting a schedule that wasn't executed before its window passed). Only creation and reschedule enforce the future constraint. This is correct — the schedule record remains valid as a historical fact even after its time has passed. ✅

**`record()` — internal event buffer:**
```ts
private readonly pendingEvents: CampaignScheduleDomainEvent[] = [];

private record(event: CampaignScheduleEventDraft): void {
  this.pendingEvents.push({
    ...event,
    eventId: crypto.randomUUID() as EventId,
    aggregateId: this.snapshot.scheduleId,
    aggregateType: "CampaignSchedule",
    version: 1,
  } as CampaignScheduleDomainEvent);
}
```

`CampaignScheduleEventDraft` is a private discriminated union containing the event type, `occurredAt`, and payload — without `eventId`, `aggregateId`, `aggregateType`, or `version`, which `record()` fills in. `eventId` is generated via `crypto.randomUUID()` inside `record()` rather than being injected — makes IDs non-deterministic but keeps the aggregate self-contained. ✅

**`pullDomainEvents()` — collect-and-clear pattern:**
```ts
pullDomainEvents(): readonly CampaignScheduleDomainEvent[] {
  const events = Object.freeze([...this.pendingEvents]);
  this.pendingEvents.length = 0;
  return events;
}
```
Returns a frozen snapshot of the buffer and clears it via `length = 0`. The current application service does not call this — events are buffered and ready for use by integration infrastructure when wired up. ✅

**`assertCampaignCanBeScheduled()` — exported function:**
```ts
export function assertCampaignCanBeScheduled(status: CampaignStatus): void {
  if (status === "archived") throw new Error("Archived campaigns cannot be scheduled.");
  if (status === "completed") throw new Error("Completed campaigns cannot be scheduled.");
}
```

Exported for direct use in tests and by application-layer validation. Permits scheduling for `"draft"`, `"active"`, and `"paused"` campaigns — all can have future launches scheduled. ✅

**`createFutureTimestamp()` — strict future enforcement:**
`Date.parse(timestamp) <= Date.parse(asOf)` — rejects both past and equal timestamps. A schedule for exactly the creation moment is invalid. ✅

**`CampaignLaunchRescheduledEvent.payload` carries `previousScheduledFor`:**  
Downstream consumers can observe what the time was changed from, enabling audit trails and notification logic. ✅

### Value Objects

| Type | Kind | Validation |
|---|---|---|
| `CampaignScheduleId` | `Brand<string, "CampaignScheduleId">` | Identity only |
| `CampaignScheduleStatus` | `"scheduled" \| "cancelled"` | 2-state literal |
| `Timestamp` | Reused from `@nextshift/shared` | `Number.isFinite(Date.parse(value))` |

### Domain Events

| Event | Payload | Result |
|---|---|---|
| `CampaignLaunchScheduled` | `{ scheduleId, campaignId, businessId, scheduledFor }` | ✅ PASS |
| `CampaignLaunchRescheduled` | `{ scheduleId, campaignId, previousScheduledFor, scheduledFor }` | ✅ PASS |
| `CampaignLaunchScheduleCancelled` | `{ scheduleId, campaignId, cancelledAt }` | ✅ PASS |

All extend `CampaignScheduleEventMetadata`: `{ eventId, eventType, aggregateId: CampaignScheduleId, aggregateType: "CampaignSchedule", occurredAt, version: 1, correlationId?, causationId? }`. ✅

### `CampaignScheduleRepository` Interface

```ts
interface CampaignScheduleRepository {
  save(schedule: CampaignSchedule): Promise<void>;
  findById(scheduleId: CampaignScheduleId): Promise<CampaignSchedule | null>;
  findByCampaignId(campaignId: CampaignId): Promise<readonly CampaignSchedule[]>;
  findActiveByCampaignId(campaignId: CampaignId): Promise<CampaignSchedule | null>;
  findPendingByBusinessId(businessId: BusinessId, asOf: Timestamp): Promise<readonly CampaignSchedule[]>;
  exists(scheduleId: CampaignScheduleId): Promise<boolean>;
}
```

`findActiveByCampaignId` — singular; returns the schedule with `status === "scheduled"` for a campaign, or null. The at-most-one invariant is enforced at the application layer before creation; the repo provides the lookup to support that check. ✅

`findPendingByBusinessId(businessId, asOf)` — takes an explicit `asOf` timestamp rather than inferring "now" internally, keeping the repository pure and deterministic in tests. ✅

### `InMemoryCampaignScheduleRepository`

| Check | Implementation | Result |
|---|---|---|
| `save()` | `cloneSnapshot()` before storing | ✅ PASS |
| `findById()` | `CampaignSchedule.rehydrate(snapshot)` or null | ✅ PASS |
| `findByCampaignId()` | Filter by `campaignId`; sort by `scheduledFor` ascending | ✅ PASS |
| `findActiveByCampaignId()` | `find()` on `status === "scheduled"` | ✅ PASS |
| `findPendingByBusinessId()` | Filter by `businessId` → rehydrate → `isPending(asOf)` → sort by `scheduledFor` | ✅ PASS |
| `exists()` | `Map.has()` | ✅ PASS |

**`compareSchedules()` sorts by `scheduledFor`** — not by `createdAt` as in all prior repositories. Scheduling queries are ordered by execution time, not creation time. ✅

**`findPendingByBusinessId()` two-stage filter:**  
Snapshot-level filter on `businessId`, then rehydrate, then domain-method filter via `isPending(asOf)`. The `asOf` timestamp check requires a live aggregate (delegates to `isPending()`), so the second filter must happen post-rehydration. ✅

**Domain Audit Verdict: PASS**

---

## Application Audit

### `CampaignSchedulingApplicationService`

**Constructor dependencies (4):**
```ts
constructor(
  private readonly campaignRepository: CampaignRepository,
  private readonly scheduleRepository: CampaignScheduleRepository,
  private readonly now: Now = defaultNow,
  private readonly createScheduleId: CreateCampaignScheduleId = defaultCreateCampaignScheduleId
)
```

2 repositories + 2 injectable factories = 4 deps. No event publisher — events are buffered in the aggregate but publication is deferred. ✅

| Operation | Flow | Result |
|---|---|---|
| `scheduleCampaignLaunch()` | Load campaign → `assertBusinessAccess()` → `findActiveByCampaignId()` (duplicate guard) → `CampaignScheduleAggregate.schedule()` → save | ✅ PASS |
| `rescheduleCampaignLaunch()` | Load campaign → `assertBusinessAccess()` → `findActiveByCampaignId()` (must exist) → `schedule.reschedule()` → save | ✅ PASS |
| `cancelCampaignLaunchSchedule()` | `findActiveByCampaignId()` → `assertScheduleBusinessAccess()` → `schedule.cancel()` → save | ✅ PASS |
| `getCampaignSchedule()` | `findActiveByCampaignId()` → business check → `{ schedule: null }` if absent or foreign | ✅ PASS |
| `listPendingCampaignSchedules()` | `findPendingByBusinessId(context.businessId, this.now())` | ✅ PASS |

**`assertBusinessAccess()` and `assertScheduleBusinessAccess()` — ownership checks introduced:**
```ts
private assertBusinessAccess(campaign: Campaign, command: ApplicationCommand): void {
  if (campaign.businessId !== command.context.businessId) {
    throw new Error("Campaign does not belong to the command context.");
  }
}

private assertScheduleBusinessAccess(schedule: CampaignSchedule, command: ApplicationCommand): void {
  if (schedule.businessId !== command.context.businessId) {
    throw new Error("Campaign launch schedule does not belong to the command context.");
  }
}
```

`CampaignApplicationService` (S-002) did not include ownership checks — deferred for the foundation slice. `CampaignSchedulingApplicationService` introduces them explicitly. Both helpers throw, allowing `mapCampaignScheduleApplicationError()` to wrap the error as `ValidationFailed`. ✅

**`cancelCampaignLaunchSchedule()` command takes `campaignId`, not `scheduleId`:**  
The cancel command operates on the active schedule for a campaign — callers identify "which campaign's schedule to cancel" rather than "which schedule ID to cancel." This models the user's intent more naturally. ✅

**Duplicate active schedule guard (application layer):**
```ts
const existing = await this.scheduleRepository.findActiveByCampaignId(command.campaignId);
if (existing) {
  throw new Error("Campaign already has an active launch schedule.");
}
```
Checked before creating — an active schedule must be cancelled before a new one is created. ✅

**`getCampaignSchedule()` query — silent business isolation:**
Returns `{ schedule: null }` for foreign-business schedules rather than an error. Consistent with the query pattern established in S-008 of CAP-003. ✅

**`listPendingCampaignSchedules()` — `this.now()` as `asOf`:**
Injects the current timestamp into `findPendingByBusinessId` — queries only return schedules still in the future from now. ✅

**Import alias:** `CampaignSchedule as CampaignScheduleAggregate`. ✅

**Application Audit Verdict: PASS**

---

## Architecture Audit

| Check | Result |
|---|---|
| `campaign-schedule.ts` imports from `@nextshift/shared` and local campaign barrel | ✅ PASS |
| `campaign-schedule-repository.ts` imports from local campaign files only | ✅ PASS |
| `in-memory-campaign-schedule-repository.ts` imports from local campaign files only | ✅ PASS |
| Domain barrel: `export * from "./campaign-schedule"`, `./campaign-schedule-repository"`, `./in-memory-campaign-schedule-repository"` (lines 438–440) | ✅ PASS |
| Application campaign barrel: `export * from "./campaign-scheduling-application-service"` | ✅ PASS |
| No application imports of concrete repository implementations | ✅ PASS |
| CAP-004 S-001–S-003 exports unchanged | ✅ PASS |

**Architecture Audit Verdict: PASS**

---

## Public API Audit

### `@nextshift/domain` new exports

| Export | Result |
|---|---|
| `CampaignSchedule` | ✅ |
| `CampaignScheduleId`, `CampaignScheduleStatus`, `CampaignScheduleSnapshot` | ✅ |
| `ScheduleCampaignLaunchInput`, `RescheduleCampaignLaunchInput` | ✅ |
| `CampaignScheduleEventType`, `CampaignScheduleDomainEvent` (union of 3) | ✅ |
| `CampaignLaunchScheduledEvent`, `CampaignLaunchRescheduledEvent`, `CampaignLaunchScheduleCancelledEvent` | ✅ |
| `CampaignScheduleEventMetadata` | ✅ |
| `assertCampaignCanBeScheduled` | ✅ |
| `CampaignScheduleRepository` | ✅ |
| `InMemoryCampaignScheduleRepository` | ✅ |

### `@nextshift/application` new exports

| Export | Result |
|---|---|
| `CampaignSchedulingApplicationService` | ✅ |
| `ScheduleCampaignLaunchCommand`, `RescheduleCampaignLaunchCommand`, `CancelCampaignLaunchScheduleCommand` | ✅ |
| `GetCampaignScheduleQuery`, `ListPendingCampaignSchedulesQuery` | ✅ |
| `CampaignScheduleApplicationResult`, `CampaignScheduleQueryResult`, `CampaignScheduleListQueryResult` | ✅ |
| `CampaignScheduleApplicationError` | ✅ |

**No breaking changes to prior exports.** ✅

**Public API Audit Verdict: PASS**

---

## Type Safety Audit

| Check | Result |
|---|---|
| `@nextshift/domain typecheck` — 0 errors | ✅ PASS |
| `@nextshift/application typecheck` — 0 errors | ✅ PASS |
| No forbidden imports | ✅ PASS |

**Type Safety Audit Verdict: PASS**

---

## Testing Audit

### New S-004 Tests

**Domain — `test/campaign-schedule.test.ts` — 7 tests**

| Test | Coverage | Result |
|---|---|---|
| Creates a scheduled campaign launch | Snapshot matches all fields; `pullDomainEvents()` returns `CampaignLaunchScheduled` | ✅ |
| Requires scheduled launch time to be strictly in the future | `scheduledFor === createdAt` → throws | ✅ |
| Reschedules an active launch schedule | New `scheduledFor` + `rescheduledAt` + `updatedAt`; `CampaignLaunchRescheduled` with `previousScheduledFor` | ✅ |
| Cancels an active launch schedule | `status: "cancelled"` + `cancelledAt` + `updatedAt`; `CampaignLaunchScheduleCancelled` event | ✅ |
| Prevents scheduling invalid campaign states | `assertCampaignCanBeScheduled("archived")` → throws; `assertCampaignCanBeScheduled("completed")` → throws | ✅ |
| Saves, retrieves, and lists campaign schedules | All 5 query methods verified including `findPendingByBusinessId` | ✅ |
| Supports duplicate active schedule prevention | `findActiveByCampaignId` returns non-null; cancel + save → returns null | ✅ |

**Application — `test/campaign-scheduling-application-service.test.ts` — 9 tests**

| Test | Coverage | Result |
|---|---|---|
| Schedules and persists a campaign launch | `scheduleRepository.exists()` verified; snapshot matches | ✅ |
| Reschedules an existing campaign launch | New `scheduledFor` + `rescheduledAt` timestamp verified | ✅ |
| Cancels an existing campaign launch schedule | `status: "cancelled"` + `cancelledAt` verified | ✅ |
| Queries active and pending campaign schedules | Two campaigns; `getCampaignSchedule` + `listPendingCampaignSchedules`; ordering by `scheduledFor` verified | ✅ |
| Returns not found for missing campaigns | `CampaignNotFound` on `scheduleCampaignLaunch` | ✅ |
| Returns not found when rescheduling or cancelling an absent schedule | Both → `CampaignScheduleNotFound` | ✅ |
| Returns validation failures for duplicate or past schedules | Duplicate active → `ValidationFailed` with message; past reschedule → `ValidationFailed` | ✅ |
| Prevents scheduling archived and completed campaigns | Both → `ValidationFailed` with exact domain messages | ✅ |
| Hides schedules outside the query context | `getCampaignSchedule` with foreign `context` → `{ schedule: null }` | ✅ |

### Regression Tests

| Suite | Before S-004 | After S-004 | Result |
|---|---|---|---|
| Domain (14 prior files) | 135 pass | 135 pass | ✅ No regression |
| Domain S-004 new (1 file) | — | 7 pass | ✅ |
| Domain total | 135 / 14 files | **142 / 15 files** | ✅ |
| Application (18 prior files) | 100 pass | 100 pass | ✅ No regression |
| Application S-004 new (1 file) | — | 9 pass | ✅ |
| Application total | 100 / 18 files | **109 / 19 files** | ✅ |

**Testing Audit Verdict: PASS**

---

## Technical Debt — Accepted for S-004

| Item | Status |
|---|---|
| `pullDomainEvents()` buffer not yet drained by application service | Accepted — integration wiring deferred |
| No runtime scheduling engine or background worker | Accepted — deferred |
| No automated campaign activation on `scheduledFor` | Accepted — deferred |
| No notification delivery | Accepted — deferred |
| No distributed scheduling or cron execution | Accepted — deferred |

---

## Audit Summary

| Area | Status |
|---|---|
| Domain — `CampaignSchedule` aggregate with `schedule()` factory | ✅ PASS |
| Domain — `pendingEvents` buffer + `pullDomainEvents()` collect-and-clear pattern | ✅ PASS |
| Domain — `createFutureTimestamp()` strict future enforcement | ✅ PASS |
| Domain — `assertCampaignCanBeScheduled()` exported guard | ✅ PASS |
| Domain — `reschedule()` with `previousScheduledFor` in event | ✅ PASS |
| Domain — `isPending(asOf)` query method | ✅ PASS |
| Domain — 2-state lifecycle (`scheduled → cancelled`) | ✅ PASS |
| Domain — 3 domain events (`Scheduled`, `Rescheduled`, `Cancelled`) | ✅ PASS |
| Domain — Repository (`findActiveByCampaignId` singular; `findPendingByBusinessId` with `asOf`) | ✅ PASS |
| Domain — `compareSchedules()` sorts by `scheduledFor`, not `createdAt` | ✅ PASS |
| Application — `CampaignSchedulingApplicationService` | ✅ PASS |
| Application — `assertBusinessAccess()` and `assertScheduleBusinessAccess()` | ✅ PASS |
| Application — At-most-one active schedule guard | ✅ PASS |
| Application — Cancel by `campaignId` (not `scheduleId`) | ✅ PASS |
| Application — `getCampaignSchedule()` silent business isolation | ✅ PASS |
| Architecture — Barrel exports correct | ✅ PASS |
| Tests — Domain (7 new) | ✅ PASS |
| Tests — Application (9 new) | ✅ PASS |
| Tests — All prior regressions | ✅ PASS |
| Typecheck | ✅ PASS |

---

## Findings Summary

None.

---

## Exit Decision

**PASS — Slice S-004 accepted. Eligible to proceed to CAP-004 S-004 Slice Release.**

| Exit Criterion | Status |
|---|---|
| `CampaignSchedule` aggregate implemented | ✅ |
| `CampaignScheduleRepository` abstraction implemented | ✅ |
| `InMemoryCampaignScheduleRepository` provided | ✅ |
| `CampaignSchedulingApplicationService` implemented | ✅ |
| All scheduling business rules enforced | ✅ |
| Public exports updated | ✅ |
| Domain tests passing (142 total) | ✅ |
| Application tests passing (109 total) | ✅ |
| Typecheck passing | ✅ |
| All prior regressions passing | ✅ |

---

## Next Phase

**CAP-004 S-004 Slice Release → CAP-004 S-005 Implementation.**
