# AI Model Router Audit — 2026-06-12

## Existing Infrastructure (DO NOT REPLACE)

| Component | File | Status |
|-----------|------|--------|
| AIRouter | `src/modules/ai/router/ai-router.ts` | ✅ Complete — `generate()`, plan-aware routing, tenant config |
| Task Classifier | `src/modules/ai/router/task-classifier.ts` | ✅ Complete — 12 task types, tiers A/B/C |
| Model Registry | `src/modules/ai/router/model-registry.ts` | ✅ Complete — per-task model preferences |
| Cost Optimizer | `src/modules/ai/router/cost-optimizer.ts` | ✅ Complete — cost-aware model selection |
| Provider Factory | `src/modules/ai/providers/factory.ts` | ✅ Complete — `generateWithFallback()` |
| Providers | `anthropic.ts`, `openai.ts`, `gemini.ts`, `deepseek.ts`, `minimax.ts` | ✅ Complete — standardized `generateText()` interface |
| AI Usage Tracker | `src/modules/ai/usage/tracker.ts` | ✅ Complete — writes to AIUsageLog |
| Quota Enforcer | `src/modules/ai/usage/quota.ts` | ✅ Complete — plan-based quota checks |

## Direct AI Call Locations

| Module | File | Provider Access |
|--------|------|----------------|
| Brand Discovery | `brand-interview-service.ts` | Via `getRouterForTenant()` + `router.generate()` |
| Brand DNA | `brandDnaService.ts` | Via brand interview extraction |
| Content | `content-service.ts`, `content-calendar-service.ts` | Via `getRouterForTenant()` |
| Video | `video-strategy-service.ts`, `master-script-service.ts`, etc. | Via `getRouterForTenant()` |
| Funnel | `funnel-builder-service.ts`, `funnel-strategy-service.ts` | Via `getRouterForTenant()` |
| Voice | `voice-service.ts` | Via `generateWithFallback()` |
| WhatsApp | `whatsapp-ai` (Epic 12) | Deterministic — no AI calls |

## What Needs To Be Added

| Component | Reason |
|-----------|--------|
| `modelPolicyEngine.ts` | Plan-based routing rules (free → cheap models, pro → quality models) |
| `costEstimator.ts` | Pre-call credit estimation per task type |
| `fallbackHandler.ts` | Retry logic, graceful degradation, error sanitization |
| `responseNormalizer.ts` | Standardized response format across all providers |
| `aiRouterAdvisor.ts` | Admin visibility: usage by provider/module, cost alerts |
| Provider availability detection | Graceful handling of missing env vars |
