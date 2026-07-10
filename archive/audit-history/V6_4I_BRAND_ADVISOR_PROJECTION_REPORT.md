# V6.4I Brand Advisor Projection Report

This phase implemented the canonical Brand Advisor projection inside Brand Intelligence.

## Files Created

- `src/modules/brand-intelligence/projections/brand-advisor-projection.ts`
- `src/modules/brand-intelligence/services/advisor-service.ts`
- `src/modules/brand-intelligence/hooks/useBrandAdvisor.ts`
- `src/app/api/v1/brand-intelligence/advisor/route.ts`

## Files Modified

- `src/modules/brand-intelligence/types/brand-intelligence.ts`
- `src/modules/brand-intelligence/components/IntelligenceOverview.tsx`
- `src/modules/brand-intelligence/index.ts`

## Projection Contract

The new contract is:

```ts
export interface BrandAdvisorSnapshot {
  strengths: string[];
  weaknesses: string[];
  blindSpots: string[];
  recommendations: BrandAdvisorRecommendation[];
  priorityActions: BrandAdvisorAction[];
}
```

Supporting types:

- `BrandAdvisorRecommendation`
- `BrandAdvisorAction`

## Health Dependency Verification

The advisor projection consumes `BrandHealthSnapshot`.

Dependency chain:

```text
BrandProfile
  -> BrandHealthProjection
  -> BrandHealthSnapshot
  -> BrandAdvisorProjection
  -> BrandAdvisorSnapshot
```

No raw brand-field recalculation is needed when health projection is available.

## Recommendation Parity Verification

The advisor projection mirrors the current `BrandDnaAdvisor.getAdvisorRecommendations(health)` behavior:

- same threshold behavior
- same low-data behavior
- same ordering discipline
- same copy meaning
- same action route intent

Canonical route targets are now limited to:

- `/brand-builder/profile`
- `/content-engine`
- `/brand-builder/intelligence`

No advisor output emits retired or non-canonical routes.

## Canonical Route Verification

Verified that advisor actions do not point at:

- `/brand-dna`
- `/ai`
- `/customers`
- `/team/growth`
- `/crm-center`

## UI Result

`IntelligenceOverview` now shows real advisor summary data when available:

- Top Recommendation
- Priority Actions
- Weakest Area
- Blind Spots Count

The advisor shell placeholder was kept as fallback scaffolding, but the page now renders real advisor information from the projection.

## Build Result

- `pnpm type-check` passed
- `pnpm build` passed

Build still reports the repository's existing warnings:

- missing `posthog-js`
- existing AI hook lint warnings
- Prisma static-generation warnings from empty `DATABASE_URL`

## Risk Assessment

Low to medium.

Why:

- the advisor now has a canonical projection and API surface
- it depends on the already-migrated health projection
- `BrandDNAStudio` remains unchanged
- no regeneration or version-history code was touched

## Bottom Line

V6.4I is complete.

Brand Intelligence now owns a real `BrandAdvisorSnapshot` projection, and the advisor summary is visible in the Brand Intelligence shell without changing `BrandDNAStudio`.
