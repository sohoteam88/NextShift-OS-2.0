# DNA Health Migration Spec

This is a specification review only. No code changes were made for this phase.

## 1. Dependency Graph

Current DNA Health path:

```text
DNAHealthCard
  -> GET /api/v1/brand-dna/health
  -> getBrandDNAHealth(userId)
  -> validateBrandDNA(dna)
  -> scoreIdentity / scoreAudience / scoreMessaging / scoreContent / scoreOffer / scoreVisual
  -> mapLegacyProfileToDNA(...)
  -> BrandProfile table
  -> fallback: user.metadata.brand_profile
```

Advisor path:

```text
BrandDNAStudio
  -> useBrandDNA()
  -> get /api/v1/brand-dna
  -> getAdvisorRecommendations(health)
  -> DNAHealthScore
```

Write path:

```text
BrandDNAStudio
  -> saveBrandDNA / regenerateBrandDNA / publishBrandDNA / restoreVersion
  -> BrandProfile table
  -> user.metadata.brand_profile
  -> user.metadata.brand_dna_versions
```

## 2. Health Calculation Inventory

Exact score sources:

- `identityClarity`
  - `brandName` = +25
  - `personalName` = +25
  - `brandPositioning` = +30
  - `slogan` = +20

- `audienceClarity`
  - `targetAudience` = +40
  - `audiencePainPoints` present = +25
  - `audienceGoals` present = +20
  - `audienceObjections` present = +15

- `messagingClarity`
  - `coreMessage` = +40
  - `uniqueAngle` = +30
  - `elevatorPitch` = +30

- `contentClarity`
  - `contentTone` present = +20
  - `contentPillars`
    - 0 = +0
    - 1-2 = +20
    - 3+ = +40
  - `storytellingStyle` present = +40

- `offerClarity`
  - `primaryOffer` = +40
  - `secondaryOffer` = +20
  - `transformationPromise` = +40

- `visualClarity`
  - `brandColors.length >= 2` = +30
  - `profileImagePrompt` = +35
  - `coverBannerPrompt` = +35

Overall score:

- `validateBrandDNA()` uses weighted composition across the six dimensions.

## 3. Data Sources

Required for health parity:

- `BrandProfile`
- `user.metadata.brand_profile` as fallback for unmigrated users

Not required for health calculation itself, but still relevant to the broader DNA domain:

- `brandInterview` for regeneration input
- `user.metadata.brand_dna_versions` for version restore/history

Conclusion:

- DNA Health migration does not need a new canonical data source.
- It needs a projection layer that reads the same underlying data and reproduces the same scoring results.

## 4. Projection Contract

Proposed contract for Brand Intelligence:

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

Notes:

- `overallScore` must match the current health route output.
- `isComplete` should preserve the current threshold behavior.
- `nextRecommendation` should preserve the first recommendation fallback.
- `categoryScores` should align to the existing six DNA dimensions.

## 5. UI Contract

Brand Intelligence Health panel should preserve the current user-facing meaning:

- Health Overview
- Category Scores
- Improvement Recommendations

Parity requirements for the new panel:

- same score values
- same completeness threshold
- same recommendation ordering
- same low-data behavior

## 6. Migration Difficulty Matrix

| Area | Difficulty | Reason |
| --- | --- | --- |
| UI | MEDIUM | A new panel must match the current DNA health affordances without changing user expectations. |
| Projection | MEDIUM | The scoring can be replicated, but it must stay numerically identical. |
| Services | MEDIUM | Health read logic can move cleanly, but the legacy route must remain stable during migration. |
| Data | LOW | No schema migration is required for the health surface. |

## 7. Parity Requirements

The following must remain identical after migration:

- the six score dimensions
- the weighted overall score
- `isComplete` threshold behavior
- recommendation ordering
- low-data fallback behavior
- current `BrandDNAStudio` behavior until the migration cutover

Also preserve:

- `BrandDNAStudio` still works during migration
- Advisor recommendations still derive from the same health score until Advisor migrates
- `brand-dna` API remains stable until a deliberate consumer cutover

## 8. Recommended Implementation Plan

1. Introduce a Brand Intelligence health projection that mirrors `validateBrandDNA()`.
2. Add a health-specific UI panel inside `/brand-builder/intelligence`.
3. Keep `BrandDNAStudio` and `/api/v1/brand-dna/health` untouched initially.
4. Compare old and new outputs with snapshot tests before switching consumers.
5. Migrate the health card first.
6. Only after parity is proven, move Advisor and Regeneration in later phases.

## Bottom Line

This migration is a parity-sensitive refactor, not a data migration.

The safest path is to duplicate the scoring contract first, prove it matches the existing DNA health outputs, and only then cut consumers over to Brand Intelligence.
