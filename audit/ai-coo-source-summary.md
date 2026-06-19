# AI COO Source Summary

## Runtime Reality

There is no single AI COO authority in the repo today.

Current runtime splits AI COO-like behavior across:

- recommendation systems
- strategic business recommendation systems
- workforce assignment systems
- multi-agent orchestration systems
- dashboard AI recommendation panels

## Source Clusters

### 1. Tactical AI Coaching

Primary sources:

- `src/modules/ai-coach/ai-coach-service.ts`
- `src/app/api/v1/ai/coach/recommend/route.ts`
- `src/modules/dashboard/components/AICoachCard.tsx`
- `src/app/(auth)/ai/coach/page.tsx`

What this cluster answers:

- what the user should do next
- why that action matters
- which product route they should enter next

Why it matters:

- this is already an active recommendation authority
- but it is split between mission-driven logic and metrics-driven logic

### 2. Executive / Strategic AI Recommendation

Primary sources:

- `src/modules/business-intelligence/ceoAdvisorEngine.ts`
- `src/app/api/v1/business-intel/route.ts`
- `src/modules/business-intelligence/components/CEOAdvisorDashboard.tsx`

What this cluster answers:

- biggest bottlenecks
- biggest opportunities
- recommended AI agents
- recommended automations
- next best business actions

Why it matters:

- this is the strongest existing strategic recommendation surface
- it already does partial delegation and assignment by emitting `agentRecommended`

### 3. Workforce Assignment And Execution

Primary sources:

- `src/modules/ai/services/agent-registry.ts`
- `src/modules/ai/services/agent-manager.ts`
- `src/modules/ai/services/workforce-orchestrator.ts`
- `src/app/api/v1/ai-workforce/route.ts`
- `src/app/api/v1/ai-workforce/execute/route.ts`
- `src/modules/ai/components/WorkforceDashboard.tsx`

What this cluster answers:

- which agents are available
- which agents are recommended
- which agent or agents should execute
- how to dispatch execution

Why it matters:

- this is the strongest existing runtime execution and assignment surface
- it is the closest thing to an AI COO execution core
- but it still has multiple assignment strategies:
  - mission-stage mapping
  - keyword goal mapping
  - default recommended-agent slice

### 4. Legacy / Parallel Dashboard Recommendation

Primary source:

- `src/modules/dashboard/components/AiRecommendationPanel.tsx`

What this cluster answers:

- onboarding/journey recommendations
- suggested routes based on legacy completion checks

Why it matters:

- this is a separate recommendation authority on the dashboard
- it is not aligned with the workforce or CEO recommendation systems

## Effective Runtime Winners By Surface

| Surface | Effective Source | What It Decides |
| --- | --- | --- |
| `/dashboard` coach card | `/api/v1/ai/coach/recommend` | tactical next action and CTA |
| `/dashboard` legacy recommendation panel | `AiRecommendationPanel.generateRecommendations()` | rule-based onboarding/journey recommendations |
| `/ai/coach` | `/api/v1/ai/coach/recommend` | tactical next action and health snapshot |
| `/ceo-mode` | `ceoAdvisorEngine.generateCEOReport()` | strategic actions, agent recommendations, automation recommendations |
| `/ai-workforce` | `agentManager.getWorkforceState()` + `agent-registry` | available and recommended agents |
| `/api/v1/ai-workforce/execute` single agent | `agentManager.executeAgent()` | direct execution routing |
| `/api/v1/ai-workforce/execute` multi goal | `workforce-orchestrator.orchestrateForGoal()` | delegated multi-agent workflow |
| `/api/v1/ai-workforce/execute` default path | `agentManager.getRecommendedAgents()` | stage-based recommended agent execution |

## Best Current Candidate Sources

Strongest reusable sources by role:

| Authority Role | Strongest Current Source |
| --- | --- |
| Recommendation | `ceoAdvisorEngine` for strategic recommendation, `/api/v1/ai/coach/recommend` for tactical recommendation |
| Delegation | `workforce-orchestrator.orchestrateForGoal()` |
| Assignment | `agentManager.getRecommendedAgents()` + `agent-registry.getAgentsForMissionStage()` |
| Routing | `agentManager.executeAgent()` / `executeMultiAgent()` |

## Main Duplicate Authority Findings

1. AI Coach is split:
   - mission-aware coaching service
   - DB-metric tactical recommendation route

2. CEO Advisor and workforce orchestration overlap:
   - CEO Advisor recommends agents and routes
   - workforce orchestrator actually selects agent chains

3. Assignment is split:
   - mission stage mapping
   - keyword-goal mapping
   - business-opportunity mapping

4. Dashboard still carries a separate recommendation engine:
   - `AiRecommendationPanel`

## COOPlan Mapping

Current source-to-COOPlan mapping:

| Current Source | Likely COOPlan Area |
| --- | --- |
| `ceoAdvisorEngine.actions` | recommendations |
| `ceoAdvisorEngine.agentRecommendations` | assignments |
| `ai-coach-service` | recommendations |
| `/api/v1/ai/coach/recommend` | recommendations |
| `agentManager.getRecommendedAgents` | assignments |
| `workforce-orchestrator.orchestrateForGoal` | delegations, execution plans |
| `agentManager.executeMultiAgent` | execution plans |
| `AiRecommendationPanel.generateRecommendations` | legacy recommendations |

## Final Source Assessment

The current repo already has enough AI orchestration behavior that AI COO discovery is a real authority audit, not a greenfield design exercise.

But current runtime is still fragmented:

- tactical recommendation
- strategic recommendation
- agent assignment
- execution routing

all live in separate source clusters.

So the factual conclusion is:

`AI COO is currently a multi-source runtime, not a single authority.`
