# AI COO Read / Write Authority Map

## Overview

This map separates:

- read authority: who consumers trust today
- write authority: who mutates AI delegation or execution state today

## 1. Recommendations

### Read Authority

Primary read authorities:

- `/api/v1/ai/coach/recommend`
- `ai-coach-service`
- `AiRecommendationPanel.generateRecommendations()`
- `ceoAdvisorEngine.generateCEOReport()`

Main trusting consumers:

- `AICoachCard`
- `/ai/coach`
- `useDashboardMission()`
- `DashboardV4`
- `AiRecommendationPanel`
- `CEOAdvisorDashboard`

### Write Authority

There is no persistence writer for recommendation truth.

Recommendations are derived at read time from:

- mission/task context
- live DB metrics
- business-intelligence diagnosis
- local rule heuristics

Judgment:

- recommendation authority is a read-time problem, not a persistence-write problem

## 2. Delegations

### Read Authority

Primary read authorities:

- `workforce-orchestrator.orchestrateForGoal()`
- default delegation branch in `/api/v1/ai-workforce/execute`
- `ceoAdvisorEngine` as strategic delegation hint producer

Main trusting consumers:

- `/api/v1/ai-workforce/execute`
- `WorkforceDashboard`
- `CEOAdvisorDashboard`

### Write Authority

Execution-side writers:

- `/api/v1/ai-workforce/execute` writes remembered reports through `agentMemoryService.remember()`

Delegation selection writers:

- none persist a canonical delegation plan

Judgment:

- delegation is currently chosen at execution time
- execution artifacts are persisted as memory, not as canonical delegation truth

## 3. Assignments

### Read Authority

Primary read authorities:

- `agentManager.getRecommendedAgents()`
- `agent-registry.getAgentsForMissionStage()`
- `workforce-orchestrator` keyword agent selection
- `ceoAdvisorEngine.agentRecommendations`

Main trusting consumers:

- `/api/v1/ai-workforce`
- `/api/v1/ai-workforce/execute`
- `WorkforceDashboard`
- `CEOAdvisorDashboard`

### Write Authority

There is no persistent assignment writer.

Assignments are derived at read/execution time from:

- journey stage
- goal keywords
- business opportunity analysis
- available plan-gated registry entries

Judgment:

- assignment authority is also a read-time problem today

## 4. Routing

### Read Authority

Two routing read authorities exist:

1. UI CTA routing:
   - coach route `actionHref`
   - CEO Advisor `actions[].route`
   - recommendation panel `route`

2. execution dispatch routing:
   - `agentManager.executeAgent()`
   - `agentManager.executeMultiAgent()`
   - `workforce-orchestrator.orchestrateForGoal()`

Main trusting consumers:

- `AICoachCard`
- `/ai/coach`
- `AiRecommendationPanel`
- `CEOAdvisorDashboard`
- `WorkforceDashboard`
- `/api/v1/ai-workforce/execute`

### Write Authority

Execution-side writers:

- `/api/v1/ai-workforce/execute` persists execution reports into agent memory

UI route hints:

- no canonical writer; routes are emitted in read-time response payloads

Judgment:

- routing truth is split between:
  - read-time CTA routing
  - runtime execution dispatch

## 5. Surface-Level Read / Write Winners

| Surface | Read Authority Winner | Write Authority Winner |
| --- | --- | --- |
| `AICoachCard` | `/api/v1/ai/coach/recommend` | none |
| `/ai/coach` | `/api/v1/ai/coach/recommend` | none |
| `DashboardV4` | `ai-coach-service` through `useDashboardMission()` | none |
| `AiRecommendationPanel` | local rule engine | none |
| `CEOAdvisorDashboard` | `ceoAdvisorEngine.generateCEOReport()` | none |
| `WorkforceDashboard` | `/api/v1/ai-workforce` and `/api/v1/ai-workforce/execute` | `/api/v1/ai-workforce/execute` via agent memory |
| `/api/v1/ai-workforce/execute` | orchestration / assignment / routing runtime | `agentMemoryService.remember()` |

## Final Read / Write Assessment

AI COO read authority is fragmented across:

- tactical recommendation
- strategic recommendation
- stage-based assignment
- goal-based orchestration
- UI route hints

AI COO write authority is minimal and narrow:

- execution reports are written to agent memory
- recommendations, delegations, assignments, and route plans are not persisted as one canonical object

So for AI COO, the real duplication is overwhelmingly on the read side, not the write side.
