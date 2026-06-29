# CAP-001 Slice-003 Audit Report — Offer Profile

**Audit Type:** Vertical Slice Architecture Audit  
**Auditor:** Claude Code (Independent Architecture Auditor)  
**Date:** 2026-06-26  
**Capability:** CAP-001 Business Profile  
**Slice:** Slice-003 Offer Profile (backend/runtime only)

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

All four Low items carry forward from Slice-002. No new issues specific to Slice-003.

### L-001 — Parallel type hierarchy drift risk (cumulative)

**Packages:** domain, contracts

Slice-003 adds: `ProductProfile`/`ProductProfilePayload`, `ServiceProfile`/`ServiceProfilePayload`, `OfferProfile`/`OfferProfilePayload`. All pairs are structurally identical. TypeScript structural compatibility is confirmed by typecheck. The same manual-sync risk applies: when a field is added to `OfferProfile`, `ProductProfile`, or `ServiceProfile` in domain, the corresponding contracts payload types must be updated in the same commit.

The parallel hierarchy now spans three slices and seven type pairs. The sync surface is growing. No compile-time enforcement exists.

**Impact:** Low individually; growing as slices accumulate.  
**Action for Codex:** Continue the discipline of always updating domain and contracts payload types in the same commit. Consider documenting this convention explicitly in the engineering standards.

---

### L-002 — Dead code in `domain/src/business/index.ts` persists

**Package:** domain  
**Location:** `domain/src/business/index.ts`

The old `BusinessProfile` (`{ businessId, tenant, name: string, createdAt }`) and `BrandDNA` (`{ vision, mission, values, voice?: string, positioning }`) remain in this file. Neither is exported. Both have been superseded by the canonical types in `business-profile/index.ts`. The file is unreferenced.

**Impact:** None at runtime. Confusing for future developers.  
**Action for Codex:** Delete `domain/src/business/index.ts`. Deferred across three slices — escalating priority.

---

### L-003 — Event ID string concatenation now affects all three publishers

**Package:** event-bus  
**Location:** `event-bus/src/business-profile/index.ts`

All three `publish*` methods use the same string-concatenation fallback pattern:
```ts
`${input.businessId}:offer-profile-updated:${input.occurredAt}` as EventId
```

The collision window is the same millisecond for the same `businessId`. Three methods now carry this risk: `publishCreated`, `publishBrandUpdated`, `publishOfferUpdated`.

**Impact:** Near-zero at bootstrap scale.  
**Action for Codex:** Replace all three fallbacks with `crypto.randomUUID() as EventId` in a single commit before production.

---

### L-004 — `new Date().toISOString()` inline in two use cases

**Package:** application  
**Location:** `application/src/business-profile/index.ts`

Both `UpdateBrandProfileUseCase` and `UpdateOfferProfileUseCase` call `new Date().toISOString()` directly when building their requests. The pattern is now present in two places within the same file.

**Impact:** Low — functional but non-deterministic and harder to unit test.  
**Action for Codex:** Accept `updatedAt` from the command or inject a `now` function shared with `BusinessBrain`'s dependency pattern. Fix both use cases in the same commit.

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

**No new package dependencies introduced in Slice-003.** All 5 package dependency declarations are unchanged from Slice-002. ✅  
**No forbidden imports found in any Slice-003 files.** ✅

---

## Package Findings

### packages/domain

**Changes from Slice-002:** `business-profile/index.ts` extended with offer model types.

**New types:**
- `ProductProfile` — productId?, name: string, description?, category? ✅
- `ServiceProfile` — serviceId?, name: string, description?, category? ✅
- `OfferProfile` — coreOffer?, products?: readonly ProductProfile[], services?: readonly ServiceProfile[], valueProposition? ✅
- `BusinessProfile.offer?: OfferProfile` — optional offer field added ✅

**Existing models intact:**
- `BusinessIdentity`, `BusinessStage` from Slice-001 ✅
- `BrandVoice`, `BrandDNA` from Slice-002 ✅
- `BusinessProfile.brand?: BrandDNA` from Slice-002 ✅

