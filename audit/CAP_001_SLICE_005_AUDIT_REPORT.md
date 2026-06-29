# CAP-001 Slice-005 Audit Report — Business Goals

**Audit Type:** Vertical Slice Architecture Audit  
**Auditor:** Claude Code (Independent Architecture Auditor)  
**Date:** 2026-06-26  
**Capability:** CAP-001 Business Profile  
**Slice:** Slice-005 Business Goals (backend/runtime only)

**Packages Audited:**
```
packages/domain
packages/contracts
packages/business-brain
packages/event-bus
packages/application
```

---

## Overall Result

**APPROVED**

---

## Audit Score

**97 / 100**

| Severity | Count |
|---|---|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 4 |

---

## Critical Issues

None.

---

## High Issues

None.

---

## Medium Issues

None.

---

## Low Issues

All four Low items carry forward from prior slices. No new issues specific to Slice-005.

### L-001 — Parallel type hierarchy drift risk (cumulative — 10 pairs across 5 slices)

**Packages:** domain, contracts

Slice-005 adds one new parallel pair: `BusinessGoalsProfile`/`BusinessGoalsProfilePayload`. All fields are structurally identical. TypeScript structural compatibility confirmed by typecheck.

The sync surface is now ten parallel type pairs across five slices. No compile-time enforcement exists.

**Impact:** Low individually; growing as slices accumulate.  
**Action for Codex:** Mirror all new domain field additions in contracts payload types in the same commit.

---

### L-002 — Dead code in `domain/src/business/index.ts` persists — 5 slices overdue

**Package:** domain  
**Location:** `domain/src/business/index.ts`

The old `BusinessProfile` and `BrandDNA` (narrow shape) remain unexported and unreferenced. Five slices of deferred cleanup.

**Impact:** None at runtime. Developer confusion risk.  
**Action for Codex:** Delete `domain/src/business/index.ts` immediately. This is the highest-priority Low item and has been deferred past a reasonable threshold.

---

### L-003 — Event ID string concatenation now affects all five publishers

**Package:** event-bus  
**Location:** `event-bus/src/business-profile/index.ts`

All five `publish*` methods use the string-concatenation fallback for `eventId`. The fifth publisher added this slice:
```ts
`${input.businessId}:business-goals-updated:${input.occurredAt}` as EventId
```

**Impact:** Near-zero at bootstrap scale.  
**Action for Codex:** Replace all five fallbacks with `crypto.randomUUID() as EventId` in a single commit before production.

---

### L-004 — `new Date().toISOString()` inline now in four use cases

**Package:** application  
**Location:** `application/src/business-profile/index.ts`

`UpdateBrandProfileUseCase`, `UpdateOfferProfileUseCase`, `UpdateCustomerProfileUseCase`, and `UpdateBusinessGoalsUseCase` all call `new Date().toISOString()` directly. The pattern has now spread to four of the five update use cases in the same file.

**Impact:** Low — functional but non-deterministic and harder to unit test.  
**Action for Codex:** Fix all four use cases in a single commit before adding another slice.

---

## Dependency Graph

```
shared
  └── contracts              (shared only — no domain import) ✅
        ├── domain           (shared, contracts)
        └── event-bus        (shared, contracts)
              └── business-brain   (shared, contracts, domain, event-bus)
                    └── application (shared, contracts, domain, event-bus, business-brain, ...)
```

**No new package dependencies introduced in Slice-005.** All 5 package dependency declarations unchanged from Slice-004. ✅  
**No forbidden imports found in any Slice-005 files.** ✅

---

## Package Findings

### packages/domain

**Changes from Slice-004:** `business-profile/index.ts` extended with the Business Goals model.

**New types:**
- `BusinessGoalsProfile` — revenueGoal?, growthGoal?, priorityGoal?, currentChallenges?: readonly string[], successDefinition? ✅
- `BusinessProfile.goals?: BusinessGoalsProfile` ✅

**Existing models intact:**
- `BusinessIdentity`, `BusinessStage` from Slice-001 ✅
- `BrandVoice`, `BrandDNA` from Slice-002 ✅
- `ProductProfile`, `ServiceProfile`, `OfferProfile` from Slice-003 ✅
- `CustomerPersonaProfile`, `CustomerProfile` from Slice-004 ✅
- All fields carry `readonly` modifiers established in Slice-004 ✅

