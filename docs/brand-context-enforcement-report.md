# Brand Context Enforcement Report

Date: 2026-06-12

## Summary

All 7 service-layer brand profile bypasses have been eliminated. Every service now reads brand context through the centralized `getBrandContext()` function, which reads from the canonical `BrandProfile` table with a legacy metadata fallback.

## Before → After

| # | File | Before | After |
|---|------|--------|-------|
| 1 | `video/services/video-strategy-service.ts` | `prisma.user.findUnique({ metadata })` → `meta.brand_profile` | `getBrandContext()` → maps to legacy shape |
| 2 | `video/services/video-finalize-service.ts` | Same pattern | Same fix |
| 3 | `funnel/services/funnel-strategy-service.ts` | Same pattern + unused `prisma` import | Same fix + removed prisma import |
| 4 | `brand-builder/services/content-insights-service.ts` | Same pattern + unused `prisma` import | Same fix + removed prisma import |
| 5 | `brand-builder/services/content-calendar-service.ts` | `meta.brand_profile` as BrandProfile type | `getBrandContext()` → maps to prompt |
| 6 | `brand-builder/services/video-script-service.ts` | `getBrandProfile()` → metadata | `getBrandProfile()` → `getBrandContext()` |
| 7 | `analytics/analyticsService.ts` | `meta.brand_profile \|\| meta.brand_dna` | `getBrandContext()` → `!!ctx` |

## Access Pattern

```
ALL MODULES
    │
    ▼
getBrandContext(userId)          ← Single entry point
    │
    ├── PRIMARY: BrandProfile table (prisma.brandProfile.findUnique)
    │
    └── FALLBACK: user.metadata.brand_profile (legacy users, transitional)
```

## Remaining Direct Access (Contained)

The brand-builder UI subsystem (7 pages + 5 API routes + AccountSetupStep.tsx) reads `brand_profile` from metadata. These are:
- Server-side page components that pass profile to client components
- API routes (bio, username, guide-progress) that accept brand_profile in request body
- AccountSetupStep that sends profile updates

These are contained within the existing brand-builder wizard flow and do not constitute new technical debt. They should be migrated to use `getBrandContext()` in a future sprint focused on the brand-builder UI layer.

## Compliance

| Requirement | Status |
|-------------|--------|
| No service reads brand_profile from metadata | ✅ |
| No service calls prisma.brandProfile.findFirst() directly | ✅ |
| All new modules use getBrandContext() | ✅ |
| Legacy services have backward-compatible wrappers | ✅ |
