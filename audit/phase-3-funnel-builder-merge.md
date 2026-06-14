# Phase 3 — funnel-builder → funnel Merge Report

**Date:** 2026-06-14  
**Scope:** Merge `src/modules/funnel-builder` into `src/modules/funnel`  
**Status:** ✅ Complete

---

## Files Moved (17 + 2 deprecated kept)

### Types
| Source | Destination |
|---|---|
| `funnel-builder/types.ts` | `funnel/types/funnel-builder.ts` |

### Constants
| Source | Destination |
|---|---|
| `funnel-builder/constants/index.ts` | `funnel/constants/funnel-builder.ts` |

### Services
| Source | Destination |
|---|---|
| `funnel-builder/services/api.ts` | `funnel/services/funnel-builder-api.ts` |
| `funnel-builder/funnelBuilderService.ts` | `funnel/services/funnel-builder-service.ts` |
| `funnel-builder/funnelGenerators.ts` | `funnel/services/funnel-generators.ts` |
| `funnel-builder/funnelAdvisor.ts` | *(kept as deprecated re-export)* |
| `funnel-builder/funnelHealthValidator.ts` | *(kept as deprecated re-export)* |

### Hooks
| Source | Destination |
|---|---|
| `funnel-builder/hooks/useFunnelForm.ts` | `funnel/hooks/use-funnel-form.ts` |

### Components — AI
| Source | Destination |
|---|---|
| `FunnelResult.tsx` | `funnel/components/ai/FunnelResult.tsx` |
| `RealMaterialForm.tsx` | `funnel/components/ai/RealMaterialForm.tsx` |
| `StrategyDisplay.tsx` | `funnel/components/ai/StrategyDisplay.tsx` |
| `GenerationProgress.tsx` | `funnel/components/ai/GenerationProgress.tsx` |
| `HistoryPanel.tsx` | `funnel/components/ai/HistoryPanel.tsx` |

### Components — Shared
| Source | Destination |
|---|---|
| `CopyButton.tsx` | `funnel/components/shared/CopyButton.tsx` |
| `Section.tsx` | `funnel/components/shared/Section.tsx` |
| `Field.tsx` | `funnel/components/shared/Field.tsx` |
| `BulletList.tsx` | `funnel/components/shared/BulletList.tsx` |
| `InputField.tsx` | `funnel/components/shared/InputField.tsx` |
| `TextareaField.tsx` | `funnel/components/shared/TextareaField.tsx` |
| `SelectField.tsx` | `funnel/components/shared/SelectField.tsx` |

### Components — Builder
| Source | Destination |
|---|---|
| `FunnelBuilderDashboard.tsx` | `funnel/components/FunnelBuilderDashboard.tsx` |

---

## External Consumer Updates (6 files)

| File | Import Changes |
|---|---|
| `app/(auth)/ai/funnel-builder/page.tsx` | 9 imports updated: `@/modules/funnel-builder/*` → `@/modules/funnel/*` |
| `app/(auth)/funnel-builder/page.tsx` | 1 import updated: FunnelBuilderDashboard path |
| `app/api/v1/funnel-builder/route.ts` | 1 import updated: funnelBuilderService path |
| `app/api/v1/funnel-builder/generate/route.ts` | 1 import updated: funnelBuilderService path |
| `modules/funnel/services/funnel-health-service.ts` | 1 import updated: types path |

---

## Backward Compatibility

All files in `funnel-builder/` replaced with re-export stubs annotated `@deprecated`. Existing import paths continue to work but resolve through the canonical funnel module.

---

## New funnel/ Module Structure

