# CAP-001 Slice-004 Audit Report — Customer Intelligence

**Audit Type:** Vertical Slice Architecture Audit  
**Auditor:** Claude Code (Independent Architecture Auditor)  
**Date:** 2026-06-26  
**Capability:** CAP-001 Business Profile  
**Slice:** Slice-004 Customer Intelligence (backend/runtime only)

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

All four Low items carry forward from prior slices. No new issues specific to Slice-004.

### L-001 — Parallel type hierarchy drift risk (cumulative — 9 pairs across 4 slices)

**Packages:** domain, contracts

Slice-004 adds two new parallel pairs: `CustomerPersonaProfile`/`CustomerPersonaPayload` and `CustomerProfile`/`CustomerProfilePayload`. All fields are structurally identical. TypeScript structural compatibility confirmed by typecheck.

The sync surface has now grown to nine parallel type pairs across four slices. No compile-time enforcement exists to catch domain-only field additions.

**Impact:** Low individually; growing as slices accumulate.  
**Action for Codex:** Mirror all new domain field additions to contracts payload types in the same commit. Engineering standards documentation recommended.

---

### L-002 — Dead code in `domain/src/business/index.ts` persists — 4 slices overdue

**Package:** domain  
**Location:** `domain/src/business/index.ts`

The old `BusinessProfile` (`{ businessId, tenant, name: string, createdAt }`) and `BrandDNA` (narrower shape) remain in this file. Unexported, unreferenced, superseded. No runtime or type effect.

**Impact:** None at runtime. Developer confusion risk increasing with each slice.  
**Action for Codex:** Delete `domain/src/business/index.ts`. This is now four slices overdue — highest-priority Low item.

---

### L-003 — Event ID string concatenation now affects all four publishers

**Package:** event-bus  
**Location:** `event-bus/src/business-profile/index.ts`

All four `publish*` methods use the same string-concatenation fallback:
```ts
`${input.businessId}:customer-profile-updated:${input.occurredAt}` as EventId
```

Collision risk at millisecond precision for same `businessId`. Affects `publishCreated`, `publishBrandUpdated`, `publishOfferUpdated`, `publishCustomerUpdated`.

**Impact:** Near-zero at bootstrap scale.  
**Action for Codex:** Replace all four fallbacks with `crypto.randomUUID() as EventId` in a single commit before production.

---

### L-004 — `new Date().toISOString()` inline now in three use cases

**Package:** application  
**Location:** `application/src/business-profile/index.ts`

`UpdateBrandProfileUseCase`, `UpdateOfferProfileUseCase`, and `UpdateCustomerProfileUseCase` all call `new Date().toISOString()` directly when building their requests. The pattern has now spread to three use cases in the same file.

**Impact:** Low — functional but non-deterministic and harder to unit test.  
**Action for Codex:** Fix all three use cases in a single commit: accept `updatedAt` from the command or inject a `now` function consistent with the `BusinessBrain` dependency pattern.

---

## Positive Observation — Domain Immutability Refactor

During Slice-004 implementation, Codex proactively added `readonly` modifiers to all fields across the entire `domain/src/business-profile/index.ts` file — including existing types from Slices 001–003 (`BusinessIdentity`, `BrandDNA`, `ProductProfile`, `ServiceProfile`, `OfferProfile`, `BusinessProfileMetadata`, `BusinessProfile`). Previously, only array types had `readonly` (`readonly string[]`, `readonly ProductProfile[]`, etc.). Now all scalar and object fields are also `readonly`.

This is outside the strict scope of Slice-004 but is architecturally sound: it enforces domain value-object immutability at compile time. All 5 typechecks pass with zero errors, confirming no structural breakage. This is the correct direction for domain model design.

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

**No new package dependencies introduced in Slice-004.** All 5 package dependency declarations unchanged from Slice-003. ✅  
**No forbidden imports found in any Slice-004 files.** ✅

---

## Package Findings

### packages/domain

**Changes from Slice-003:** `business-profile/index.ts` extended with customer model types. All existing interface fields refactored to `readonly` modifiers (see Positive Observation above).

**New types:**
- `CustomerPersonaProfile` — personaId?, name: string, description?, painPoints?: readonly string[], goals?: readonly string[] ✅
- `CustomerProfile` — targetCustomer?, personas?: readonly CustomerPersonaProfile[], problems?: readonly string[], desiredOutcomes?: readonly string[] ✅
- `BusinessProfile.customer?: CustomerProfile` ✅

