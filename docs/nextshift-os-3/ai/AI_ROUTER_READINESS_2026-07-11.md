# AI Router Readiness Audit — 2026-07-11

Status: T1 complete

Scope: OS 3.5 Workstream T, ahead of T2 "Business Discussion" conversational service.

Reference:
- [OS 3.5 Blueprint](../OS_3_5_BLUEPRINT.md)
- [AI Router](../../../src/modules/ai/router/ai-router.ts)
- [AI Request Router](../../../src/modules/ai/services/ai-request-router.ts)
- [AI Usage Quota](../../../src/modules/ai/usage/quota.ts)
- [AI Usage Tracker](../../../src/modules/ai/usage/tracker.ts)

---

## Executive Summary

`modules/ai` has a usable model router, provider registry, fallback handler, and persistent usage logging through `AIUsageLog`. It is ready to support the first constrained T2 conversation slice only if T2 routes all generation through `modules/ai` and respects the tenant-level quota guard.

T1 added the missing tenant daily call limit:

- Env: `AI_DAILY_CALL_LIMIT_PER_TENANT`
- Default: `200`
- Scope: tenant x UTC day
- Storage: existing `AIUsageLog` count; no Prisma schema change
- Over-limit behavior: structured `AppError` with code `QUOTA_EXCEEDED` and HTTP status semantics `429`

Known architecture gaps remain:

- Some existing AI features bypass the request router or call provider SDKs directly.
- Cost visibility exists in persisted usage logs, but advisor-level tenant cost reporting is not fully connected.
- Streaming generation uses the router for model selection but does not have the same retry/fallback chain as non-streaming generation.

These gaps are recorded here for follow-up tasks and were not widened in T1.

---

## Router Status

### Providers And Models

The canonical registry is `src/modules/ai/router/model-registry.ts`.

Configured providers:

| Provider | Environment key | Models |
| --- | --- | --- |
| Anthropic | `ANTHROPIC_API_KEY` | `claude-opus-4-20250514`, `claude-sonnet-4-20250514`, `claude-haiku-4-5-20251001` |
| OpenAI | `OPENAI_API_KEY` | `gpt-4o`, `gpt-4o-mini` |
| Gemini | `GOOGLE_GENERATIVE_AI_API_KEY` or `GEMINI_API_KEY` | `gemini-2.5-pro`, `gemini-2.5-flash` |
| DeepSeek | `DEEPSEEK_API_KEY` | `deepseek-chat`, `deepseek-chat-cheap` |
| MiniMax | `MINIMAX_API_KEY` | `minimax-abab-6.5s` |

Models are grouped by tier `S`, `A`, `B`, and `C`, and include cost, speed, quality, Chinese-language quality, context window, and streaming metadata.

### Routing Decision Logic

The primary router is `src/modules/ai/router/ai-router.ts`.

Decision inputs:

- task category
- prompt length
- tenant router settings from `tenant.settings.ai_router`
- optional caller overrides
- available provider API keys

Supported routing modes:

- `cost_optimized`: lowest input + output price
- `quality_first`: highest quality rating
- `zh_optimized`: highest Chinese quality, then lower cost
- `balanced`: weighted quality, Chinese quality, speed, and cost

Tenant router settings can define:

- `mode`
- `preferred_provider`
- `auto_escalate`

`getRouterForTenant()` caches tenant router instances for 60 seconds when no override is supplied.

### Fallback And Degradation

There are two fallback mechanisms:

1. `AIRouter.executeWithRetry()`
   - retries the selected model path
   - tries same-tier alternatives
   - escalates tier when `autoEscalate` is enabled
   - throws after all attempts fail

2. `src/modules/ai/services/fallback-handler.ts`
   - iterates provider priority lists
   - retries each provider
   - returns a sanitized `NormalizedResponse` failure when all providers fail
   - does not expose raw provider errors to users

Streaming generation currently uses router model selection but not the same fallback chain as non-streaming generation.

