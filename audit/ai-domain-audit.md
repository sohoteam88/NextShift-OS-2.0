# AI Domain Audit — V4 → V5 Architecture

**Date:** 2026-06-14
**Scope:** `src/modules/ai`, `ai-router`, `ai-agents`
**Method:** Full file-by-file export analysis + cross-module dependency mapping

---

## 1. Current Architecture

### Module Inventory

| Module | Files | Core Responsibility | Has DB Access | Has UI |
|---|---|---|---|---|
| `ai` | 28 | Multi-provider AI orchestration + content gen engine | ✅ (Prisma — usage logs, content, templates) | ✅ (9 components) |
| `ai-router` | 8 | Centralized AI request routing with plan-aware policy | ✅ (Prisma — tenant settings) | ❌ |
| `ai-agents` | 14 | Multi-agent business audit + recommendation system | ✅ (Prisma — agent memory) | ✅ (WorkforceDashboard) |

### Dependency Graph

```
                    ┌──────────────────────┐
                    │     ai (28 files)     │
                    │  providers, router,   │
                    │  services, hooks, UI  │
                    └─────┬──────────┬─────┘
                          │          │ imports
           ┌──────────────┘          └──────────────┐
           ▼                                        ▼
  ┌─────────────────┐                    ┌──────────────────┐
  │   ai-router      │                    │    ai-agents      │
  │   (8 files)      │                    │   (14 files)      │
  │                  │                    │                   │
  │ imports from:    │                    │ imports from:     │
  │  ai/router       │                    │  ai-router/types  │
  │  ai/usage/quota  │                    │  (for PlanTier)   │
  │                  │                    │                   │
  │ WRAPS ai/router  │                    │ No LLM calls —    │
  │ with plan policy │                    │ business logic    │
  └──────────────────┘                    │ only              │
                                          └──────────────────┘
```

---

## 2. Overlap Matrix

### 2.1 Duplicated Model/Provider Definitions

| Concern | `ai/providers/` | `ai/router/model-registry.ts` | `ai-router/providerRegistry.ts` | Severity |
|---|---|---|---|---|
| Provider list | 5 providers (classes) | — | 5 providers (env-key detection) | 🟡 MEDIUM |
| Model list | In each provider class | 10 models with costs | In each provider info object | 🔴 CRITICAL |
| Model costs | — | `costPer1MInput/Output` | — | 🟡 MEDIUM |
| Provider capabilities | `supportsStreaming` | `supportsStreaming`, `supportsJson` | `supportsJson`, `supportsStreaming` | 🟠 HIGH |

**Root cause:** `ai/providers/` defines actual SDK integrations (classes), `ai/router/model-registry.ts` defines a static model metadata table for routing decisions, and `ai-router/providerRegistry.ts` defines yet another provider capability table for env-key detection. Three different lists of the same providers/models, maintained independently.

### 2.2 Duplicated Task Classification

| Concern | `ai/router/task-classifier.ts` | `ai-router/types.ts` + `aiModelRouter.ts` | Severity |
|---|---|---|---|
| Task categories | 14 `TaskCategory` values | 16 `AITaskType` values → mapped to 4 categories | 🔴 CRITICAL |
| Tier classification | S/A/B/C with auto-escalation | Plan-tier based restrictions (free/starter/pro/agency) | 🟠 HIGH |
| Classification logic | `classifyTask()` function | `mapToTaskCategory()` helper | 🟠 HIGH |

**Root cause:** `ai-router` wraps `ai/router` but redefines task types instead of extending them. The `mapToTaskCategory()` function bridges the two type systems.

### 2.3 Duplicated Cost/Quota Logic

| Concern | `ai/usage/quota.ts` | `ai-router/costEstimator.ts` | `ai-router/aiModelRouter.ts` | Severity |
|---|---|---|---|---|
| Quota enforcement | `enforceQuota()` throwing QUOTA_EXCEEDED | — | Calls `enforceQuota()` directly | 🟡 MEDIUM |
| Credit estimation | — | `estimateCredits(taskType)` | — | 🟡 (unique to ai-router) |
| USD cost | `tracker.calculateCost()` | `estimateCost_USD(taskType)` | — | 🟠 HIGH |
| Cost optimization | `router/cost-optimizer.ts` | — | — | 🟡 (unique to ai) |

### 2.4 Duplicated Plan/Premium Logic

| Concern | `ai-router/modelPolicyEngine.ts` | `ai-agents/agentRegistry.ts` | Severity |
|---|---|---|---|
| Plan tier gates | `decidePolicy(plan, task)` — model allowlists per plan | `getAgentsForPlan(plan)` — agent allowlists per plan | 🟠 HIGH |
| Premium features | Free/starter block premium models | Free/starter block premium agents (ceo, crm) | 🟡 MEDIUM |