**Existing models intact:**
- `BusinessIdentity`, `BusinessStage` from Slice-001 ✅
- `BrandVoice`, `BrandDNA` from Slice-002 ✅
- `ProductProfile`, `ServiceProfile`, `OfferProfile` from Slice-003 ✅
- `BusinessProfile.brand?`, `BusinessProfile.offer?` from prior slices ✅

**No competing exports:** `domain/src/business/index.ts` still not exported. No naming collision. ✅

**Scope control:** `CustomerProfile` contains descriptive fields only — `targetCustomer` (text), `personas` (structural list with name/description/painPoints/goals), `problems` (string list), `desiredOutcomes` (string list). No CRM contacts, leads, opportunities, pipelines, sales activities, or messaging history. ✅

**Domain purity:** CONFIRMED — all new types are pure interfaces. ✅

**Verdict: PASS**

---

### packages/contracts

**Changes from Slice-003:** `business-profile/index.ts` extended. `business-brain/index.ts` extended. `business-twin/index.ts` extended.

**New types in `business-profile`:**
- `CustomerPersonaPayload` — mirrors `domain.CustomerPersonaProfile` ✅
- `CustomerProfilePayload` — mirrors `domain.CustomerProfile` ✅
- `BusinessProfileRecord.customer?: CustomerProfilePayload` ✅
- `UpdateCustomerProfileRequest` — businessId, tenant, customer: CustomerProfilePayload, updatedAt, source ✅
- `GetCustomerProfileRequest` — businessId, tenant ✅
- `CustomerProfileUpdatedPayload` — businessId, customer: CustomerProfilePayload, profileVersion, updatedAt ✅

**Updated `BusinessBrainContract`:**
```ts
updateCustomerProfile(request: UpdateCustomerProfileRequest): Promise<Result<BusinessProfileRecord>>;
getCustomerProfile(request: GetCustomerProfileRequest): Promise<Result<CustomerProfilePayload | null>>;
```
Both new methods declared. ✅

**Updated `BusinessTwinSnapshot`:**
- `customer?: CustomerContext` field added ✅

**New Business Twin context types:**
- `CustomerPersonaContext` — personaId?, name: string, description?, painPoints?: readonly string[], goals?: readonly string[] ✅
- `CustomerContext` — targetCustomer?, personas?: readonly CustomerPersonaContext[], problems?: readonly string[], desiredOutcomes?: readonly string[] ✅

**No domain import in any contracts file.** ✅  
**Existing contract types from Slices 001–003 unchanged.** ✅

**Verdict: PASS**

---

### packages/business-brain

**Changes from Slice-003:** `business-brain/src/business-brain/index.ts` extended with `updateCustomerProfile()` and `getCustomerProfile()` methods. `getBusinessContext()` extended with customer mapping.

**No new dependencies.** Package still depends on: shared, contracts, domain, event-bus. ✅

**New behavior — `updateCustomerProfile()`:**
- Retrieves existing profile; returns `failure` if not found ✅
- Does NOT create profile implicitly ✅
- Spreads existing profile, overwrites `customer` and `metadata.updatedAt/source` ✅
- Saves updated profile to store ✅
- Publishes `CustomerProfileUpdated` via `businessProfileEvents?.publishCustomerUpdated()` ✅
- Returns `success(updatedProfile)` ✅

**New behavior — `getCustomerProfile()`:**
- Retrieves profile from store ✅
- Returns `success(profile?.customer ?? null)` — correctly handles missing profile ✅

**Updated `getBusinessContext()`:**
- Slice-001 identity mapping intact ✅
- Slice-002 brand mapping intact ✅
- Slice-003 offer mapping intact ✅
- New customer mapping: maps `profile.customer` fields to `CustomerContext` when present; omits `customer` from snapshot when undefined ✅
- `personas` array: `CustomerPersonaProfile[]` is structurally assignable to `CustomerPersonaContext[]` ✅
- `problems` and `desiredOutcomes` passed through directly ✅