### Router Advisor

`src/modules/ai/services/router-advisor.ts` analyzes in-memory `NormalizedResponse[]` inputs.

It reports:

- total calls
- failed calls
- average latency
- calls by provider
- calls by task/module
- high failure alerts

Current limitation:

- `costsByTenant` is present in the return shape but not populated from persisted usage data.
- The advisor is not yet a complete production cost dashboard.

### Usage Tracking

Persistent usage tracking is implemented in `src/modules/ai/usage/tracker.ts` and stored in Prisma model `AIUsageLog`.

Recorded dimensions:

| Dimension | Stored |
| --- | --- |
| tenant | yes, `tenantId` |
| user | yes, `userId` |
| feature | yes, `feature` and `category` |
| provider | yes |
| model | yes |
| token input/output | yes |
| duration | yes |
| estimated cost | yes, `costUsd` |
| routed tier | yes |
| original tier | yes |
| escalation | yes, `wasEscalated` |

Data lands in `ai_usage_logs`.

Indexes relevant to T2:

- `(tenantId, createdAt)` supports tenant-window quota and reporting.
- `(tenantId, userId)` supports user-level views.

### Quota And Cost Guard

Before T1:

- `checkQuota()` and `enforceQuota()` implemented monthly tenant quotas.
- Monthly limits came from `Tenant.maxAiCalls`, `tenant.settings.ai_monthly_quota`, `tenant.settings.ai.monthly_quota`, or plan defaults.

After T1:

- `enforceQuota()` first checks the tenant daily quota.
- `checkDailyTenantQuota()` counts existing `AIUsageLog` records within the current UTC day.
- `enforceDailyTenantQuota()` throws `AppError('QUOTA_EXCEEDED', 429, ...)` with structured details when exhausted.

Daily quota details:

| Field | Value |
| --- | --- |
| Env | `AI_DAILY_CALL_LIMIT_PER_TENANT` |
| Default | `200` calls per tenant per UTC day |
| Dimension | tenant x UTC day |
| Storage | existing `AIUsageLog` |
| Reset | next UTC midnight |
| Schema change | none |

---

## AI Callsite Inventory

### Calls Through `getRouterForTenant()`

These callsites use the canonical model router directly:

- `src/modules/ai/services/ai-request-router.ts`
- `src/modules/ai/services/content-service.ts`
- `src/modules/ai/services/content-plan-service.ts`
- `src/modules/ai/services/funnel-builder-service.ts`
- `src/modules/ai/services/funnel-copy-service.ts`
- `src/modules/ai/services/lead-analysis-service.ts`
- `src/modules/ai/services/whatsapp-reply-service.ts`
- `src/modules/brand-builder/services/bio-service.ts`
- `src/modules/brand-builder/services/brand-interview-service.ts`
- `src/modules/brand-builder/services/content-calendar-service.ts`
- `src/modules/brand-builder/services/content-insights-service.ts`
- `src/modules/brand-builder/services/username-service.ts`
- `src/modules/brand-builder/services/video-script-service.ts`
- `src/modules/funnel/services/funnel-strategy-service.ts`
- `src/modules/video/services/ai-video-prompt-service.ts`
- `src/modules/video/services/broll-service.ts`
- `src/modules/video/services/capcut-service.ts`
- `src/modules/video/services/master-script-service.ts`
- `src/modules/video/services/platform-adaptation-service.ts`
- `src/modules/video/services/shot-list-service.ts`
- `src/modules/video/services/video-strategy-service.ts`
- `src/app/api/v1/ai/generate/content/stream/route.ts`
- `src/app/api/v1/ai/router/preview/route.ts`

### Calls Through Legacy Provider Fallback

These use `generateWithFallback()` from `src/modules/ai/providers/factory.ts`, not the tenant router:

- `src/modules/member/services/onboarding-service.ts`
- `src/modules/voice/services/voice-service.ts`