**Scope control:** `BusinessGoalsProfile` contains text and list fields only — revenue goal (text), growth goal (text), priority goal (text), current challenges (string list), success definition (text). No analytics, forecasting, financial reporting, execution planning, or AI recommendations. ✅

**Domain purity:** CONFIRMED — all new types are pure interfaces. ✅

**Verdict: PASS**

---

### packages/contracts

**Changes from Slice-004:** `business-profile/index.ts` extended. `business-brain/index.ts` extended. `business-twin/index.ts` extended.

**New types in `business-profile`:**
- `BusinessGoalsProfilePayload` — mirrors `domain.BusinessGoalsProfile` exactly ✅
- `BusinessProfileRecord.goals?: BusinessGoalsProfilePayload` ✅
- `UpdateBusinessGoalsRequest` — businessId, tenant, goals: BusinessGoalsProfilePayload, updatedAt, source ✅
- `GetBusinessGoalsRequest` — businessId, tenant ✅
- `BusinessGoalsUpdatedPayload` — businessId, goals: BusinessGoalsProfilePayload, profileVersion, updatedAt ✅

**Updated `BusinessBrainContract`:**
```ts
updateBusinessGoals(request: UpdateBusinessGoalsRequest): Promise<Result<BusinessProfileRecord>>;
getBusinessGoals(request: GetBusinessGoalsRequest): Promise<Result<BusinessGoalsProfilePayload | null>>;
```
Both new methods declared. ✅

**Updated `BusinessTwinSnapshot`:**
- `goals?: BusinessGoalsContext` field added, positioned between `customer` and `strategy` ✅

**New Business Twin context type:**
- `BusinessGoalsContext` — revenueGoal?, growthGoal?, priorityGoal?, currentChallenges?: readonly string[], successDefinition? ✅

**No domain import in any contracts file.** ✅  
**Existing contract types from Slices 001–004 unchanged.** ✅

**Verdict: PASS**

---

### packages/business-brain

**Changes from Slice-004:** `business-brain/src/business-brain/index.ts` extended with `updateBusinessGoals()` and `getBusinessGoals()` methods. `getBusinessContext()` extended with goals mapping.

**No new dependencies.** Package still depends on: shared, contracts, domain, event-bus. ✅

**New behavior — `updateBusinessGoals()`:**
- Retrieves existing profile; returns `failure` if not found ✅
- Does NOT create profile implicitly ✅
- Spreads existing profile, overwrites `goals` and `metadata.updatedAt/source` ✅
- Saves updated profile to store ✅
- Publishes `BusinessGoalsUpdated` via `businessProfileEvents?.publishBusinessGoalsUpdated()` ✅
- Returns `success(updatedProfile)` ✅

**New behavior — `getBusinessGoals()`:**
- Retrieves profile from store ✅
- Returns `success(profile?.goals ?? null)` — correctly handles missing profile ✅

**Updated `getBusinessContext()`:**
- Slice-001 identity mapping intact ✅
- Slice-002 brand mapping intact ✅
- Slice-003 offer mapping intact ✅
- Slice-004 customer mapping intact ✅
- New goals mapping: maps all five `BusinessGoalsProfile` fields to `BusinessGoalsContext` when present; omits `goals` from snapshot when undefined ✅

**Type compatibility:** `BusinessBrain` returns `Result<BusinessProfile>` where contract expects `Result<BusinessProfileRecord>`. Structurally compatible across all five profile fields. Zero typecheck errors confirm. `Result<BusinessGoalsProfile | null>` is assignable to `Result<BusinessGoalsProfilePayload | null>` — identical structure. ✅

**In-memory store unchanged. No database access.** ✅

**Verdict: PASS**

---

### packages/event-bus

**Changes from Slice-004:** `business-profile/index.ts` extended. `BusinessProfileEventPublisher` gains `publishBusinessGoalsUpdated()` method.

**New additions:**
- `BUSINESS_GOALS_UPDATED_EVENT_TYPE = "BusinessGoalsUpdated"` ✅
- `BusinessGoalsUpdatedEvent` type — narrows `eventType` to literal constant ✅
- `PublishBusinessGoalsUpdatedInput` interface ✅
- `publishBusinessGoalsUpdated()` method — builds event, publishes via `eventBus.publish()`, returns typed event ✅

