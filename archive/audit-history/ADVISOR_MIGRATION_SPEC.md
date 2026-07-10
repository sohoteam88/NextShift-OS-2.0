# Advisor Migration Spec

This is a specification review only. No code changes were made.

## 1. Dependency Graph

Current runtime chain:

```text
BrandDNAStudio
  -> useBrandDNA()
  -> GET /api/v1/brand-dna
  -> brandDnaService.getBrandDNA(userId)
  -> validateBrandDNA(dna)
  -> getAdvisorRecommendations(health)
  -> Advisor UI
```

Current advisor authority:

- `BrandDnaAdvisor.getAdvisorRecommendations()`
- fed by `DNAHealthScore`
- rendered inside `BrandDNAStudio`

Planned Brand Intelligence chain:

```text
Advisor UI
  -> useBrandAdvisor()
  -> BrandAdvisorProjection
  -> BrandAdvisorSnapshot
  -> Advisor authority inside Brand Intelligence
```

## 2. Recommendation Inventory

Current advisor recommendations come from `getAdvisorRecommendations(health)` and are driven by the six health dimensions:

- `identityClarity`
- `audienceClarity`
- `messagingClarity`
- `contentClarity`
- `offerClarity`
- `visualClarity`

Behavior by source:

- `Strengths`
  - derived from the sections that score high in `validateBrandDNA()`
  - currently implicit in the "all good" branch and the absence of warnings

- `Weaknesses`
  - derived from health dimensions below threshold
  - currently expressed through recommendation items and body copy

- `Blind Spots`
  - derived from `missingFields` in `DNAHealthScore`
  - currently implicit in the validator output

- `Recommendations`
  - produced by `BrandDnaAdvisor`
  - ordered by priority

- `Priority Actions`
  - direct next-step actions with routes, such as `/brand-builder/profile` or `/content-engine`

## 3. Health Dependency

`BrandHealthSnapshot` should be treated as:

- **Required** for the new Brand Intelligence advisor module

Reason:

- Advisor recommendations are already health-driven.
- The new advisor should not recalculate health independently if Brand Intelligence already owns the health projection.

For the current codebase:

- Brand Health is still calculated by `validateBrandDNA()`
- advisor migration must preserve that exact behavior through a projection adapter

## 4. Data Sources

Required today:

- `BrandProfile`
- `user.metadata.brand_profile` fallback for older users

Not required for advisor scoring itself:

- `brandInterview`
- `brand_dna_versions`
- metadata version snapshots

Those support other brand operations, but current advisor recommendations do not need them to preserve parity.

## 5. Projection Contract

Proposed future contract:

```ts
export interface BrandAdvisorSnapshot {
  strengths: string[];
  weaknesses: string[];
  blindSpots: string[];
  recommendations: Recommendation[];
  priorityActions: Action[];
}
```

Recommended shape:

- `strengths`
  - high-confidence sections from the health projection

- `weaknesses`
  - low-scoring health sections

- `blindSpots`
  - missing fields and incomplete sections

- `recommendations`
  - advisor output ordered by priority

- `priorityActions`
  - the next best action list, including route targets

## 6. Migration Difficulty Matrix

| Area | Difficulty | Reason |
| --- | --- | --- |
| UI | MEDIUM | The advisor card and recommendation list are visible and user-facing, so copy and ordering must stay stable. |
| Projection | MEDIUM | The recommendation logic is simple, but it is tied to health parity and cannot drift numerically or semantically. |
| Services | LOW | The logic is rule-based and can be moved cleanly into a new projection/service pair. |
| Data | LOW | No schema changes are required. The same BrandProfile-backed data is enough. |

## 7. Parity Requirements

The following must remain identical after migration:

- recommendation ordering
- threshold behavior
- next-step route targets
- low-data / incomplete-profile behavior
- no regression in the "all good" path
- copy meaning for strengths / weaknesses / next actions

Also preserve:

- the advisor must still reflect the same brand health scoring contract
- `BrandDNAStudio` must keep working until the advisor UI is cut over
- Brand Intelligence must not introduce a second recommendation authority

## 8. Migration Plan

### Phase 1

Create `BrandAdvisorSnapshot` and a projection that reads `BrandHealthSnapshot`.

Goal:

- establish the canonical advisor contract without changing UI behavior

### Phase 2

Add the Brand Intelligence advisor UI.

Goal:

- surface advisor recommendations inside `/brand-builder/intelligence`
- keep the output identical to the current DNA advisor

### Phase 3

Cut over advisor consumers from `BrandDNAStudio` to Brand Intelligence.

Goal:

- make Brand Intelligence the authority for advisor output
- leave BrandDNAStudio in place until parity is verified

## Final Recommendation

Do not migrate Advisor directly from `BrandDNAStudio` UI code.

Instead:

1. reuse the new health projection
2. build a dedicated advisor projection on top of it
3. mirror current recommendation ordering and copy
4. move the UI only after the projection matches current output

That is the lowest-risk path and it matches the way V6.4G was introduced.
