# V6.4G Brand Health Projection Report

This phase implemented the first real intelligence capability inside Brand Intelligence: brand health.

## Files Created

- `src/modules/brand-intelligence/projections/brand-health-projection.ts`
- `src/modules/brand-intelligence/services/health-service.ts`
- `src/modules/brand-intelligence/hooks/useBrandHealth.ts`
- `src/app/api/v1/brand-intelligence/health/route.ts`

## Files Modified

- `src/modules/brand-intelligence/types/brand-intelligence.ts`
- `src/modules/brand-intelligence/components/IntelligenceOverview.tsx`
- `src/modules/brand-intelligence/index.ts`

## Projection Contract

The new contract is:

```ts
export interface BrandHealthSnapshot {
  overallScore: number;
  isComplete: boolean;
  nextRecommendation: string | null;
  categoryScores: {
    identity: number;
    audience: number;
    messaging: number;
    content: number;
    offer: number;
    visual: number;
  };
  missingFields: string[];
  recommendations: string[];
}
```

The health panel now consumes this snapshot through `useBrandHealth()`.

## Score Parity Verification

The projection mirrors the existing `validateBrandDNA()` scoring logic:

- identity
- audience
- messaging
- content
- offer
- visual

The following behaviors are preserved:

- per-category scoring weights
- overall score weighting
- `isComplete` threshold at `>= 80`
- recommendation generation order
- first recommendation fallback via `nextRecommendation`

Result:

- projection output is aligned with the current DNA health behavior
- `BrandDNAStudio` scoring logic remains unchanged

## Data Source Verification

Primary source:

- `BrandProfile`

Fallback source:

- `user.metadata.brand_profile`

No schema changes were made.

The projection does not require `brand_dna_versions` or `brandInterview` for health calculation. Those remain support data for later regeneration/history phases.

## UI Result

The `Brand Intelligence` page now shows:

- overall score
- identity score
- audience score
- messaging score
- content score
- offer score
- visual score
- improvement recommendation

The remaining panels still use the shell contract for:

- Advisor
- Regeneration
- Version History

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

- health now has a real runtime projection and API surface
- scoring parity is preserved by mirroring the existing DNA validation rules
- only the health capability moved
- Advisor, Regeneration, Version History, and BrandDNAStudio were left untouched

## Bottom Line

V6.4G is complete.

Brand Intelligence now has a real `BrandHealthSnapshot` projection and the health panel uses it. The next phase can move the health UX cutover more aggressively, but the scoring contract itself is now in place.
