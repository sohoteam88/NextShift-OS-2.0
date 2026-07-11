# Runtime Flag Lifecycle

This document records retired runtime flag history after OS 3.5 G-series migrations.

## Retired Flags

| Flag | Module | Introduced | Graduated | Removed | Replacement |
|---|---|---:|---:|---:|---|
| `NEXT_PUBLIC_ENABLE_RUNTIME_REVENUE` | `revenue-drivers` | 2026-07-09 | OS 3.4 A3 | OS 3.5 G2a | Revenue Runtime Adapter always runs; legacy resolver remains only as runtime failure fallback. |
| `NEXT_PUBLIC_ENABLE_RUNTIME_ANALYTICS` | `analytics` | 2026-07-09 | OS 3.4 A3 | OS 3.5 G2b | Analytics Runtime Adapter always runs; legacy projection remains only as runtime failure fallback. |

## Revenue G2a Notes

- Retired production variable: `PROD_NEXT_PUBLIC_ENABLE_RUNTIME_REVENUE`
- Retired registry constant: `RUNTIME_REVENUE_FLAG`
- Retired helper: `isRuntimeRevenueEnabled`
- Retired helper file: `src/modules/revenue-drivers/runtime/runtime-revenue-flag.ts`
- Runtime construction failure fallback remains active by design; only the flag-controlled legacy-only branch was removed.

## Analytics G2b Notes

- Retired production variable: `PROD_NEXT_PUBLIC_ENABLE_RUNTIME_ANALYTICS`
- Retired registry constant: `RUNTIME_ANALYTICS_FLAG`
- Retired helper: `isRuntimeAnalyticsEnabled`
- Retired helper file: `src/modules/analytics/runtime/runtime-analytics-flag.ts`
- Runtime construction failure fallback remains active by design; only the flag-controlled legacy-only branch was removed.
