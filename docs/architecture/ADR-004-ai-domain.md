# ADR-004: AI Domain Architecture

**Status:** Accepted
**Date:** 2026-06-15
**Deciders:** V5-1 through V5-5

## Context

The AI domain spanned 3 modules with duplicated model registries, competing task classifiers, and redundant provider definitions. `ai-router` wrapped `ai/router` while maintaining its own parallel model list. `ai-agents` implemented business-logic agents (no LLM calls) but was organizationally separate.

## Decision

### Unified Module Structure (V5)

```
src/modules/ai/
├── index.ts          ← Public barrel (65 exports)
├── types/            ← requests.ts, agents.ts
├── providers/        ← 5 SDK implementations (Anthropic, OpenAI, DeepSeek, Gemini, MiniMax)
├── router/           ← Model registry, task classifier, cost optimizer
├── services/         ← 20 services: content, lead-analysis, routing, agents...
├── agents/           ← 8 business audit agents
├── hooks/            ← useContentGenerator, useLeadAnalysis, useWhatsAppReply
├── components/       ← 10 UI components
├── prompt/           ← resolver, validator
└── usage/            ← quota, tracker
```

### Canonical Model Registry

`ai/router/model-registry.ts` is the **single source of truth** for 10 models across 5 providers. `ai-router/providerRegistry.ts` delegates to it via `getProviderSummaries()`.

### Unified Task Classification

14 `TaskCategory` + 16 `AITaskType` → **30 unified categories** in `task-classifier.ts`. Each category has proper tier assignment (S/A/B/C) with auto-escalation for large inputs.

### AI Request Flow

```
routeAiRequest(request)
  → enforceQuota()
  → decidePolicy(plan, taskType)
  → estimateCredits(taskType)
  → getAvailableProviders()
  → executeWithFallback(providers, retries)
  → normalizeResponse()
```

### Agent Architecture

8 agents execute business-logic checks (no LLM calls):
- Import domain service → inspect state → produce findings + recommendations
- Sequentially executed in dependency order (brand → content → funnel → traffic → sales → CRM → CEO)
- Reports stored in `User.metadata.agent_memory` (up to 20 entries per user)

## Consequences

- ✅ 3 model definition sources → 1 (V5-1)
- ✅ 2 task classification systems → 1 (V5-2)
- ✅ 3 modules → 1 (V5-3, V5-4)
- ✅ 65 public exports via barrel (V5-5)
- ✅ Zero cross-module AI imports
- ⚠️ `posthog-js` is an optional dependency (graceful degradation)