**No competing exports:** `domain/src/business/index.ts` is still not exported from `domain/src/index.ts`. No naming collision. ✅

**Scope control:** `OfferProfile` contains descriptive fields only — `coreOffer` (text), `valueProposition` (text), products and services as structural lists. No pricing, no inventory, no CRM logic. ✅

**Domain purity:** CONFIRMED — all new types are pure interfaces. ✅

**Verdict: PASS**

---

### packages/contracts

**Changes from Slice-002:** `business-profile/index.ts` extended. `business-brain/index.ts` extended. `business-twin/index.ts` extended.

**New types in `business-profile`:**
- `ProductProfilePayload` — mirrors `domain.ProductProfile` ✅
- `ServiceProfilePayload` — mirrors `domain.ServiceProfile` ✅
- `OfferProfilePayload` — mirrors `domain.OfferProfile` ✅
- `BusinessProfileRecord.offer?: OfferProfilePayload` ✅
- `UpdateOfferProfileRequest` — businessId, tenant, offer: OfferProfilePayload, updatedAt, source ✅
- `GetOfferProfileRequest` — businessId, tenant ✅
- `OfferProfileUpdatedPayload` — businessId, offer: OfferProfilePayload, profileVersion, updatedAt ✅

**Updated `BusinessBrainContract`:**
```ts
updateOfferProfile(request: UpdateOfferProfileRequest): Promise<Result<BusinessProfileRecord>>;
getOfferProfile(request: GetOfferProfileRequest): Promise<Result<OfferProfilePayload | null>>;
```
Both new methods declared. ✅

**Updated `BusinessTwinSnapshot`:**
- `offer?: OfferContext` field added ✅

**New Business Twin context types:**
- `ProductContext` — productId?, name: string, description?, category? ✅
- `ServiceContext` — serviceId?, name: string, description?, category? ✅
- `OfferContext` — coreOffer?, products?: readonly ProductContext[], services?: readonly ServiceContext[], valueProposition? ✅

**No domain import in any contracts file.** ✅  
**Existing contract types from Slice-001 and Slice-002 unchanged.** ✅

**Verdict: PASS**

---

### packages/business-brain

**Changes from Slice-002:** `business-brain/src/business-brain/index.ts` extended with `updateOfferProfile()` and `getOfferProfile()` methods. `getBusinessContext()` extended with offer mapping.

**No new dependencies.** Package still depends on: shared, contracts, domain, event-bus. ✅

**New behavior — `updateOfferProfile()`:**
- Retrieves existing profile; returns `failure` if not found ✅
- Does NOT create profile implicitly ✅
- Spreads existing profile, overwrites `offer` and `metadata.updatedAt/source` ✅
- Saves updated profile to store ✅
- Publishes `OfferProfileUpdated` via `businessProfileEvents?.publishOfferUpdated()` ✅
- Returns `success(updatedProfile)` ✅

**New behavior — `getOfferProfile()`:**
- Retrieves profile from store ✅
- Returns `success(profile?.offer ?? null)` — correctly handles missing profile ✅

**Updated `getBusinessContext()`:**
- Slice-001 identity mapping intact ✅
- Slice-002 brand mapping intact ✅
- New offer mapping: maps `profile.offer` fields to `OfferContext` when present; omits `offer` from snapshot when undefined ✅
- `products` and `services` arrays are passed through directly — `ProductProfile[]` is structurally assignable to `ProductContext[]`; `ServiceProfile[]` is structurally assignable to `ServiceContext[]` ✅

**Type compatibility:** `BusinessBrain` returns `Result<BusinessProfile>` where contract expects `Result<BusinessProfileRecord>`. `BusinessProfile` (with `offer?: OfferProfile`) is structurally assignable to `BusinessProfileRecord` (with `offer?: OfferProfilePayload`). Similarly, `Result<OfferProfile | null>` is assignable to `Result<OfferProfilePayload | null>`. Zero typecheck errors confirm. ✅

