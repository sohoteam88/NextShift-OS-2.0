# V5-2 — Task Classification Consolidation Report

**Date:** 2026-06-14
**Scope:** Unify 2 competing task classification systems into 1 canonical source
**Status:** ✅ Complete

---

## Before: 2 Competing Systems

| System | Location | Values | Routing Logic |
|---|---|---|---|
| `TaskCategory` | `ai/router/task-classifier.ts` | 14 categories | `classifyTask()` — tier assignment + auto-escalation |
| `AITaskType` | `ai-router/types.ts` | 16 task types | `mapToTaskCategory()` — lossy bridge (14/16 map to `content_generation`) |

### The Bridge Problem

```typescript
// OLD: 14 out of 16 AITaskType values collapsed into 'content_generation'
function mapToTaskCategory(taskType: AITaskType): TaskCategory {
  // brand_discovery → interview_dialogue  ✓
  // extraction → brand_extraction        ✓
  // funnel_generation → content_generation   ✗ (lost specificity!)
  // lead_magnet_generation → content_generation ✗
  // webinar_generation → content_generation    ✗
  // ... 14 of 16 → content_generation
}
```

---

## After: 1 Unified Taxonomy

### `ai/router/task-classifier.ts` (canonical — 30 categories)

```
TaskCategory = 14 original + 16 merged = 30 categories
  ├── classifyTask(category) → TaskClassification { tier, reason, tokens }
  └── AITaskType = TaskCategory (backward-compat alias)
```

Each of the 30 categories has:
- Proper tier assignment (S/A/B/C) with realistic output token estimates
- Category-specific routing reason string
- Auto-escalation for large inputs (>10K → tier A, >50K → tier S)

### Key Tier Assignments for Merged Types

| New Category | Tier | Reason |
|---|---|---|
| `funnel_generation` | **S** | Complete multi-section funnel, 4000 avg tokens |
| `webinar_generation` | **A** | Full webinar script, 2500 avg tokens |
| `brand_dna_generation` | **A** | Brand DNA synthesis, 1200 avg tokens |
| `video_script_generation` | **A** | Full video script, 1200 avg tokens |
| `traffic_strategy` | **A** | Multi-platform strategy, 1000 avg tokens |
| `classification` | **C** | Mechanical categorization |
| *(14 others)* | B–A | Appropriate tier per complexity |

---

## Removed Duplicate Logic

```diff
- ai-router/aiModelRouter.ts::mapToTaskCategory()  ← 31 lines deleted
```

Now uses `req.taskType as TaskCategory` directly — no translation layer needed.

---

## Changed Files (4)

| File | Change |
|---|---|
| `src/modules/ai/router/task-classifier.ts` | Extended from 14 → 30 categories; added `AITaskType` alias |
| `src/modules/ai-router/types.ts` | `AITaskType` now re-exports from canonical classifier |
| `src/modules/ai-router/aiModelRouter.ts` | Removed `mapToTaskCategory()` bridge (31 lines) |
| `src/modules/ai-router/modelPolicyEngine.ts` | Fixed type to `Partial<Record<...>>` for expanded union |

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

## Migration Risk

| Risk | Status |
|---|---|
| API contracts (AITaskType values) | ✅ All 16 values preserved as first-class TaskCategory members |
| Routing behavior change | ✅ **Improved** — previously 14/16 tasks got generic `content_generation` tier. Now each gets its proper tier assignment. |
| Backward compatibility | ✅ `AITaskType` alias exported from both `ai/router/task-classifier` and `ai-router/types` |
| `getTaskDefinition()` still works | ✅ `content_generation` fallback preserved for unknown categories |
