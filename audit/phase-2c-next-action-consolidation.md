# Phase 2c — Next-Action Engine Consolidation Report

**Date:** 2026-06-14
**Scope:** Merge 3 recommendation/next-action engines into 1 canonical service
**Status:** ✅ Complete

---

## Before: 3 Engines, 3 Input Types, 3 Output Shapes

| # | File | Function | Input | Output |
|---|---|---|---|---|
| 1 | `funnel/services/funnel-health-service.ts` | `getNextBestAction(scores)` | `{ completeness, realMaterialUsed, diversity, ctaConsistency, performance }` | `{ action, reason, route }` |
| 2 | `funnel-builder/funnelAdvisor.ts` | `getNextBestAction(health)` | `FunnelHealth` (builder) | `string` |
|   | | `getFunnelAdvisor(health)` | `FunnelHealth` (builder) | `string[]` |
| 3 | `funnel-os/funnelNextActionEngine.ts` | `getNextAction(funnelType, counts...)` | `BusinessFunnelType` + 5 counters | `{ action, expectedImpact, route }` |

---

## After: 1 Canonical Engine

**Canonical location:** `src/modules/funnel/services/funnel-health-service.ts`

```
funnelHealthService
├── getNextBestAction(scores)           → { action, reason, route }         (canonical)
├── getPackageAdvisor(health)           → { recommendations, nextAction }   (adapter — ex funnelAdvisor)
└── getActivityNextAction(type, counts) → { action, expectedImpact, route } (adapter — ex funnelNextActionEngine)
```

### Adapter Design

| Canonical Method | Wraps | Input Mapping | Output Mapping |
|---|---|---|---|
| `getPackageAdvisor(health)` | `funnelAdvisor.getNextBestAction` + `getFunnelAdvisor` | Takes `BuilderFunnelHealth` directly | Returns `{ recommendations: string[], nextAction: string }` |
| `getActivityNextAction(...)` | `funnelNextActionEngine.getNextAction` | Takes same params | Returns `FunnelNextAction` unchanged |

---

## Changed Files (6)

| File | Change |
|---|---|
| `src/modules/funnel/services/funnel-health-service.ts` | Added `getPackageAdvisor()` + `getActivityNextAction()` methods |
| `src/modules/funnel-builder/funnelAdvisor.ts` | **Deprecated re-export** — delegates to canonical |
| `src/modules/funnel-os/funnelNextActionEngine.ts` | **Deprecated re-export** — delegates to canonical |
| `src/modules/funnel-builder/funnelBuilderService.ts` | Updated to use `funnelHealthService.getPackageAdvisor(health).nextAction` |
| `src/modules/funnel-builder/components/FunnelBuilderDashboard.tsx` | Removed dead import of `getNextBestAction` |
| `src/app/api/v1/funnel-os/route.ts` | Updated to use `funnelHealthService.getActivityNextAction(...)` |

---

## Verification

```
$ pnpm type-check
✓ tsc --noEmit — 0 errors

$ pnpm build
✓ Compiled successfully in 5.8s
✓ Generating static pages (208/208)
```

---

## Architecture Diagram

```
Before (3 scattered):                        After (1 canonical):

 funnel/                                     funnel/
 └── services/                               └── services/
      └── funnel-health-service.ts                └── funnel-health-service.ts  ← CANONICAL
           └── getNextBestAction()                │    ├── getNextBestAction()      (DB-backed scores)
                                                   │    ├── getPackageAdvisor()      (adapter)
 funnel-builder/                                   │    └── getActivityNextAction()  (adapter)
 └── funnelAdvisor.ts ─────────────────────────────┤         ▲
      ├── getNextBestAction()                       │         │ imports types
      └── getFunnelAdvisor()                        │    ┌────┴──────────────────────┐
                                                   │    │ funnel-builder/types       │
 funnel-os/                                        │    │ funnel-os/types            │
 └── funnelNextActionEngine.ts ────────────────────┘    │ funnel-context/types       │
      └── getNextAction()                              └────────────────────────────┘

Deprecated (re-exports only):
  funnel-builder/funnelAdvisor.ts        → delegates to canonical
  funnel-os/funnelNextActionEngine.ts    → delegates to canonical
```

---

## Migration Risk

| Risk | Status |
|---|---|
| API response contracts broken | ✅ None — `FunnelNextAction` shape preserved; `getPackageAdvisor` returns a superset (`{ recommendations, nextAction }`) with old functions extracting individual fields |
| UI behavior changed | ✅ None — same priority chains, same thresholds, same actions |
| DB schema changed | ✅ None |
| Dead imports | ✅ Cleaned — removed unused `getNextBestAction` import from `FunnelBuilderDashboard.tsx` |
| Backward compatibility | ✅ Full — deprecated re-exports preserve original function signatures |
