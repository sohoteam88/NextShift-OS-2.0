# V5-1 — Model Registry Consolidation Report

**Date:** 2026-06-14  
**Scope:** Deduplicate model/provider metadata into single canonical source  
**Status:** ✅ Complete

---

## Before: 3 Sources of Model/Provider Metadata

| Source | What It Defined | Problem |
|---|---|---|
| `ai/providers/` | 5 provider SDK classes with default model IDs | Model IDs embedded in each class |
| `ai/router/model-registry.ts` | 10 models with costs, tiers, quality ratings | Authoritative but incomplete |
| `ai-router/providerRegistry.ts` | 5 providers, each with model lists and capabilities | **Different model IDs** than model-registry |

### Model ID Mismatch Example

| Provider | `model-registry.ts` | `providerRegistry.ts` (old) |
|---|---|---|
| Anthropic | `claude-opus-4-20250514`, `claude-sonnet-4-20250514`, `claude-haiku-4-5-20251001` | `claude-sonnet-4-6`, `claude-opus-4-8`, `claude-fable-5` |
| DeepSeek | `deepseek-chat`, `deepseek-chat-cheap` | `deepseek-v4-pro`, `deepseek-chat` |
| MiniMax | `minimax-abab-6.5s` | `abab-7b` |

---

## After: 1 Canonical Source

### `ai/router/model-registry.ts` (canonical — expanded)

```
MODEL_REGISTRY (10 models, unchanged)
  ├── getAvailableModels()       ← existing
  ├── getModelsByTier()          ← existing
  ├── getModelById()             ← existing
  ├── getProviderSummaries()     ← NEW: derive providers FROM models
  └── getFirstAvailableProvider() ← NEW: priority-based lookup
```

### `ai-router/providerRegistry.ts` (delegated)

```
getAvailableProviders()  → getProviderSummaries() (canonical)
getFirstAvailable()      → getFirstAvailableProvider() (canonical)
```

### `ai/providers/` (SDK layer — unchanged)

Provider SDK classes (`openai.ts`, `anthropic.ts`, etc.) are implementation-level abstractions. Their model defaults are internal to each SDK integration and are NOT metadata — no changes needed.

---

## Changed Files (2)

| File | Change |
|---|---|
| `src/modules/ai/router/model-registry.ts` | Added `ProviderSummary` interface, `getProviderSummaries()`, `getFirstAvailableProvider()` |
| `src/modules/ai-router/providerRegistry.ts` | Replaced 65-line hardcoded provider list with 12-line delegation to model-registry |

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
| Model ID mismatch in routing decisions | ✅ Resolved — providerRegistry now uses exact model IDs from model-registry |
| `getFirstAvailable` behavior change | ✅ Identical — same priority-list logic, same default fallback (`'deepseek'`) |
| Provider capability drift | ✅ Preserved — `supportsJson`, `supportsStreaming`, `costTier` derived from model data |
| Runtime regression | ✅ None — same exports, same function signatures |
