# CAP-001 Slice-002 Audit Report — Brand DNA

**Audit Type:** Vertical Slice Architecture Audit  
**Auditor:** Claude Code (Independent Architecture Auditor)  
**Date:** 2026-06-26  
**Capability:** CAP-001 Business Profile  
**Slice:** Slice-002 Brand DNA (backend/runtime only)

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

### L-001 — Parallel type hierarchy drift risk carries forward from Slice-001

**Packages:** domain, contracts

Slice-002 adds a new parallel pair: `domain.BrandVoice` / `contracts.BrandVoicePayload` and `domain.BrandDNA` / `contracts.BrandDNAPayload`. All fields are structurally identical and TypeScript accepts the assignments. The same drift risk from Slice-001 (L-001) applies: when a new Brand field is added to `domain.BrandDNA`, it must also be manually added to `contracts.BrandDNAPayload` with no compile-time enforcement.

One specific weak point: `BrandDNAContext.voice?: string` in contracts (plain `string`) while `domain.BrandDNA.voice?: BrandVoice` is the precise union type. The snapshot view loses type precision on the `voice` field. Callers of `getBusinessContext()` cannot discriminate on the voice literal type.

**Impact:** Low at this slice scope.  
**Action for Codex:** When adding Brand fields, always mirror them in contracts payload types in the same commit. Consider narrowing `BrandDNAContext.voice` to the `BrandVoicePayload` literal union in a future contracts update.

---

### L-002 — Dead `BrandDNA` type remains in `domain/src/business/index.ts`

**Package:** domain  
**Location:** `domain/src/business/index.ts`

The old bootstrap `BrandDNA` interface (fields: `vision?, mission?, values?, voice?: string, positioning?`) still exists in `domain/src/business/index.ts`. It has a narrower shape than the canonical `BrandDNA` in `business-profile/index.ts` (which adds `brandName?` and `brandStory?`). The file is no longer exported from `domain/src/index.ts`, so there is no naming conflict or export collision.

This is the same dead-code concern as Slice-001 (L-002 carried forward). Both the old `BusinessProfile` and the old `BrandDNA` in `business/index.ts` are now dead code.

**Impact:** No runtime or type effect.  
**Action for Codex:** Delete `domain/src/business/index.ts` entirely. All its canonical content now lives in `business-profile/index.ts`.

---

### L-003 — Event ID string concatenation in `publishBrandUpdated`

**Package:** event-bus  
**Location:** `event-bus/src/business-profile/index.ts`

```ts
eventId:
  input.eventId ??
  (`${input.businessId}:brand-profile-updated:${input.occurredAt}` as EventId),
```

Same pattern as Slice-001 (L-003). The fallback event ID uses string concatenation. Two `BrandProfileUpdated` events for the same `businessId` at the same millisecond would produce the same `eventId`. This is also present in `publishCreated` from Slice-001.

**Impact:** Near-zero at bootstrap scale.  
**Action for Codex:** Replace both event ID fallbacks with `crypto.randomUUID() as EventId` before production deployment.

---

### L-004 — `UpdateBrandProfileUseCase` calls `new Date().toISOString()` directly

**Package:** application  
**Location:** `application/src/business-profile/index.ts`

```ts
updatedAt: new Date().toISOString(),
```

The `updatedAt` timestamp is generated inside the use case at execution time. This introduces a non-deterministic side effect that makes the use case harder to test (time cannot be injected or frozen). The pattern is inconsistent with `BusinessBrain`, which accepts an injectable `now` function in its dependencies.

**Impact:** Low — functional but reduces testability.  
**Action for Codex:** Accept `updatedAt` from the command (`UpdateBrandProfileCommand.updatedAt?: Timestamp`) or inject a `now` function into the use case constructor, consistent with the `BusinessBrain` pattern.

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

**No new package dependencies introduced in Slice-002.** All 5 package dependency declarations are unchanged from Slice-001. ✅

**No forbidden imports found in any Slice-002 files.** ✅

---

## Package Findings

### packages/domain

**Changes from Slice-001:** `business-profile/index.ts` extended. `domain/src/index.ts` updated — `business/index.ts` is no longer exported at all (previously exported only `BrandDNA`; now that export is removed entirely since `BrandDNA` now belongs in `business-profile`).

**New types:**
- `BrandVoice` — `"professional" | "friendly" | "premium" | "bold" | "educational" | "inspirational" | "casual"` ✅
- `BrandDNA` — brandName?, brandStory?, vision?, mission?, values?, voice?: BrandVoice, positioning? ✅
- `BusinessProfile.brand?: BrandDNA` — optional brand field added ✅

**Canonical Brand check:**
- `BrandDNA` is exported from `domain/src/business-profile/index.ts` ✅
- `domain/src/index.ts` no longer re-exports from `./business` ✅
- No competing `BrandDNA` is exported at the package level ✅
- Dead `BrandDNA` exists in `domain/src/business/index.ts` but is unexported (see L-002)