### 2.5 Cross-Module Import Audit

```
ai-router → ai (router/*, usage/quota)     ← WRAPS, not replaces
ai-agents → ai-router (types)              ← imports PlanTier only
ai → NONE of the other two                 ← ai is self-contained
```

---

## 3. Merge Candidates

### Priority 1 — Merge `ai-router` → `ai`

**`ai-router` is essentially a wrapper layer over `ai/router`.** It adds plan-aware policy enforcement, cost estimation, and a standardized response envelope. All of these could live in `ai/` directly.

| ai-router file | Merge target in ai/ |
|---|---|
| `types.ts` | `ai/types/ai-router.ts` (extract from placeholder `types.ts`) |
| `aiModelRouter.ts` | `ai/services/ai-request-router.ts` |
| `aiRouterAdvisor.ts` | `ai/services/router-advisor.ts` |
| `costEstimator.ts` | `ai/services/cost-estimator.ts` |
| `fallbackHandler.ts` | `ai/services/fallback-handler.ts` |
| `modelPolicyEngine.ts` | `ai/services/model-policy-engine.ts` |
| `providerRegistry.ts` | `ai/services/provider-registry.ts` |
| `responseNormalizer.ts` | `ai/services/response-normalizer.ts` |

### Priority 2 — Merge `ai-agents` → `ai`

**`ai-agents` is a business-logic orchestration layer.** It does NOT make LLM calls — it calls domain services (brand DNA, funnel builder, CRM, etc.) and produces structured reports. Its only AI dependency is `PlanTier` from `ai-router`.

| ai-agents file | Merge target in ai/ |
|---|---|
| `types.ts` | `ai/types/ai-agents.ts` |
| `agentRegistry.ts` | `ai/services/agent-registry.ts` |
| `agentManager.ts` | `ai/services/agent-manager.ts` |
| `agentMemoryService.ts` | `ai/services/agent-memory.ts` |
| `workforceOrchestrator.ts` | `ai/services/workforce-orchestrator.ts` |
| `agents/*.ts` (8 files) | `ai/agents/*.ts` |
| `components/WorkforceDashboard.tsx` | `ai/components/WorkforceDashboard.tsx` |

### Priority 3 — Deduplicate Model Registry

Consolidate 3 model definition sources into 1:

| Current | Action |
|---|---|
| `ai/providers/` (5 provider classes) | Keep as SDK abstraction layer |
| `ai/router/model-registry.ts` (10 models) | Make the SINGLE source of truth for model metadata |
| `ai-router/providerRegistry.ts` | Delete — use model-registry.ts instead |
| `ai-router/modelPolicyEngine.ts` | Refactor to use model-registry.ts for model lookups |

### Priority 4 — Unify Task Classification

| Current | Action |
|---|---|
| `ai/router/task-classifier.ts` (14 categories) | Keep as canonical, extend with ai-router's 16 task types |
| `ai-router/types.ts` (16 `AITaskType` values) | Merge into extended task-classifier |
| `ai-router/aiModelRouter.ts::mapToTaskCategory()` | Delete — use direct mapping from extended classifier |

### Priority 5 — Unify Cost Estimation

| Current | Action |
|---|---|
| `ai/usage/tracker.ts::calculateCost()` | Keep as canonical (reads model-registry) |
| `ai-router/costEstimator.ts` | Refactor to delegate to `tracker.calculateCost()` |
| `ai/router/cost-optimizer.ts` | Keep as analytics tool |

---

## 4. Recommended V5 AI Structure

