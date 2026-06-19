# Phase 1 — Funnel Builder Refactor Report

**Date:** 2026-06-14
**Target:** `src/app/(auth)/ai/funnel-builder/page.tsx`
**Strategy:** Extract UI → components, logic → hooks, types/constants → dedicated files into `src/modules/funnel-builder/`

---

## Before / After

| Metric | Before | After | Delta |
|---|---|---|---|
| `page.tsx` lines | **1,085** | **184** | −83% |
| Target threshold | < 300 | ✅ | — |
| Files in page directory | 1 | 1 | — |
| Files extracted to module | 0 | 17 | +17 |
| `tsc --noEmit` | — | ✅ 0 errors | — |
| `next build` | — | ✅ Compiled | — |
| Business logic changed | — | ❌ None | — |
| UI behavior changed | — | ❌ None | — |
| DB schema changed | — | ❌ None | — |
| New dependencies | — | ❌ None | — |

---

## Changed Files

### Modified (1)

| File | Before | After |
|---|---|---|
| `src/app/(auth)/ai/funnel-builder/page.tsx` | 1,085 lines | 184 lines |

### Created (16 new files + 1 merged)

| # | File | Lines | Contents |
|---|---|---|---|
| 1 | `src/modules/funnel-builder/types.ts` | +32 | `GenerateResult`, `SavedFunnelRow`, `RealMaterialForm` (merged into existing) |
| 2 | `src/modules/funnel-builder/services/api.ts` | 42 | `generateFunnel`, `buildStrategy`, `fetchSavedFunnels` |
| 3 | `src/modules/funnel-builder/constants/index.ts` | 109 | Label maps, option arrays, `normalizeRealMaterial`, `buildExampleMaterial`, `CASE_STUDY_FIELDS` |
| 4 | `src/modules/funnel-builder/hooks/useFunnelForm.ts` | 147 | All form state, mutation, validation, derived state |
| 5 | `src/modules/funnel-builder/components/CopyButton.tsx` | 23 | Clipboard copy with feedback |
| 6 | `src/modules/funnel-builder/components/Section.tsx` | 36 | Collapsible section with icon |
| 7 | `src/modules/funnel-builder/components/Field.tsx` | 13 | Label + value display with copy |
| 8 | `src/modules/funnel-builder/components/BulletList.tsx` | 15 | Bulleted list display |
| 9 | `src/modules/funnel-builder/components/InputField.tsx` | 25 | Text input with label |
| 10 | `src/modules/funnel-builder/components/TextareaField.tsx` | 25 | Textarea with label |
| 11 | `src/modules/funnel-builder/components/SelectField.tsx` | 31 | Select dropdown |
| 12 | `src/modules/funnel-builder/components/FunnelResult.tsx` | 279 | 14 collapsible sections rendering AI output |
| 13 | `src/modules/funnel-builder/components/HistoryPanel.tsx` | 98 | Sidebar panels: history list, output summary, strategy steps |
| 14 | `src/modules/funnel-builder/components/RealMaterialForm.tsx` | 192 | Case studies, objections, founder story sub-form |
| 15 | `src/modules/funnel-builder/components/StrategyDisplay.tsx` | 20 | AI strategy summary card |
| 16 | `src/modules/funnel-builder/components/GenerationProgress.tsx` | 21 | Loading indicator during generation |

---

## Architecture

```
src/modules/funnel-builder/
├── components/
│   ├── CopyButton.tsx          ← Presentational (clipboard)
│   ├── Section.tsx             ← Presentational (collapsible)
│   ├── Field.tsx               ← Presentational (label + value)
│   ├── BulletList.tsx          ← Presentational (list)
│   ├── InputField.tsx          ← Form input
│   ├── TextareaField.tsx       ← Form textarea
│   ├── SelectField.tsx         ← Form select
│   ├── FunnelResult.tsx        ← Section (14 AI output sections, ~279 lines)
│   ├── HistoryPanel.tsx        ← Section (sidebar: history + output + strategy)
│   ├── RealMaterialForm.tsx    ← Section (case studies + objections sub-form)
│   ├── StrategyDisplay.tsx     ← Section (AI strategy card)
│   └── GenerationProgress.tsx  ← Section (loading indicator)
├── hooks/
│   └── useFunnelForm.ts        ← Stateful logic (form, mutation, validation)
├── services/
│   └── api.ts                  ← API calls (generateFunnel, buildStrategy, fetchSavedFunnels)
├── constants/
│   └── index.ts                ← Label maps, options, helper functions
└── types.ts                    ← Page types (merged into existing module types)
```

