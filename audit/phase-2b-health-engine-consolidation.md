# Phase 2b — Health Engine Consolidation Report

**Date:** 2026-06-14  
**Scope:** Merge 3 health scoring engines into 1 canonical service  
**Status:** ✅ Complete

---

## Before: 3 Engines, 3 Types, 3 Locations

| # | File | Function | Input | Output Type | Consumers |
|---|---|---|---|---|---|
| 1 | `funnel/services/funnel-health-service.ts` | `calculate(funnelId, user)` | DB funnel | `FunnelHealthScore` (5 dims + status + action) | `/api/v1/funnel/funnels/[id]/health` |
| 2 | `funnel-builder/funnelHealthValidator.ts` | `validateFunnelHealth(pkg)` | `FunnelPackage` | `FunnelHealth` (7 dims + missingItems + recs) | `funnelBuilderService`, `FunnelBuilderDashboard`, `funnelAdvisor` |
| 3 | `funnel-os/funnelHealthService.ts` | `calculateFunnelHealth(counts...)` | Counters | `FunnelHealth` (5 dims + overallScore) | `/api/v1/funnel-os` |

### Scoring Dimension Comparison

| Dimension | Engine 1 (funnel) | Engine 2 (funnel-builder) | Engine 3 (funnel-os) |
|---|---|---|---|
| Completeness | ✅ sections present | — | — |
| Real material | ✅ case studies | — | — |
| Diversity | ✅ quality gate | — | — |
| CTA consistency | ✅ target alignment | ✅ CTA presence | — |
| Performance | ✅ conversion rate | — | — |
| Audience fit | — | ✅ headline quality | — |
| Offer clarity | — | ✅ benefits count | — |
| Trust elements | — | ✅ credibility | — |
| Follow-up | — | ✅ email seq length | ✅ lead presence |
| Traffic | — | ✅ ad angle count | ✅ funnel+lead presence |
| Content volume | — | — | ✅ content/video count |
| Conversion | — | — | ✅ lead→customer ratio |
| Pipeline | — | — | ✅ lead presence |

---

## After: 1 Canonical Engine

**Canonical location:** `src/modules/funnel/services/funnel-health-service.ts`

```
funnelHealthService
├── calculate(funnelId, user)           → FunnelHealthScore   (canonical — unchanged)
├── evaluatePackage(pkg)                → BuilderFunnelHealth  (adapter — ex funnel-builder)
└── evaluateActivity(counts...)         → OsFunnelHealth       (adapter — ex funnel-os)
```

### Consumer Migration

| Consumer | Before | After |
|---|---|---|
| `/api/v1/funnel/funnels/[id]/health` | `funnelHealthService.calculate(...)` | Unchanged (already canonical) |
| `funnelBuilderService.ts` | `validateFunnelHealth(pkg).score` | `funnelHealthService.evaluatePackage(pkg).score` |
| `FunnelBuilderDashboard.tsx` | `validateFunnelHealth(pkg)` | `funnelHealthService.evaluatePackage(pkg)` |
| `/api/v1/funnel-os` | `calculateFunnelHealth(counts...)` | `funnelHealthService.evaluateActivity(counts...)` |

### Deprecated Files (re-exports for backward compat)

| File | Status |
|---|---|
| `funnel-builder/funnelHealthValidator.ts` | → Re-exports `funnelHealthService.evaluatePackage()` with `@deprecated` JSDoc |
| `funnel-os/funnelHealthService.ts` | → Re-exports `funnelHealthService.evaluateActivity()` with `@deprecated` JSDoc |

---

## Changed Files (6)

| File | Change |
|---|---|
| `src/modules/funnel/services/funnel-health-service.ts` | **Canonical engine** — expanded with `evaluatePackage()` + `evaluateActivity()` |
| `src/modules/funnel-builder/funnelHealthValidator.ts` | **Deprecated re-export** — delegates to canonical |
| `src/modules/funnel-os/funnelHealthService.ts` | **Deprecated re-export** — delegates to canonical |
| `src/modules/funnel-builder/funnelBuilderService.ts` | Updated import → canonical |
| `src/modules/funnel-builder/components/FunnelBuilderDashboard.tsx` | Updated import → canonical |
| `src/app/api/v1/funnel-os/route.ts` | Updated import → canonical |

---

## Verification

```
$ pnpm type-check
✓ tsc --noEmit — 0 errors

$ pnpm build
✓ Compiled successfully in 5.9s
✓ Generating static pages (208/208)

Bundle impact:
  funnel-builder:  7.08 kB → 5.62 kB (−21%)  ← lighter due to shared chunk with canonical
```

---

## Architecture Diagram

```
Before (3 scattered engines):                After (1 canonical):
                                             
 funnel/                                     funnel/
 └── services/                               └── services/
      └── funnel-health-service.ts ◄──────────── funnel-health-service.ts  ← CANONICAL
            (DB-backed)                      │    ├── calculate()          (DB-backed)
                                             │    ├── evaluatePackage()    (adapter)
 funnel-builder/                             │    └── evaluateActivity()  (adapter)
 └── funnelHealthValidator.ts ───────────────┤         ▲
      (FunnelPackage)                        │         │ imports types
                                             │    ┌────┴──────────────┐
 funnel-os/                                  │    │ funnel-builder/types│
 └── funnelHealthService.ts ─────────────────┘    │ funnel-os/types     │
      (activity counters)                         └────────────────────┘

Deprecated (re-exports only):
  funnel-builder/funnelHealthValidator.ts → delegates to canonical
  funnel-os/funnelHealthService.ts        → delegates to canonical
```

---

## Migration Risk

| Risk | Status |
|---|---|
| API response contracts broken | ✅ None — all return types preserved exactly |
| UI behavior changed | ✅ None — same scoring logic, same thresholds |
| DB schema changed | ✅ None — no Prisma changes |
| Import paths broken | ✅ Backward compat preserved via deprecated re-exports |
| Type name conflicts | ✅ Resolved via import aliases (`BuilderFunnelHealth`, `OsFunnelHealth`) |