**Domain purity:** CONFIRMED — all new types are pure interfaces/type aliases. No functions, services, repositories, or persistence.

**Verdict: PASS**

---

### packages/contracts

**Changes from Slice-001:** `business-profile/index.ts` extended. `business-brain/index.ts` extended. `business-twin/index.ts` extended.

**New types in `business-profile`:**
- `BrandVoicePayload` — same union literals as `domain.BrandVoice` ✅
- `BrandDNAPayload` — structural, mirrors `domain.BrandDNA` ✅
- `BusinessProfileRecord.brand?: BrandDNAPayload` — brand field added ✅
- `UpdateBrandProfileRequest` — businessId, tenant, brand: BrandDNAPayload, updatedAt, source ✅
- `GetBrandProfileRequest` — businessId, tenant ✅
- `BrandProfileUpdatedPayload` — businessId, brand: BrandDNAPayload, profileVersion, updatedAt ✅

**Updated `BusinessBrainContract`:**
```ts
updateBrandProfile(request: UpdateBrandProfileRequest): Promise<Result<BusinessProfileRecord>>;
getBrandProfile(request: GetBrandProfileRequest): Promise<Result<BrandDNAPayload | null>>;
```
Both new methods declared. ✅

**Updated `BusinessTwinSnapshot`:**
- `brand?: BrandDNAContext` field added ✅

**New `BrandDNAContext`:**
```ts
interface BrandDNAContext {
  brandName?, brandStory?, vision?, mission?, values?, voice?: string, positioning?
}
```
Note: `voice` is typed as plain `string`, not the `BrandVoicePayload` union (see L-001).

**No domain import in contracts.** ✅ `contracts/src/business-profile/index.ts` imports only from `@nextshift/shared`.

**Verdict: PASS**

---

### packages/business-brain

**Changes from Slice-001:** `business-brain/src/business-brain/index.ts` extended with `updateBrandProfile()` and `getBrandProfile()` methods.

**No new dependencies introduced.** Package still depends on: shared, contracts, domain, event-bus. ✅

**New behavior — `updateBrandProfile()`:**
- Retrieves existing profile; returns `failure` if not found ✅
- Does NOT create profile implicitly ✅
- Spreads existing profile and overwrites `brand` and `metadata.updatedAt/source` ✅
- Saves updated profile to store ✅
- Publishes `BrandProfileUpdated` event via `businessProfileEvents?.publishBrandUpdated()` ✅
- Returns `success(updatedProfile)` ✅

**New behavior — `getBrandProfile()`:**
- Retrieves profile from store ✅
- Returns `success(profile?.brand ?? null)` — correctly handles missing profile ✅

**Updated `getBusinessContext()`:**
- Slice-001 identity mapping remains intact ✅
- New brand mapping: maps `profile.brand` fields to `BrandDNAContext` when present; omits `brand` from snapshot when undefined ✅
- Mapping is explicit (field-by-field), not a spread — provides safe structural isolation ✅

**Type compatibility:** `BusinessBrain` returns `Result<BusinessProfile>` while the contract expects `Result<BusinessProfileRecord>`. TypeScript accepts this via structural compatibility (`BusinessProfile` is structurally assignable to `BusinessProfileRecord` after the `brand` field addition). Typecheck confirms: zero errors. ✅

**No database access. In-memory store is bootstrap-only.** ✅

**Verdict: PASS**

---

### packages/event-bus

**Changes from Slice-001:** `business-profile/index.ts` extended. `BusinessProfileEventPublisher` class gains `publishBrandUpdated()` method.

**New additions:**
- `BRAND_PROFILE_UPDATED_EVENT_TYPE = "BrandProfileUpdated"` ✅
- `BrandProfileUpdatedEvent` type — narrows `eventType` to the literal constant ✅
- `PublishBrandProfileUpdatedInput` interface ✅
- `publishBrandUpdated()` method — builds event, publishes via `eventBus.publish()`, returns typed event ✅

**Slice-001 backward compatibility:**
- `publishCreated()` and `BUSINESS_PROFILE_CREATED_EVENT_TYPE` remain unchanged ✅
- `BusinessProfileCreatedEvent` type unchanged ✅

**Event Bus does not persist events.** `InMemoryEventBus` handlers are invoked synchronously; no event log. ✅

**Event payload:** `BrandProfileUpdatedPayload` contains `{ businessId, brand: BrandDNAPayload, profileVersion, updatedAt }` — structural data only. ✅

**Event ID fallback** uses string concatenation (see L-003).

**Verdict: PASS**

---

### packages/application

**Changes from Slice-001:** `business-profile/index.ts` extended. `mapActorToSource()` refactored from private method to module-level function (shared across all use cases).

**New additions:**
- `UpdateBrandProfileCommand` — commandType `"UpdateBrandProfile"`, brand: BrandDNA ✅
- `UpdateBrandProfileResult` — profile: BusinessProfile ✅
- `GetBrandProfileQuery` — queryType `"GetBrandProfile"` ✅
- `GetBrandProfileResult` — brand: BrandDNA | null ✅
- `UpdateBrandProfileUseCase` — delegates to `businessBrain.updateBrandProfile()` ✅
- `GetBrandProfileUseCase` — delegates to `businessBrain.getBrandProfile()` ✅