**Type compatibility:** `BusinessBrain` returns `Result<BusinessProfile>` where contract expects `Result<BusinessProfileRecord>`. `BusinessProfile` (with `customer?: CustomerProfile`) is structurally assignable to `BusinessProfileRecord` (with `customer?: CustomerProfilePayload`). Similarly, `Result<CustomerProfile | null>` is assignable to `Result<CustomerProfilePayload | null>`. Zero typecheck errors confirm. ✅

**In-memory store unchanged. No database access.** ✅

**Verdict: PASS**

---

### packages/event-bus

**Changes from Slice-003:** `business-profile/index.ts` extended. `BusinessProfileEventPublisher` gains `publishCustomerUpdated()` method.

**New additions:**
- `CUSTOMER_PROFILE_UPDATED_EVENT_TYPE = "CustomerProfileUpdated"` ✅
- `CustomerProfileUpdatedEvent` type — narrows `eventType` to literal constant ✅
- `PublishCustomerProfileUpdatedInput` interface ✅
- `publishCustomerUpdated()` method — builds event, publishes via `eventBus.publish()`, returns typed event ✅

**Backward compatibility:**
- `publishCreated()` from Slice-001 unchanged ✅
- `publishBrandUpdated()` from Slice-002 unchanged ✅
- `publishOfferUpdated()` from Slice-003 unchanged ✅
- All prior event type constants unchanged ✅

**Event payload:** `CustomerProfileUpdatedPayload` contains `{ businessId, customer: CustomerProfilePayload, profileVersion, updatedAt }` — structural data only. ✅

**Event ID fallback** pattern carried forward (see L-003).

**Verdict: PASS**

---

### packages/application

**Changes from Slice-003:** `business-profile/index.ts` extended with customer use cases, commands, and queries.

**New additions:**
- `UpdateCustomerProfileCommand` — commandType `"UpdateCustomerProfile"`, customer: CustomerProfile ✅
- `UpdateCustomerProfileResult` — profile: BusinessProfile ✅
- `GetCustomerProfileQuery` — queryType `"GetCustomerProfile"` ✅
- `GetCustomerProfileResult` — customer: CustomerProfile | null ✅
- `UpdateCustomerProfileUseCase` — delegates to `businessBrain.updateCustomerProfile()` ✅
- `GetCustomerProfileUseCase` — delegates to `businessBrain.getCustomerProfile()` ✅

**Contract compliance:**
- All eight use cases (Slices 001–004) accept `BusinessBrainContract` ✅
- No customer data stored directly in application ✅
- No Business Brain bypass ✅

**Slices 001–003 use cases unchanged.** ✅

**`mapActorToSource` module-level function** shared across all eight use cases. ✅

**`UpdateCustomerProfileUseCase` calls `new Date().toISOString()` directly** (see L-004, now affecting 3 use cases).

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
| `CustomerProfile` exists in `domain/src/business-profile/index.ts` | PASS |
| `CustomerPersonaProfile` exists in `domain/src/business-profile/index.ts` | PASS |
| `BusinessProfile.customer?: CustomerProfile` added | PASS |
| No competing exported `CustomerProfile`/`CustomerPersonaProfile` elsewhere | PASS |
| Slice-001 identity model intact | PASS |
| Slice-002 brand model intact | PASS |
| Slice-003 offer model intact | PASS |
| `contracts` does not import `domain` | PASS |
| No contracts↔domain circular dependency | PASS |
| Application uses `BusinessBrainContract`, not concrete class | PASS |
| No new package dependencies introduced | PASS |
| No forbidden imports in any Slice-004 file | PASS |
| Scope control — no CRM contacts, leads, opportunities, pipelines, sales activities, messaging history | PASS |
| Scope control — no Business Goals, AI Summary, Learning, Campaign, Content generation | PASS |
| `CustomerPersonaPayload` is structural and domain-free | PASS |
| `CustomerProfilePayload` is structural and domain-free | PASS |
| `UpdateCustomerProfileRequest` exists in contracts | PASS |
| `GetCustomerProfileRequest` exists in contracts | PASS |
| `CustomerProfileUpdatedPayload` exists in contracts | PASS |
| `BusinessProfileRecord.customer?: CustomerProfilePayload` added | PASS |
| `BusinessBrainContract` includes `updateCustomerProfile` and `getCustomerProfile` | PASS |
| `CustomerContext` exists in contracts business-twin | PASS |
| `CustomerPersonaContext` exists in contracts business-twin | PASS |
| `BusinessTwinSnapshot.customer?: CustomerContext` added | PASS |
| Customer mapped into Business Twin snapshot | PASS |
| Slice-001 identity snapshot mapping intact | PASS |
| Slice-002 brand snapshot mapping intact | PASS |
| Slice-003 offer snapshot mapping intact | PASS |
| Business Brain requires existing profile before Customer update | PASS |
| Business Brain does not create profile implicitly during customer update | PASS |
| Business Brain retrieves Customer Profile | PASS |
| Business Brain publishes `CustomerProfileUpdated` | PASS |
| In-memory store remains bootstrap-only | PASS |
| No database access | PASS |
| `UpdateCustomerProfileUseCase` exists | PASS |
| `GetCustomerProfileUseCase` exists | PASS |
| Application coordinates Business Brain via contract | PASS |
| Application does not store customer data directly | PASS |
| `CustomerProfileUpdated` event publishable | PASS |
| `BusinessProfileCreated` from Slice-001 still works | PASS |
| `BrandProfileUpdated` from Slice-002 still works | PASS |
| `OfferProfileUpdated` from Slice-003 still works | PASS |