**Backward compatibility:**
- `publishCreated()` from Slice-001 unchanged ✅
- `publishBrandUpdated()` from Slice-002 unchanged ✅
- `publishOfferUpdated()` from Slice-003 unchanged ✅
- `publishCustomerUpdated()` from Slice-004 unchanged ✅
- All prior event type constants unchanged ✅

**Event payload:** `BusinessGoalsUpdatedPayload` contains `{ businessId, goals: BusinessGoalsProfilePayload, profileVersion, updatedAt }` — structural data only. ✅

**Event ID fallback** pattern carried forward (see L-003).

**Verdict: PASS**

---

### packages/application

**Changes from Slice-004:** `business-profile/index.ts` extended with goals use cases, commands, and queries.

**New additions:**
- `UpdateBusinessGoalsCommand` — commandType `"UpdateBusinessGoals"`, goals: BusinessGoalsProfile ✅
- `UpdateBusinessGoalsResult` — profile: BusinessProfile ✅
- `GetBusinessGoalsQuery` — queryType `"GetBusinessGoals"` ✅
- `GetBusinessGoalsResult` — goals: BusinessGoalsProfile | null ✅
- `UpdateBusinessGoalsUseCase` — delegates to `businessBrain.updateBusinessGoals()` ✅
- `GetBusinessGoalsUseCase` — delegates to `businessBrain.getBusinessGoals()` ✅

**Contract compliance:**
- All ten use cases (Slices 001–005) accept `BusinessBrainContract` ✅
- No goals data stored directly in application ✅
- No Business Brain bypass ✅

**Slices 001–004 use cases unchanged.** ✅

**`mapActorToSource` module-level function** shared across all ten use cases. ✅

**`UpdateBusinessGoalsUseCase` calls `new Date().toISOString()` directly** (see L-004, now affecting 4 use cases).

**Verdict: PASS**

---

## Typecheck Result

| Package | Command | Result |
|---|---|---|
| @nextshift/domain | `pnpm --filter @nextshift/domain typecheck` | PASS — 0 errors |
| @nextshift/contracts | `pnpm --filter @nextshift/contracts typecheck` | PASS — 0 errors |
| @nextshift/event-bus | `pnpm --filter @nextshift/event-bus typecheck` | PASS — 0 errors |
| @nextshift/business-brain | `pnpm --filter @nextshift/business-brain typecheck` | PASS — 0 errors |
| @nextshift/application | `pnpm --filter @nextshift/application typecheck` | PASS — 0 errors |

**All 5 packages: 0 type errors.** ✅

---

## Architecture Compliance Result

| Check | Result |
|---|---|
| `BusinessGoalsProfile` exists in `domain/src/business-profile/index.ts` | PASS |
| `BusinessProfile.goals?: BusinessGoalsProfile` added | PASS |
| No competing exported goals model elsewhere | PASS |
| Slice-001 identity model intact | PASS |
| Slice-002 brand model intact | PASS |
| Slice-003 offer model intact | PASS |
| Slice-004 customer model intact | PASS |
| `contracts` does not import `domain` | PASS |
| No contracts↔domain circular dependency | PASS |
| Application uses `BusinessBrainContract`, not concrete class | PASS |
| No new package dependencies introduced | PASS |
| No forbidden imports in any Slice-005 file | PASS |
| Scope control — no analytics, forecasting, financial reporting, execution planning, AI recommendations | PASS |
| Scope control — no recommendation logic, campaign logic, content generation | PASS |
| `BusinessGoalsProfilePayload` is structural and domain-free | PASS |
| `UpdateBusinessGoalsRequest` exists in contracts | PASS |
| `GetBusinessGoalsRequest` exists in contracts | PASS |
| `BusinessGoalsUpdatedPayload` exists in contracts | PASS |
| `BusinessProfileRecord.goals?: BusinessGoalsProfilePayload` added | PASS |
| `BusinessBrainContract` includes `updateBusinessGoals` and `getBusinessGoals` | PASS |
| `BusinessGoalsContext` exists in contracts business-twin | PASS |
| `BusinessTwinSnapshot.goals?: BusinessGoalsContext` added | PASS |
| Goals mapped into Business Twin snapshot | PASS |
| Slice-001 identity snapshot mapping intact | PASS |
| Slice-002 brand snapshot mapping intact | PASS |
| Slice-003 offer snapshot mapping intact | PASS |
| Slice-004 customer snapshot mapping intact | PASS |
| Business Brain requires existing profile before Goals update | PASS |
| Business Brain does not create profile implicitly during goals update | PASS |
| Business Brain retrieves Business Goals | PASS |
| Business Brain publishes `BusinessGoalsUpdated` | PASS |
| In-memory store remains bootstrap-only | PASS |
| No database access | PASS |
| `UpdateBusinessGoalsUseCase` exists | PASS |
| `GetBusinessGoalsUseCase` exists | PASS |
| Application coordinates Business Brain via contract | PASS |
| Application does not store goals data directly | PASS |
| `BusinessGoalsUpdated` event publishable | PASS |
| `BusinessProfileCreated` from Slice-001 still works | PASS |
| `BrandProfileUpdated` from Slice-002 still works | PASS |
| `OfferProfileUpdated` from Slice-003 still works | PASS |
| `CustomerProfileUpdated` from Slice-004 still works | PASS |