**In-memory store unchanged. No database access.** ✅

**Verdict: PASS**

---

### packages/event-bus

**Changes from Slice-002:** `business-profile/index.ts` extended. `BusinessProfileEventPublisher` gains `publishOfferUpdated()` method.

**New additions:**
- `OFFER_PROFILE_UPDATED_EVENT_TYPE = "OfferProfileUpdated"` ✅
- `OfferProfileUpdatedEvent` type — narrows `eventType` to literal constant ✅
- `PublishOfferProfileUpdatedInput` interface ✅
- `publishOfferUpdated()` method — builds event, publishes via `eventBus.publish()`, returns typed event ✅

**Backward compatibility:**
- `publishCreated()` from Slice-001 unchanged ✅
- `publishBrandUpdated()` from Slice-002 unchanged ✅
- `BUSINESS_PROFILE_CREATED_EVENT_TYPE` and `BRAND_PROFILE_UPDATED_EVENT_TYPE` unchanged ✅

**Event payload:** `OfferProfileUpdatedPayload` contains `{ businessId, offer: OfferProfilePayload, profileVersion, updatedAt }` — structural data only. ✅

**Event ID fallback** pattern carried forward (see L-003).

**Verdict: PASS**

---

### packages/application

**Changes from Slice-002:** `business-profile/index.ts` extended with offer use cases, commands, and queries.

**New additions:**
- `UpdateOfferProfileCommand` — commandType `"UpdateOfferProfile"`, offer: OfferProfile ✅
- `UpdateOfferProfileResult` — profile: BusinessProfile ✅
- `GetOfferProfileQuery` — queryType `"GetOfferProfile"` ✅
- `GetOfferProfileResult` — offer: OfferProfile | null ✅
- `UpdateOfferProfileUseCase` — delegates to `businessBrain.updateOfferProfile()` ✅
- `GetOfferProfileUseCase` — delegates to `businessBrain.getOfferProfile()` ✅

**Contract compliance:**
- All six use cases (Slices 001–003) accept `BusinessBrainContract` ✅
- No offer data stored directly in application ✅
- No Business Brain bypass ✅

**Slice-001 and Slice-002 use cases unchanged.** ✅

**`mapActorToSource` module-level function** shared across all six use cases. ✅

**`UpdateOfferProfileUseCase` calls `new Date().toISOString()` directly** (see L-004, now affecting both `UpdateBrandProfileUseCase` and `UpdateOfferProfileUseCase`).

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
| `OfferProfile` exists in `domain/src/business-profile/index.ts` | PASS |
| `ProductProfile` exists in `domain/src/business-profile/index.ts` | PASS |
| `ServiceProfile` exists in `domain/src/business-profile/index.ts` | PASS |
| `BusinessProfile.offer?: OfferProfile` added | PASS |
| No competing exported `OfferProfile`/`ProductProfile`/`ServiceProfile` elsewhere | PASS |
| Slice-001 identity model intact | PASS |
| Slice-002 brand model intact | PASS |
| `contracts` does not import `domain` | PASS |
| No contracts↔domain circular dependency | PASS |
| Application uses `BusinessBrainContract`, not concrete class | PASS |
| No new package dependencies introduced | PASS |
| No forbidden imports in any Slice-003 file | PASS |
| Scope control — no pricing, inventory, CRM, campaign, content generation | PASS |
| `ProductProfilePayload`, `ServiceProfilePayload`, `OfferProfilePayload` structural and domain-free | PASS |
| `UpdateOfferProfileRequest` exists in contracts | PASS |
| `GetOfferProfileRequest` exists in contracts | PASS |
| `OfferProfileUpdatedPayload` exists in contracts | PASS |
| `BusinessProfileRecord.offer?: OfferProfilePayload` added | PASS |
| `BusinessBrainContract` includes `updateOfferProfile` and `getOfferProfile` | PASS |
| `OfferContext`, `ProductContext`, `ServiceContext` exist in contracts business-twin | PASS |
| `BusinessTwinSnapshot.offer?: OfferContext` added | PASS |
| Offer mapped into Business Twin snapshot | PASS |
| Slice-001 identity snapshot mapping intact | PASS |
| Slice-002 brand snapshot mapping intact | PASS |
| Business Brain requires existing profile before Offer update | PASS |
| Business Brain does not create profile implicitly during offer update | PASS |
| Business Brain retrieves Offer Profile | PASS |
| Business Brain publishes `OfferProfileUpdated` | PASS |
| In-memory store remains bootstrap-only | PASS |
| No database access | PASS |
| `UpdateOfferProfileUseCase` exists | PASS |
| `GetOfferProfileUseCase` exists | PASS |
| Application coordinates Business Brain via contract | PASS |
| Application does not store offer data directly | PASS |
| `OfferProfileUpdated` event publishable | PASS |
| `BusinessProfileCreated` from Slice-001 still works | PASS |
| `BrandProfileUpdated` from Slice-002 still works | PASS |