---

## Architecture Risk Review

| Risk | Assessment |
|---|---|
| **Customer domain model drift** | Low — parallel types (CustomerProfile/CustomerProfilePayload, CustomerPersonaProfile/CustomerPersonaPayload) require manual sync. See L-001. |
| **contracts/domain payload sync** | Growing — 9 parallel type pairs now. See L-001. |
| **Business Twin snapshot mapping** | Clean. Customer mapping is field-by-field. `CustomerPersonaProfile[]` → `CustomerPersonaContext[]` structural compatibility confirmed. |
| **Customer update behavior** | Correct — requires existing profile. No implicit create. Consistent with Slices 002 and 003 patterns. |
| **Future API integration** | `UpdateCustomerProfileCommand.customer: CustomerProfile` is a flat, bounded structure. Easy to deserialize from JSON body at the API layer. |
| **Future UI integration** | `CustomerProfile` maps directly to form inputs: a free-text customer description, a repeating persona list (name/description/painPoints/goals), problems list, and outcomes list. No complexity. |
| **Future CRM integration** | `CustomerProfile` contains persona descriptors and problem/outcome text — ideal as CRM segmentation seed data. `BusinessTwinSnapshot.customer` makes this accessible to Decision Brain without coupling. No architectural risk. |
| **Future Campaign/Content integration** | `customer.personas[].painPoints`, `customer.personas[].goals`, `customer.desiredOutcomes`, and `customer.problems` are exactly the inputs content generation and campaign targeting need. Well-positioned in the Business Twin snapshot. |

---

## Cumulative Low Item Status (across CAP-001 Slices 001–004)

| ID | First raised | Status | Action |
|---|---|---|---|
| L-001 | Slice-001 | Open — 9 pairs, growing | Mirror all new domain field additions in contracts payloads |
| L-002 | Slice-001 | Open — **4 slices overdue** | Delete `domain/src/business/index.ts` — highest priority Low item |
| L-003 | Slice-001 | Open — now 4 publishers | Replace all event ID fallbacks with `crypto.randomUUID()` |
| L-004 | Slice-002 | Open — now 3 use cases | Fix `new Date()` in all three update use cases in one commit |

---

## Final Decision

**APPROVED**

| Target | Result |
|---|---|
| Critical = 0 | ✅ 0 |
| High = 0 | ✅ 0 |
| Blocking Medium = 0 | ✅ 0 |
| Audit Score ≥ 95 | ✅ 97 / 100 |

**Slice-004 Backend/Runtime: COMPLETE**

The Customer Intelligence slice is architecturally clean, type-safe, and extends Slices 001–003 without breaking any of them. The `BusinessTwinSnapshot` now carries identity, brand, offer, and customer context — the Business Profile is taking shape as a comprehensive four-axis business understanding layer.

**Recommendation before Slice-005:** L-002 (`domain/src/business/index.ts` deletion) is now four slices overdue. Codex should resolve this in the next session alongside L-004 (three `new Date()` calls in three update use cases). Both are small, targeted changes that will pay down growing cleanup debt before the next slice adds more surface area.

Proceed to: Slice-005 (Business Goals or the next slice in the sprint plan).