---

## Architecture Risk Review

| Risk | Assessment |
|---|---|
| **Goals domain model drift** | Low — `BusinessGoalsProfile`/`BusinessGoalsProfilePayload` require manual sync. See L-001. |
| **contracts/domain payload sync** | Growing — 10 parallel type pairs now. See L-001. |
| **Business Twin snapshot mapping** | Clean. Goals mapping is explicit field-by-field. `BusinessGoalsContext` sits correctly between `customer` and `strategy` in the snapshot ordering. |
| **Goals update behavior** | Correct — requires existing profile. No implicit create. Consistent with all prior update patterns. |
| **Future API integration** | `UpdateBusinessGoalsCommand.goals: BusinessGoalsProfile` is a flat, simple structure. Easy to deserialize from JSON body. All five fields are strings or string arrays — zero complexity at the API boundary. |
| **Future UI integration** | `BusinessGoalsProfile` maps directly to simple form fields: five text/textarea inputs. No structured lists or nested objects. Cleanest UI surface of any CAP-001 slice so far. |
| **Future Decision Brain integration** | `BusinessTwinSnapshot.goals` gives the Decision Brain direct access to `priorityGoal`, `revenueGoal`, and `currentChallenges` when making recommendations. This is the most strategically valuable axis of the Business Twin for recommendation generation. Well-positioned. |
| **Future AI Coach integration** | `successDefinition` and `currentChallenges` together form the natural prompt seed for an AI coaching dialogue. `BusinessTwinSnapshot.goals` is the right place for the AI Coach to read business intent — no additional coupling needed. |

---

## Cumulative Low Item Status (across CAP-001 Slices 001–005)

| ID | First raised | Status | Action |
|---|---|---|---|
| L-001 | Slice-001 | Open — 10 pairs, growing | Mirror all domain field additions in contracts payloads |
| L-002 | Slice-001 | Open — **5 slices overdue** | Delete `domain/src/business/index.ts` — **must resolve before next slice** |
| L-003 | Slice-001 | Open — now 5 publishers | Replace all event ID fallbacks with `crypto.randomUUID()` |
| L-004 | Slice-002 | Open — now 4 use cases | Fix `new Date()` in all four update use cases in one commit |

---

## Final Decision

**APPROVED**

| Target | Result |
|---|---|
| Critical = 0 | ✅ 0 |
| High = 0 | ✅ 0 |
| Blocking Medium = 0 | ✅ 0 |
| Audit Score ≥ 95 | ✅ 97 / 100 |

**Slice-005 Backend/Runtime: COMPLETE**

The Business Goals slice is architecturally clean, type-safe, and extends Slices 001–004 without breaking any of them. The `BusinessTwinSnapshot` now carries five axes: identity, brand, offer, customer, and goals. The Business Profile capability is functionally complete as a bootstrap-tier understanding layer.

**Strong recommendation before Slice-006:** L-002 (`domain/src/business/index.ts`) has been deferred for five consecutive slices. It should be treated as a blocking prerequisite for the next sprint cycle, not another Low item to carry forward. L-004 (four `new Date()` calls in four use cases) is a parallel one-commit fix. Both are small, targeted, and will prevent further accumulation of cleanup debt.

Proceed to: Slice-006 or the next capability in the sprint plan.