**Contract compliance:**
- All four use cases accept `BusinessBrainContract` (not concrete class) ✅ — M-001 from Slice-001 is resolved and maintained
- No brand data stored directly in application ✅
- No Business Brain bypass ✅

**`mapActorToSource` refactor:**
The private `mapActorToSource` method was promoted to a module-level function shared by all four use cases. Clean refactor — eliminates duplication. ✅

**`UpdateBrandProfileUseCase` calls `new Date().toISOString()` directly** (see L-004).

**Type note:** `UpdateBrandProfileCommand.brand: BrandDNA` (domain type) is passed to `UpdateBrandProfileRequest.brand: BrandDNAPayload` (contracts type). TypeScript accepts this via structural compatibility. ✅

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
| `BrandDNA` exists in `domain/src/business-profile/index.ts` | PASS |
| `BrandVoice` exists in `domain/src/business-profile/index.ts` | PASS |
| `BusinessProfile.brand?: BrandDNA` added | PASS |
| No competing exported `BrandDNA` from `domain/src/business/index.ts` | PASS |
| `contracts` does not import `domain` | PASS |
| No contracts↔domain circular dependency | PASS |
| Application uses `BusinessBrainContract`, not concrete class | PASS |
| No new package dependencies introduced | PASS |
| No forbidden imports in any Slice-002 file | PASS |
| Scope control — no UI, API, database, Offer, Customer, Goals, AI Summary, Learning, Content, Campaign | PASS |
| `BrandDNAPayload` is structural, no domain import | PASS |
| `UpdateBrandProfileRequest` exists in contracts | PASS |
| `GetBrandProfileRequest` exists in contracts | PASS |
| `BrandProfileUpdatedPayload` exists in contracts | PASS |
| `BusinessProfileRecord.brand?: BrandDNAPayload` added | PASS |
| `BusinessBrainContract` includes `updateBrandProfile` and `getBrandProfile` | PASS |
| `BrandDNAContext` exists in `contracts/src/business-twin/index.ts` | PASS |
| `BusinessTwinSnapshot.brand?: BrandDNAContext` added | PASS |
| Brand context mapped into Business Twin snapshot | PASS |
| Slice-001 identity mapping remains intact | PASS |
| Business Brain requires existing profile before Brand update | PASS |
| Business Brain does not create profile implicitly during brand update | PASS |
| Business Brain retrieves Brand DNA | PASS |
| Business Brain publishes `BrandProfileUpdated` | PASS |
| In-memory store remains bootstrap-only | PASS |
| No database access | PASS |
| `UpdateBrandProfileUseCase` exists | PASS |
| `GetBrandProfileUseCase` exists | PASS |
| Application coordinates Business Brain via contract | PASS |
| Application does not store brand data directly | PASS |
| `BrandProfileUpdated` event is publishable | PASS |
| Event Bus does not persist events | PASS |
| `BusinessProfileCreated` from Slice-001 still works | PASS |

---

## Architecture Risk Review

| Risk | Assessment |
|---|---|
| **Brand domain model drift** | Low — parallel types (BrandDNA/BrandDNAPayload) require manual sync. See L-001. |
| **contracts/domain payload sync** | Low — BrandVoice and BrandVoicePayload are independently defined. Must be kept in sync. See L-001. |
| **Business Twin snapshot mapping** | Clean. Brand mapping is explicit field-by-field, not a spread. New fields must be added manually to the mapping — expected behavior at this stage. |
| **Brand update behavior** | Correct — update requires existing profile. No implicit create. Architecture enforces the "understand first, then enrich" pattern. |
| **Future API integration** | Use cases accept commands/queries with `BrandDNA` from domain. Clean interface for API controllers. No risk. |
| **Future UI integration** | `BrandVoice` union is well-defined (7 values) — maps directly to UI option controls. `BrandDNA` is flat — easy to form-bind. No risk. |
| **Future Content/Campaign integration** | `BrandDNA` is present in `BusinessTwinSnapshot.brand` — available to Decision Brain for content and campaign generation via `getBusinessContext()`. Good foundation. |

---

## Final Decision

**APPROVED**

| Target | Result |
|---|---|
| Critical = 0 | ✅ 0 |
| High = 0 | ✅ 0 |
| Medium = 0 | ✅ 0 |
| Audit Score ≥ 95 | ✅ 97 / 100 |

**Slice-002 Backend/Runtime: COMPLETE**

The Brand DNA slice is architecturally clean, type-safe across all 5 packages, and correctly extends Slice-001 without breaking it. The `business/index.ts` dead code (L-002) should be deleted in the next Codex cycle — it is the most concrete action item from this audit.

Proceed to: Next slice (Offer Profile, Customer Profile, or Goals) as per the sprint plan.
