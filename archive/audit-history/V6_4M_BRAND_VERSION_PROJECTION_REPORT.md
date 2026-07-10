# V6.4M Brand Version Projection Report

## 1. Files Created

- `src/modules/brand-intelligence/types/brand-version.ts`
- `src/modules/brand-intelligence/projections/brand-version-history-projection.ts`
- `src/modules/brand-intelligence/services/version-history-service.ts`
- `src/modules/brand-intelligence/hooks/useBrandVersionHistory.ts`
- `src/app/api/v1/brand-intelligence/versions/route.ts`
- `audit/V6_4M_BRAND_VERSION_PROJECTION_REPORT.md`

## 2. Files Modified

- `src/modules/brand-intelligence/components/IntelligenceOverview.tsx`
- `src/modules/brand-intelligence/index.ts`

## 3. Projection Contract

Implemented:

```ts
interface BrandVersionSnapshot {
  id: string;
  version: number;
  createdAt: string;
  label: string;
  summary: string;
  changes: string[];
  data: BrandProfile;
}

interface BrandVersionHistorySnapshot {
  versions: BrandVersionSnapshot[];
  currentVersionId: string | null;
  totalVersions: number;
  retentionLimit: number;
}
```

Current implementation keeps `changes` as an empty array and generates a minimal `summary`. That is intentional. Rich diffs and user-readable summaries are deferred to `V6.4N`.

## 4. Data Source Verification

The projection reads from:

- `brandDnaService.getVersions()` for history
- `brandDnaService.getBrandDNA()` for current version mapping

It does not modify:

- `saveBrandDNA()`
- `createSnapshot()`
- `restoreVersion()`
- `brand_dna_versions` storage behavior

## 5. Version Parity Verification

Preserved from current implementation:

- version number
- createdAt
- snapshot ordering
- retention limit = `20`

Ordering remains the same as `brandDnaService.getVersions()`. No reversal or re-sorting was introduced.

Current version mapping is derived by matching live `BrandDNA.meta.version` against projected version entries.

## 6. Build Result

`pnpm build` passed.

## 7. Type-check Result

`pnpm type-check` passed.

## 8. Risk Assessment

Low.

Why:

- this is read-model only
- storage remains unchanged
- restore remains unchanged
- BrandDNAStudio remains unchanged

Residual limitation:

- `summary` and `changes[]` are still placeholder-quality until `V6.4N`
- the Intelligence Overview only surfaces count and current version, not the full history table

Net result:

Brand Intelligence now owns the canonical version history projection layer, while `brandDnaService` remains the execution authority.