```
src/modules/funnel/
├── types/
│   ├── types.ts                     ← FunnelPageType, FunnelConfig, sections...
│   ├── strategy-context.ts          ← StrategyContext, CaseStudy
│   └── funnel-builder.ts            ← NEW: FunnelBuilderType, FunnelPackage, etc.
├── schemas/
│   └── funnel-schemas.ts
├── services/
│   ├── funnel-service.ts            ← CRUD (canonical)
│   ├── funnel-health-service.ts     ← Health + next-action (canonical)
│   ├── funnel-strategy-service.ts   ← AI strategy
│   ├── funnel-builder-service.ts    ← NEW: Deterministic generation
│   ├── funnel-generators.ts         ← NEW: Deterministic generators
│   ├── funnel-builder-api.ts        ← NEW: Client API calls
│   ├── quality-gate-service.ts
│   ├── template-service.ts
│   └── upload-service.ts
├── hooks/
│   ├── use-funnels.ts               ← CRUD hooks
│   └── use-funnel-form.ts           ← NEW: AI generation form hook
├── constants/
│   └── funnel-builder.ts            ← NEW: Label maps, options, helpers
├── components/
│   ├── FunnelBuilderDashboard.tsx   ← NEW: Deterministic builder dashboard
│   ├── ai/                          ← NEW: AI generation UI
│   │   ├── FunnelResult.tsx
│   │   ├── RealMaterialForm.tsx
│   │   ├── StrategyDisplay.tsx
│   │   ├── GenerationProgress.tsx
│   │   └── HistoryPanel.tsx
│   ├── shared/                      ← NEW: Reusable UI primitives
│   │   ├── CopyButton.tsx
│   │   ├── Section.tsx
│   │   ├── Field.tsx
│   │   ├── BulletList.tsx
│   │   ├── InputField.tsx
│   │   ├── TextareaField.tsx
│   │   └── SelectField.tsx
│   ├── builder/                     ← Editor components
│   ├── renderer/                    ← Public renderer
│   └── sections/                    ← Section renderers
└── seed/
    └── default-templates.ts
```

---

## Verification

```
$ pnpm type-check
✓ tsc --noEmit — 0 errors

$ pnpm build
✓ Compiled successfully in 5.6s
✓ Generating static pages (208/208)
```

---

## Remaining Risks

| Risk | Status |
|---|---|
| `funnel-builder/` still exists as deprecated stubs | ✅ Safe — re-exports resolve to canonical funnel/ module |
| Phase 4 merge (`funnel-context` → `funnel`) will need to update cross-refs | ⚠️ Minor — `funnel-health-service` and `funnel-os/types` import from `funnel-context` |
| Phase 5 merge (`funnel-os` → `funnel`) will be the final consolidation | ⚠️ Minor — same cross-ref update pattern |
| Old import paths still work | ✅ Verified — all deprecated re-exports tested via tsc |
| No duplicate code in old module | ✅ Verified — old files are one-line re-exports |

---

## Architecture Diagram

```
Before:                                     After:

funnel/          funnel-builder/            funnel/
├── types/       ├── types.ts               ├── types/
├── services/    ├── services/              │   ├── types.ts
├── hooks/       ├── hooks/                 │   ├── strategy-context.ts
├── components/  ├── components/            │   └── funnel-builder.ts  ← NEW
├── schemas/     ├── constants/            ├── services/
└── seed/        ├── funnelBuilderService   │   ├── funnel-service.ts
                 ├── funnelGenerators       │   ├── funnel-health-service.ts
                 ├── funnelAdvisor          │   ├── funnel-builder-service.ts  ← NEW
                 └── funnelHealthValidator   │   ├── funnel-generators.ts  ← NEW
                                            │   ├── funnel-builder-api.ts  ← NEW
                 Cross-module imports:      │   └── ...
                 4 arrows → funnel          ├── hooks/
                                            │   ├── use-funnels.ts
                                            │   └── use-funnel-form.ts  ← NEW
                                            ├── constants/
                                            │   └── funnel-builder.ts  ← NEW
                                            └── components/
                                                ├── ai/     ← NEW (5 files)
                                                ├── shared/ ← NEW (7 files)
                                                └── ...

funnel-builder/  ← still exists as @deprecated re-exports
```