```
src/app/(auth)/ai/funnel-builder/
└── page.tsx                    ← Orchestration only (184 lines)
    ├── Imports (12 lines)
    ├── useFunnelForm() hook call
    └── JSX: header, form grid, sidebar, progress, strategy, result
```

---

## Extraction Details

### UI Components (presentational)

| Component | Props | State | Lines |
|---|---|---|---|
| `CopyButton` | `text: string` | `copied` (local) | 23 |
| `Section` | `title, icon, defaultOpen, children` | `open` (local) | 36 |
| `Field` | `label, value` | none | 13 |
| `BulletList` | `label, items` | none | 15 |
| `InputField` | `label, value, onChange, placeholder, required` | none | 25 |
| `TextareaField` | `label, value, onChange, placeholder, required` | none | 25 |
| `SelectField` | `label, value, onChange, options, required` | none | 31 |

### Section Components

| Component | Props | Lines | Description |
|---|---|---|---|
| `FunnelResult` | `funnel: FunnelBuilderOutput` | 279 | All 14 collapsible output sections |
| `HistoryPanel` | `savedFunnels, isLoading, onRestore` | 40 | Recent funnels sidebar panel |
| `OutputPanel` | none | 20 | Output checklist sidebar panel |
| `StrategyPanel` | none | 20 | Strategy steps sidebar panel |
| `RealMaterialFormSection` | `form, realMaterial, onRealMaterialChange, onStrategyReset` | 192 | Real material sub-form |
| `StrategyDisplay` | `context: StrategyContext` | 20 | AI strategy card |
| `GenerationProgress` | `stage: 'idle' \| 'strategy' \| 'content'` | 21 | Loading indicator |

### Hook

```ts
useFunnelForm() → {
  form, setForm, set,
  realMaterial, setRealMaterial,
  strategyContext, setStrategyContext,
  generationStage, result,
  savedFunnelsQuery, mutation,
  handleSubmit, restoreSavedFunnel,
  isValid, completedRequired, requiredFields, completionPct,
}
```

---

## Build Verification

```
$ pnpm type-check
✓ tsc --noEmit — 0 errors

$ pnpm build
✓ Compiled successfully in 5.4s
✓ Linting and checking validity of types
✓ Generating static pages (208/208)
✓ Finalizing page optimization
```

Pre-existing lint warnings (not introduced by this refactor):
- `src/modules/ai/components/AIPromptPanel.tsx` — 3 `react-hooks/exhaustive-deps` warnings
- `src/modules/ai/components/AITemplateManager.tsx` — 1 `react-hooks/exhaustive-deps` warning

---

## Behavior Preservation

| Concern | Status | Notes |
|---|---|---|
| Form state initialization | ✅ Identical | Same defaults in hook |
| `normalizeRealMaterial` logic | ✅ Identical | Same trim/filter behavior |
| `buildExampleMaterial` logic | ✅ Identical | Same template strings |
| Mutation pipeline (strategy → content) | ✅ Identical | Same two-stage flow |
| `scrollIntoView` after generation | ✅ Identical | Same 100ms timeout, same target ID |
| `restoreSavedFunnel` logic | ✅ Identical | Same state reconstruction |
| Completion percentage calculation | ✅ Identical | Same derived state |
| All CSS classes / design tokens | ✅ Identical | All `var(--color-*)` references preserved |
| API endpoint paths | ✅ Identical | Same three fetch URLs |
| Error messages (zh) | ✅ Identical | Same Chinese error strings |
| `onStrategyReset` decomposition | ✅ Identical | `setRealMaterial` + `setStrategyContext(null)` split into two callbacks, called synchronously in each handler |

---

## Unresolved Risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | No runtime / E2E test was run | Low | Build + type check passes. Recommend manual smoke test of the funnel-builder form + generation flow before merging. |
| 2 | `types.ts` merge: new types appended to existing file | Low | No naming conflicts with pre-existing `FunnelType`, `FunnelStatus`, etc. Verified via `tsc`. |
| 3 | `RealMaterialFormSection` handler decomposition | Low | Original inline `setRealMaterial` + `setStrategyContext(null)` calls were split into `onRealMaterialChange` + `onStrategyReset` callbacks. Both fire synchronously, preserving original execution order. |
| 4 | Page directory now contains only `page.tsx` | Info | The `components/`, `hooks/` subdirectories under the page route were removed. All extracted code lives in `src/modules/funnel-builder/`. |
