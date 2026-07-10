# Regeneration Migration Spec

This is a specification review only. No code changes were made.

## 1. Dependency Graph

Current runtime chain:

```text
BrandDNAStudio
  -> useRegenerateDNA()
  -> POST /api/v1/brand-dna/regenerate
  -> requireAuthApi()
  -> prisma.brandInterview.findFirst(latest extracted/confirmed interview)
  -> brandDnaService.regenerateBrandDNA(userId, interviewId)
  -> generateBrandDNA(extractedProfile)
  -> merge with current BrandDNA
  -> saveBrandDNA()
  -> BrandProfile upsert
  -> metadata.brand_profile update
  -> metadata.brand_dna_versions snapshot append
  -> regeneration result
```

Authority today:

- `brandDnaService.regenerateBrandDNA()`
- backed by `generateBrandDNA(...)`
- writes through `saveBrandDNA()`

## 2. Regeneration Types

Supported effective operations today:

- Identity
  - `brandName`
  - `brandPositioning`
  - `slogan`

- Audience
  - `targetAudience`

- Offer
  - `transformationPromise`

- Messaging
  - `coreMessage`

- Content Pillars
  - `contentTone`
  - `contentPillars`

- Full Regeneration
  - current runtime button is effectively full regeneration from latest extracted interview

Important nuance:

- the service does not regenerate every field from scratch
- it merges generated fields into the current DNA and preserves untouched fields such as `personalName`, `uniqueAngle`, `elevatorPitch`, and `visual`

## 3. Input Sources

Classification:

- `BrandProfile`
  - `Required`
  - current DNA baseline comes from `getBrandDNA()`

- `brandInterview`
  - `Required`
  - regeneration cannot run without latest extracted/confirmed interview

- `BrandHealthSnapshot`
  - `Optional`
  - not required for regeneration authority today
  - could be used later for UX guidance or warnings

- `BrandAdvisorSnapshot`
  - `Not Used`
  - advisor does not drive regeneration today

- `brand_dna_versions`
  - `Required` for safety
  - not required to generate output, but required to preserve rollback safety after mutation

## 4. Output Contract

Recommended future contract:

```ts
export interface BrandRegenerationSnapshot {
  before: BrandDNA;
  after: BrandDNA;
  changedFields: string[];
  recommendations: string[];
}
```

Recommended semantics:

- `before`
  - the current Brand DNA before regeneration

- `after`
  - the merged regenerated DNA after applying interview-derived output

- `changedFields`
  - exact fields changed by regeneration, for example:
  - `identity.brandName`
  - `identity.brandPositioning`
  - `messaging.coreMessage`
  - `content.contentPillars`

- `recommendations`
  - optional user-facing notes explaining what changed and what should be reviewed

## 5. Version Dependency Analysis

Version restore and version history are required for regeneration safety.

Reason:

- regeneration is a mutating operation
- it rewrites canonical Brand DNA data
- current implementation already appends snapshots into `metadata.brand_dna_versions`
- safe migration requires preserving this rollback behavior

Conclusion:

- regeneration should not migrate without a version-safe path
- version history is not just adjacent UX; it is part of the safety model

## 6. Advisor Dependency Analysis

Regeneration does **not** depend on `BrandAdvisorSnapshot` today.

Current authority depends on:

- latest extracted interview
- current Brand DNA baseline
- merge rules inside `brandDnaService.regenerateBrandDNA()`

`BrandAdvisorSnapshot` could later inform warnings such as “weakest area” or “recommended regeneration target,” but that would be an enhancement, not parity behavior.

## 7. Migration Difficulty Matrix

| Area | Difficulty | Reason |
| --- | --- | --- |
| UI | MEDIUM | The current UI is a single action, but users expect it to be safe and predictable. |
| Projection | HIGH | Regeneration is mutating and needs before/after diffing rather than read-only projection only. |
| Services | HIGH | The service depends on interview extraction, merge logic, and save semantics. |
| Data | MEDIUM | No schema change is required, but canonical writes and snapshot persistence must remain intact. |
| AI | HIGH | `generateBrandDNA()` output must remain behaviorally stable and field merge logic must not drift. |

## 8. Parity Requirements

The following must remain identical after migration:

- latest valid interview selection logic
- accepted interview statuses: `extracted` and `confirmed`
- merge behavior into current DNA
- unchanged fields staying unchanged
- version increment behavior
- snapshot creation behavior
- BrandProfile write-through behavior
- metadata fallback/backward-compat behavior
- error behavior when no completed interview exists

Also preserve:

- `BrandDNAStudio` remains functional during migration
- no hidden advisor-driven mutation logic
- no regeneration without rollback safety

## 9. Migration Plan

### Phase 1

Extract a canonical regeneration service boundary into Brand Intelligence.

Goal:

- wrap the current regeneration authority without changing behavior
- define `BrandRegenerationSnapshot`

### Phase 2

Add regeneration preview/diff support.

Goal:

- expose `before`, `after`, and `changedFields`
- preserve current save semantics

### Phase 3

Cut over regeneration UI into Brand Intelligence only after snapshot and rollback parity are proven.

Goal:

- move the UX without weakening safety or merge fidelity

## 10. Final Recommendation

Do not migrate regeneration as a simple button-port.

Regeneration is the highest-risk remaining Brand DNA capability because it:

- depends on interview extraction
- mutates canonical BrandProfile data
- creates version snapshots
- merges generated output into current state

The correct path is:

1. preserve the existing service behavior exactly
2. model before/after regeneration explicitly
3. keep version restore in scope as a safety dependency
4. move UI only after service parity is proven