---

## Architecture Risk Review

| Risk | Assessment |
|---|---|
| **Offer domain model drift** | Low — parallel types (OfferProfile/OfferProfilePayload) require manual sync. See L-001. |
| **contracts/domain payload sync** | Growing — 7 parallel type pairs now across 3 slices. See L-001. |
| **Business Twin snapshot mapping** | Clean. Offer arrays (`products[]`, `services[]`) pass through directly. `ProductProfile[]` → `ProductContext[]` structural compatibility confirmed. |
| **Offer update behavior** | Correct — requires existing profile. No implicit create. Consistent with Slice-002 brand pattern. |
| **Future API integration** | `UpdateOfferProfileCommand.offer: OfferProfile` is a flat, clean structure. Easy to deserialize from JSON body at the API layer. |
| **Future UI integration** | `OfferProfile` has clearly bounded fields (coreOffer text, products list, services list, valueProposition text). Maps cleanly to form inputs. No complexity. |
| **Future CRM integration** | `OfferProfile` is available via `BusinessTwinSnapshot.offer` — accessible to Decision Brain for CRM workflows. No coupling needed. |
| **Future Campaign/Content integration** | `OfferProfile.coreOffer`, `valueProposition`, and the products/services list provide the raw material for campaign and content generation via the Business Twin snapshot. Well-positioned. |

---

## Cumulative Low Item Status (across CAP-001 Slices 001–003)

| ID | First raised | Status | Action |
|---|---|---|---|
| L-001 | Slice-001 | Open — growing | Mirror all new domain field additions in contracts payloads |
| L-002 | Slice-001 | Open — escalating | Delete `domain/src/business/index.ts` (3 slices overdue) |
| L-003 | Slice-001 | Open — now 3 publishers | Replace all event ID fallbacks with `crypto.randomUUID()` |
| L-004 | Slice-002 | Open — now 2 use cases | Fix `new Date()` in `UpdateBrandProfileUseCase` and `UpdateOfferProfileUseCase` |

---

## Final Decision

**APPROVED**

| Target | Result |
|---|---|
| Critical = 0 | ✅ 0 |
| High = 0 | ✅ 0 |
| Blocking Medium = 0 | ✅ 0 |
| Audit Score ≥ 95 | ✅ 97 / 100 |

**Slice-003 Backend/Runtime: COMPLETE**

The Offer Profile slice is architecturally clean, type-safe, and extends Slices 001 and 002 without breaking either. The `BusinessTwinSnapshot` now carries identity, brand, and offer context — the Business Profile is taking shape as a comprehensive business understanding layer.

**Recommendation:** Before Slice-004, Codex should resolve L-002 (delete `domain/src/business/index.ts`) and L-004 (fix `new Date()` in both update use cases). These are small, targeted cleanups that will keep the codebase tidy as the slice count grows.

Proceed to: Slice-004 (Customer Profile or Business Goals) as per the sprint plan.
