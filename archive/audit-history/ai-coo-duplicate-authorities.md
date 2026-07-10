# AI COO Duplicate Authorities

## Duplicate Authority Summary

AI COO does not exist as a single runtime authority today.

Current duplication appears across four decision layers:

1. recommendation authorities
2. delegation authorities
3. assignment authorities
4. execution routing authorities

## 1. Duplicate Recommendation Authorities

### A. AI Coach route vs AI Coach service

Sources:

- `src/app/api/v1/ai/coach/recommend/route.ts`
- `src/modules/ai-coach/ai-coach-service.ts`

Conflict:

- the route recommends from live DB metrics like followups, leads, content, daily actions, and funnels
- the service recommends from mission id and completed task count

Result:

- there is no single recommendation contract for “AI Coach”
- one source is metrics-driven
- one source is mission-driven

### B. AI Coach stack vs dashboard recommendation panel

Sources:

- `AICoachCard` via `/api/v1/ai/coach/recommend`
- `AiRecommendationPanel.generateRecommendations()`

Conflict:

- `AICoachCard` recommends operational work based on current CRM/content/funnel context
- `AiRecommendationPanel` recommends onboarding/journey actions based on legacy `completedChecks`

Result:

- dashboard currently has two distinct AI recommendation systems

### C. AI Coach stack vs CEO Advisor

Sources:

- `AI Coach` recommendation route/service
- `ceoAdvisorEngine.generateCEOReport()`

Conflict:

- AI Coach recommends immediate tactical work
- CEO Advisor recommends top bottlenecks, top opportunities, AI agents, automation, and routes

Result:

- recommendation authority is already split between coaching and executive planning

## 2. Duplicate Delegation Authorities

### A. `ceoAdvisorEngine` vs `workforce-orchestrator`

Sources:

- `ceoAdvisorEngine.actions[]` with `agentRecommended` and route hints
- `orchestrateForGoal()` with actual multi-agent workflow selection

Conflict:

- CEO Advisor recommends which agent should help
- workforce orchestrator actually chooses an agent chain for a user goal

Result:

- delegation exists in two parallel systems:
  - business diagnosis and opportunity layer
  - goal-to-agent workflow layer

### B. `workforce-orchestrator` vs default branch in `/api/v1/ai-workforce/execute`

Sources:

- explicit `orchestrateForGoal()`
- default `getRecommendedAgents(...).slice(0, 2)` path in execution route

Conflict:

- one delegation path is keyword-goal driven
- one delegation path is stage-driven

Result:

- even inside workforce execution, there are two delegation strategies

## 3. Duplicate Assignment Authorities

### A. `agent-registry.getAgentsForMissionStage()` vs `ceoAdvisorEngine.agentRecommendations`

Sources:

- stage-to-agent map in `agent-registry`
- business-health opportunity recommendations in `ceoAdvisorEngine`

Conflict:

- `agent-registry` assigns agents from mission stage taxonomy
- CEO Advisor assigns agents from business opportunity and bottleneck analysis

Result:

- agent assignment is split between journey-driven and business-diagnosis-driven systems

### B. `agentManager.getRecommendedAgents()` vs keyword workflow assignment

Sources:

- `agentManager.getRecommendedAgents(currentStage, plan)`
- `workforce-orchestrator` keyword matching

Conflict:

- one assignment source is mission stage
- one assignment source is natural-language goal category

Result:

- no single assignment authority exists

## 4. Duplicate Routing Authorities

### A. Agent routing in `agentManager.executeAgent()` vs route hints in CEO Advisor

Sources:

- runtime executor dispatch in `agentManager`
- route outputs like `/ai-workforce`, `/content-engine`, `/automation` in CEO Advisor

Conflict:

- one routing system chooses execution target agent
- one routing system chooses product surface/CTA for the user

Result:

- routing is split between execution routing and UI routing

### B. Multi-agent workflow routing vs direct single-agent routing

Sources:

- `orchestrateForGoal()`
- `executeAgent()`

Conflict:

- one path executes a composed agent chain
- one path routes directly to a single agent

Result:

- execution routing has two competing modes

## 5. Candidate Keep / Adapter / Retire Assessment

| Source | Assessment | Reason |
| --- | --- | --- |
| `agent-registry.ts` | KEEP | strongest explicit agent capability and stage-map registry |
| `agentManager` | KEEP | strongest runtime assignment and execution dispatcher |
| `workforce-orchestrator.ts` | KEEP | strongest explicit multi-agent delegation path |
| `/api/v1/ai-workforce/execute` | ADAPTER | runtime entrypoint, but currently mixes three execution strategies |
| `/api/v1/ai-workforce` | ADAPTER | state surface around workforce selection |
| `ceoAdvisorEngine` | ADAPTER | strong strategic recommendation surface, but not clean canonical AI COO yet |
| `ai-coach-service.ts` | ADAPTER | tactical coaching copy, not canonical delegation authority |
| `/api/v1/ai/coach/recommend` | ADAPTER | operational recommendation source, not canonical delegation authority |
| `AiRecommendationPanel.tsx` | RETIRE / ADAPTER | legacy dashboard AI recommendation logic built on old mission checks |

## Final Duplicate Authority Judgment

The biggest duplication is not “too many AI files.”
The biggest duplication is that the repo already has different systems answering different versions of:

- what should happen
- who should help
- which agent should run
- which route the user should take next

Current runtime duplicate centers:

1. AI Coach recommendation stack
2. CEO Advisor strategic assignment
3. workforce orchestrator
4. stage-based recommended agents
5. dashboard legacy recommendation panel
