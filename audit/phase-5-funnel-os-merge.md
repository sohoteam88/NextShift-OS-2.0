# Phase 5 — funnel-os → funnel Merge Report

**Date:** 2026-06-14
**Scope:** Merge `src/modules/funnel-os` into unified `src/modules/funnel`
**Status:** ✅ Complete — FINAL PHASE

---

## Files Moved (5 + 1 new)

| Source | Destination |
|---|---|
| `funnel-os/types.ts` | `funnel/types/funnel-os.ts` |
| `funnel-os/funnelProgressService.ts` | `funnel/services/funnel-progress-service.ts` |
| `funnel-os/funnelNextActionEngine.ts` | `funnel/services/funnel-next-action.ts` |
| `funnel-os/funnelHealthService.ts` | `funnel/services/funnel-os-health.ts` |
| `funnel-os/components/FunnelOperatingCard.tsx` | `funnel/components/os/FunnelOperatingCard.tsx` |
| *(extracted hook)* | `funnel/hooks/use-funnel-os.ts` |

---

## External Consumers Updated (8 files)

| File | Imports Changed |
|---|---|
| `app/api/v1/funnel-os/route.ts` | `funnelProgressService`, `FUNNEL_GOALS`, `MILESTONES` → funnel/ |
| `components/.../FunnelMilestoneCard.tsx` | `FunnelMilestone` → funnel/ |
| `components/.../FunnelOperatingCard.tsx` | `FunnelGoal`, `FunnelNextAction`, `FunnelProgress` → funnel/ |
| `components/.../FunnelGoalCard.tsx` | `FunnelGoal`, `FUNNEL_GOALS` → funnel/ |
| `components/.../useFunnelOperatingData.ts` | All types → funnel/ |
| `components/.../FunnelHealthCard.tsx` | `FunnelHealth`, `FunnelProgress` → funnel/ |
| `components/.../FunnelProgressCard.tsx` | `FunnelProgress` → funnel/ |
| `modules/funnel/services/funnel-health-service.ts` | `OsFunnelHealth`, `FunnelNextAction` → funnel/ |

---

## Verification

```
$ pnpm type-check
✓ tsc --noEmit — 0 errors

$ pnpm build
✓ Compiled successfully
✓ Generating static pages (208/208)
```

---

## Final V4 Funnel Domain Structure

```
src/modules/funnel/
├── types/
│   ├── types.ts                      ← FunnelPageType, FunnelConfig, section types
│   ├── strategy-context.ts           ← StrategyContext, CaseStudy
│   ├── funnel-builder.ts             ← FunnelBuilderType, FunnelPackage, GenerateResult...
│   ├── funnel-context.ts             ← BusinessFunnelType, FunnelContext, FunnelContextMap
│   └── funnel-os.ts                  ← FunnelProgress, FunnelHealth, FunnelMilestone, FunnelGoal...
├── schemas/
│   └── funnel-schemas.ts             ← Zod validation schemas
├── services/
│   ├── funnel-service.ts             ← CRUD (canonical DB write path)
│   ├── funnel-health-service.ts      ← Health + next-action (canonical, all 3 merged)
│   ├── funnel-strategy-service.ts    ← AI strategy generation
│   ├── funnel-builder-service.ts     ← Deterministic funnel generation
│   ├── funnel-generators.ts          ← Deterministic content generators
│   ├── funnel-builder-api.ts         ← Client API calls (world-class-funnel)
│   ├── funnel-context-provider.ts    ← Brand DNA → funnel context
│   ├── funnel-progress-service.ts    ← Progress tracking per funnel type
│   ├── funnel-next-action.ts         ← Activity-based next action (deprecated adapter)
│   ├── funnel-os-health.ts           ← Activity-based health (deprecated adapter)
│   ├── quality-gate-service.ts       ← Content quality/de-duplication
│   ├── template-service.ts           ← Template CRUD
│   └── upload-service.ts             ← Image upload
├── hooks/
│   ├── use-funnels.ts                ← CRUD hooks (useFunnels, useFunnel, etc.)
│   ├── use-funnel-form.ts            ← AI generation form hook
│   └── use-funnel-os.ts              ← OS data fetching hook
├── constants/
│   └── funnel-builder.ts             ← Label maps, option arrays, helpers
├── components/
│   ├── ai/                           ← AI generation UI (5 files)
│   ├── os/                           ← OS card component
│   ├── shared/                       ← Reusable UI primitives (7 files)
│   ├── dashboard/                    ← Dashboard components
│   ├── builder/                      ← Editor components
│   ├── renderer/                     ← Public-facing renderer
│   ├── sections/                     ← Section renderers
│   └── FunnelBuilderDashboard.tsx    ← Deterministic builder
├── seed/
│   └── default-templates.ts
└── index.ts                          ← (future) Public barrel export
```

---

## Deprecated Modules (all re-exports only)

| Module | Status |
|---|---|
| `src/modules/funnel-builder/` | All files → `@deprecated` re-exports |
| `src/modules/funnel-context/` | All files → `@deprecated` re-exports |
| `src/modules/funnel-os/` | All files → `@deprecated` re-exports |
| **`src/modules/funnel/`** | **✅ SINGLE UNIFIED DOMAIN** |

---

## Cumulative V3 → V4 Migration Summary

| Phase | Action | Result |
|---|---|---|
| **Phase 1** | Refactor funnel-builder page.tsx | 1,085 → 184 lines |
| **Phase 2a** | Disambiguate `FunnelType` | 3 conflicting names → 3 distinct names |
| **Phase 2b** | Consolidate health engines | 3 → 1 canonical service |
| **Phase 2c** | Consolidate next-action engines | 3 → 1 canonical service |
| **Phase 2d** | Consolidate DB write paths | 2 → 1 canonical entry point |
| **Phase 3** | Merge funnel-builder → funnel | 21 files moved |
| **Phase 4** | Merge funnel-context → funnel | 3 files moved |
| **Phase 5** | Merge funnel-os → funnel | 5 files moved + 1 hook extracted |

### Metrics

| Metric | Before (V3) | After (V4) |
|---|---|---|
| Funnel domain modules | 4 | **1** |
| `FunnelType` definitions | 3 (conflicting) | 3 (disambiguated) |
| Health calculators | 3 | 1 |
| Next-action engines | 3 | 1 |
| DB write paths to `Funnel` table | 2 | 1 |
| Cross-module imports | ~25 | **0** (all internal) |
| Page bundle (funnel-builder) | 7.08 kB | 6.12 kB (−14%) |
| Build status | ✅ | ✅ (208 pages) |
| Type check | ✅ | ✅ (0 errors) |

### Remaining Risks

| Risk | Status |
|---|---|
| Deprecated module stubs still exist on disk | ✅ Safe — all resolve to canonical funnel/ |
| `funnel-os/healthService` imports from now-internal path | ✅ Fixed — moved to funnel/services/ |
| No index.ts barrel export yet | ⚠️ Optional — can be added as convenience |
