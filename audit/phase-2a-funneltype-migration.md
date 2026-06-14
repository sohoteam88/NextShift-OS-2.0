# Phase 2a — FunnelType Disambiguation Report

**Date:** 2026-06-14  
**Scope:** Rename 3 conflicting `FunnelType` definitions across the funnel domain  
**Status:** ✅ Complete

---

## Summary

Three modules defined `FunnelType` with **incompatible value sets**. Each was renamed to reflect its domain semantics:

| Module | Before | After | Values |
|---|---|---|---|
| `funnel/types.ts` | `FunnelType` | **`FunnelPageType`** | `'landing' \| 'quiz' \| 'lead_magnet'` |
| `funnel-builder/types.ts` | `FunnelType` | **`FunnelBuilderType`** | `'lead_magnet' \| 'webinar' \| 'whatsapp' \| 'consultation' \| 'challenge'` |
| `funnel-context/types.ts` | `FunnelType` | **`BusinessFunnelType`** | `'retail' \| 'recruitment' \| 'upgrade'` |

---

## Files Changed (20)

### Definition files (3)

| File | Change |
|---|---|
| `src/modules/funnel/types.ts` | `FunnelType` → `FunnelPageType` (2 occurrences) |
| `src/modules/funnel-builder/types.ts` | `FunnelType` → `FunnelBuilderType` (3 occurrences) |
| `src/modules/funnel-context/types.ts` | `FunnelType` → `BusinessFunnelType` (2 occurrences) |

### Internal consumers — funnel-builder (3)

| File | Change |
|---|---|
| `src/modules/funnel-builder/funnelBuilderService.ts` | Import + parameter type updated |
| `src/modules/funnel-builder/funnelGenerators.ts` | Import + 2 parameter type annotations updated |
| `src/modules/funnel-builder/components/FunnelBuilderDashboard.tsx` | Import + 3 type annotations + cast updated |

### Internal consumers — funnel-context (1)

| File | Change |
|---|---|
| `src/modules/funnel-context/funnelContextProvider.ts` | Import + 2 type references updated |

### Internal consumers — funnel-os (4)

| File | Change |
|---|---|
| `src/modules/funnel-os/types.ts` | Import + 5 type references updated |
| `src/modules/funnel-os/funnelNextActionEngine.ts` | Import + parameter type updated |
| `src/modules/funnel-os/funnelProgressService.ts` | Import + 2 type references updated |
| `src/modules/funnel-os/components/FunnelOperatingCard.tsx` | Import + 3 type references updated |

### External consumers (6)

| File | Module |
|---|---|
| `src/app/api/v1/funnel-os/route.ts` | API route handler |
| `src/app/(auth)/journey/page.tsx` | Journey page |
| `src/components/funnel-operating-system/FunnelOperatingCard.tsx` | Dashboard component |
| `src/components/funnel-operating-system/FunnelSelector.tsx` | Funnel type selector |
| `src/components/funnel-operating-system/useFunnelPreference.ts` | Preference hook |
| `src/components/funnel-operating-system/useFunnelOperatingData.ts` | Data fetching hook |
| `src/components/funnel-operating-system/FunnelGoalCard.tsx` | Goal card component |
| `src/modules/blueprints/types.ts` | Blueprint type definitions |

### Pre-existing from Phase 1 (1)

| File | Change |
|---|---|
| `src/app/(auth)/ai/funnel-builder/page.tsx` | Modified in Phase 1 (not part of 2a) |

---

## Verification

```
$ pnpm type-check
✓ tsc --noEmit — 0 errors

$ pnpm build
✓ Compiled successfully in 5.9s
✓ Generating static pages (208/208)
✓ Finalizing page optimization
```

---

## Breaking Risks

| Risk | Status |
|---|---|
| `FunnelType` no longer exists as an export | ✅ Zero remaining references — verified via `grep -rn FunnelType src/` |
| Variable name collision from `sed` | ✅ Fixed — `setFunnelType`, `setFunnelTypeState` variable names restored |
| API contract breakage | ✅ None — all API routes use literal string values (`'retail'`, `'lead_magnet'`, etc.), not the type name |
| Database schema breakage | ✅ None — Prisma schema unchanged |
| Runtime behavior change | ✅ None — only type alias renames; runtime values identical |

---

## Post-Migration State

```
No remaining unqualified "FunnelType" references in the codebase.

funnel/types.ts          → FunnelPageType      (page format: landing | quiz | lead_magnet)
funnel-builder/types.ts  → FunnelBuilderType   (AI generation: lead_magnet | webinar | whatsapp | consultation | challenge)
funnel-context/types.ts  → BusinessFunnelType  (business model: retail | recruitment | upgrade)
```