This is a compatibility path, but T2 should not copy it.

### Direct Provider SDK Calls

The provider implementation files are expected to call SDKs directly:

- `src/modules/ai/providers/openai.ts`
- `src/modules/ai/providers/anthropic.ts`
- `src/modules/ai/providers/deepseek.ts`
- `src/modules/ai/providers/gemini.ts`
- `src/modules/ai/providers/minimax.ts`

Direct provider calls outside the provider layer:

- `src/app/api/v1/ai/generate/image/route.ts`
  - constructs OpenAI client directly for image generation
  - calls `openai.images.generate()`
  - enforces quota and logs usage, but bypasses the text router
- `src/modules/voice/services/voice-service.ts`
  - constructs OpenAI client directly for transcription
  - calls `audio.transcriptions.create()`

These were recorded only. T1 did not migrate direct provider usage.

---

## Readiness Against T2 Requirements

| Requirement | Status | Evidence / Gap |
| --- | --- | --- |
| Conversational service can route LLM generation | Ready with constraint | Use `routeAiRequest()` or `getRouterForTenant()` from `modules/ai`; avoid direct provider calls. |
| Repeated user-triggered LLM calls have a tenant daily cap | Ready after T1 | `AI_DAILY_CALL_LIMIT_PER_TENANT`, default `200`, tenant x UTC day. |
| Per-tenant monthly quota remains intact | Ready | Existing `enforceQuota()` still checks monthly quota after daily quota. |
| Structured over-limit behavior | Ready | `AppError` code `QUOTA_EXCEEDED`, status semantics `429`, details include scope/window/used/limit/resetAt. |
| Usage logging supports tenant/user/feature cost visibility | Partially ready | `AIUsageLog` records tenant, user, feature, tokens, cost, routing metadata. |
| Admin advisor exposes tenant cost dashboard | Gap | `router-advisor.ts` does not load persisted usage and leaves `costsByTenant` empty. |
| Provider fallback exists for non-streaming paths | Ready with caveat | `AIRouter` retries/escalates; `fallback-handler` returns sanitized failure responses. |
| Streaming fallback parity | Gap | Streaming route uses model selection but not the full retry/fallback chain. |
| No direct provider bypasses | Gap | Image generation and voice transcription directly call OpenAI; onboarding/voice extraction use legacy `generateWithFallback()`. |
| T2 can show per-discussion cost awareness | Partially ready | Logs have call/token/cost data; T3 still needs UI/service aggregation for "this discussion used N calls". |

---

## T2 Implementation Guidance

T2 should:

1. Use `modules/ai` as the only generation boundary.
2. Call `enforceQuota()` before each user-triggered discussion generation.
3. Log every generation through `logAIUsage()` with a dedicated feature name such as `ai_discussion`.
4. Return friendly quota messaging when `QUOTA_EXCEEDED` is raised.
5. Keep `NEXT_PUBLIC_ENABLE_AI_DISCUSSION` default off until E2E and production observation are complete.
6. Cap conversation rounds separately from quota, as required by the OS 3.5 Blueprint.

T2 should not:

1. Construct provider SDK clients directly.
2. Use `generateWithFallback()` as the new conversation path.
3. Add a Prisma table for quota counting unless a future audit proves `AIUsageLog` cannot support the access pattern.
4. Expose raw provider errors, prompts, tenant IDs, user IDs, tokens, API keys, cookies, headers, or credentials in user-facing responses or logs.

---

## Follow-Up Items

1. Migrate legacy text callsites from `generateWithFallback()` to the canonical router.
2. Decide whether image generation and voice transcription should be documented exceptions or wrapped by a provider-safe AI boundary.
3. Connect `router-advisor.ts` to persisted usage data so `costsByTenant` is meaningful.
4. Add streaming fallback parity or explicitly document streaming's different reliability contract.
5. Build T3 discussion-level cost visibility from `AIUsageLog` after T2 creates stable `feature` naming.
