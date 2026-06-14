# V5-4 — ai-agents → ai Merge Report

**Date:** 2026-06-14  
**Scope:** Merge `src/modules/ai-agents` into unified `src/modules/ai`  
**Status:** ✅ Complete — FINAL AI DOMAIN MERGE

---

## Files Moved (14)

| Source | Destination |
|---|---|
| `ai-agents/types.ts` | `ai/types/agents.ts` |
| `ai-agents/agentRegistry.ts` | `ai/services/agent-registry.ts` |
| `ai-agents/agentManager.ts` | `ai/services/agent-manager.ts` |
| `ai-agents/agentMemoryService.ts` | `ai/services/agent-memory.ts` |
| `ai-agents/workforceOrchestrator.ts` | `ai/services/workforce-orchestrator.ts` |
| `ai-agents/agents/brandStrategistAgent.ts` | `ai/agents/brand-strategist.ts` |
| `ai-agents/agents/ceoAdvisorAgent.ts` | `ai/agents/ceo-advisor.ts` |
| `ai-agents/agents/contentDirectorAgent.ts` | `ai/agents/content-director.ts` |
| `ai-agents/agents/crmManagerAgent.ts` | `ai/agents/crm-manager.ts` |
| `ai-agents/agents/funnelArchitectAgent.ts` | `ai/agents/funnel-architect.ts` |
| `ai-agents/agents/salesCoachAgent.ts` | `ai/agents/sales-coach.ts` |
| `ai-agents/agents/trafficStrategistAgent.ts` | `ai/agents/traffic-strategist.ts` |
| `ai-agents/agents/videoProducerAgent.ts` | `ai/agents/video-producer.ts` |
| `ai-agents/components/WorkforceDashboard.tsx` | `ai/components/WorkforceDashboard.tsx` |

## External Consumers (3 files)

| File | Imports Changed |
|---|---|
| `app/api/v1/ai-workforce/route.ts` | `agentManager`, `agentMemoryService` → ai/services |
| `app/api/v1/ai-workforce/execute/route.ts` | `agentManager`, `orchestrateForGoal`, `agentMemoryService` → ai/services |
| `app/(auth)/ai-workforce/page.tsx` | `WorkforceDashboard` → ai/components |

## Verification

```
$ pnpm type-check
✓ tsc --noEmit — 0 errors

$ pnpm build
✓ Compiled successfully
✓ Generating static pages (208/208)
```

## Final V5 AI Domain Structure

```
src/modules/ai/
├── types/
│   ├── types.ts           (placeholder)
│   ├── requests.ts        ← was ai-router/types
│   └── agents.ts          ← was ai-agents/types
├── providers/             (5 SDK integrations)
├── router/                (model registry, task classifier, cost optimizer)
├── services/              (8 feature + 7 router + 5 agent services = 20)
├── agents/                ← 8 business audit agents
├── hooks/                 (3 React Query hooks)
├── components/            (10 UI components incl. WorkforceDashboard)
├── prompt/                (resolver, validator)
├── usage/                 (quota, tracker)
└── seed/
```

## Cumulative V5 Progress

| Phase | Action | Result |
|---|---|---|
| V5-1 | Model registry dedup | 3 sources → 1 canonical |
| V5-2 | Task classification unified | 14 + 16 → 30 categories |
| V5-3 | ai-router → ai | 8 files moved |
| V5-4 | ai-agents → ai | 14 files moved |
| **V5-5** | **Barrel export** | **Final cleanup** |