```
src/modules/ai/
├── types/
│   ├── index.ts                      ← Re-exports all types
│   ├── providers.ts                  ← AIProvider, AIGenerateParams, etc.
│   ├── router.ts                     ← TaskCategory, RoutingDecision, RouterMode
│   ├── agents.ts                     ← AgentId, AgentDefinition, AgentExecutionReport
│   └── requests.ts                   ← RouterRequest, NormalizedResponse, PlanTier
│
├── providers/
│   ├── types.ts                      ← AIProvider interface (unchanged)
│   ├── factory.ts                    ← getProvider, generateWithFallback
│   ├── anthropic.ts, openai.ts, deepseek.ts, gemini.ts, minimax.ts
│
├── router/
│   ├── index.ts                      ← Barrel
│   ├── ai-router.ts                  ← AIRouter class (unchanged)
│   ├── model-registry.ts            ← SINGLE source of truth for 10 models
│   ├── task-classifier.ts           ← EXTENDED to 16+ task types
│   └── cost-optimizer.ts            ← Analytics (unchanged)
│
├── services/
│   ├── content-service.ts            ← (unchanged)
│   ├── template-service.ts           ← (unchanged)
│   ├── whatsapp-reply-service.ts     ← (unchanged)
│   ├── lead-analysis-service.ts      ← (unchanged)
│   ├── funnel-copy-service.ts        ← (unchanged)
│   ├── funnel-builder-service.ts     ← (unchanged)
│   ├── content-plan-service.ts       ← (unchanged)
│   ├── ai-request-router.ts          ← was ai-router/aiModelRouter.ts
│   ├── model-policy-engine.ts        ← was ai-router/modelPolicyEngine.ts
│   ├── cost-estimator.ts             ← was ai-router/costEstimator.ts
│   ├── fallback-handler.ts           ← was ai-router/fallbackHandler.ts
│   ├── provider-registry.ts          ← was ai-router/providerRegistry.ts
│   ├── response-normalizer.ts        ← was ai-router/responseNormalizer.ts
│   ├── router-advisor.ts             ← was ai-router/aiRouterAdvisor.ts
│   ├── agent-registry.ts             ← was ai-agents/agentRegistry.ts
│   ├── agent-manager.ts              ← was ai-agents/agentManager.ts
│   ├── agent-memory.ts               ← was ai-agents/agentMemoryService.ts
│   └── workforce-orchestrator.ts     ← was ai-agents/workforceOrchestrator.ts
│
├── agents/
│   ├── brand-strategist.ts           ← was ai-agents/agents/brandStrategistAgent.ts
│   ├── ceo-advisor.ts
│   ├── content-director.ts
│   ├── crm-manager.ts
│   ├── funnel-architect.ts
│   ├── sales-coach.ts
│   ├── traffic-strategist.ts
│   └── video-producer.ts
│
├── hooks/
│   ├── use-content-generator.ts      ← (unchanged)
│   ├── use-lead-analysis.ts          ← (unchanged)
│   └── use-whatsapp-reply.ts         ← (unchanged)
│
├── components/
│   ├── AIPromptPanel.tsx             ← (unchanged)
│   ├── AIUsageMeter.tsx, ModelIndicator.tsx, StreamingText.tsx
│   ├── ContentGeneratorPanel.tsx, ContentHistory.tsx
│   ├── LeadAnalysisPanel.tsx, WhatsAppReplyPanel.tsx
│   ├── AITemplateManager.tsx
│   └── WorkforceDashboard.tsx        ← was ai-agents/components/
│
├── prompt/
│   ├── resolver.ts, validator.ts     ← (unchanged)
│
├── usage/
│   ├── quota.ts, tracker.ts          ← (unchanged)
│
├── seed/
│   └── default-templates.ts          ← (unchanged)
│
└── index.ts                          ← Public barrel export

# Modules to deprecate:
#   src/modules/ai-router/  → merged into ai/
#   src/modules/ai-agents/  → merged into ai/
```

---

## 6. Refactor Priority

| Phase | Task | Files | Effort | Risk |
|---|---|---|---|---|
| **V5-1** | Deduplicate model registry → single source of truth | 4 | Small | Low |
| **V5-2** | Unify task classification (14 + 16 → 1) | 3 | Small | Low |
| **V5-3** | Merge `ai-router` → `ai/` | ~10 | Medium | Medium |
| **V5-4** | Merge `ai-agents` → `ai/` | ~15 | Medium | Low |
| **V5-5** | Create barrel export and deprecation stubs | 3 | Small | Low |
| **V5-6** | Post-merge: rename files to kebab-case, organize subdirs | ~25 | Small | Low |

---

## 7. Summary Statistics

| Metric | Current (V4) | Target (V5) | Delta |
|---|---|---|---|
| AI domain modules | 3 | 1 | −2 |
| Model definition locations | 3 | 1 | −2 |
| Task type definitions | 2 (14 + 16) | 1 (unified) | −1 |
| Cost estimation implementations | 3 | 2 (canonical + analytics) | −1 |
| Provider registries | 2 | 1 | −1 |
| Total files | 50 | ~48 (deduplicated) | −2 |
| Cross-module imports | 5 | 0 (all internal) | −5 |

---

## 8. Migration Risk

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| `ai-router` wraps `ai/router` — merge could create circular deps | Medium | Low | ai/ already self-contained; merge direction is correct |
| Model registry dedup changes routing decisions | High | Low | Keep exact same model IDs and costs; rename only |
| `ai-agents` agents import domain modules outside ai/ | Low | Low | All agent dependencies are external domain modules (brand, funnel, CRM) — unchanged by merge |
| API routes currently import from 3 different modules | Medium | Medium | All route imports need updating; backward-compat stubs mitigate |
