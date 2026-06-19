# Agent Runtime Duplicate Authorities

Scope: duplicate source detection for V7.5 Agent Runtime.

This report documents current runtime reality only.

## Final Duplicate Authority Judgment

Agent Runtime has active duplicate authorities in three areas:

- execution routing
- agent assignment / recommendation
- lifecycle state

Memory is less duplicated, but it is weakly modeled because it is stored in `user.metadata.agent_memory` rather than a dedicated execution log.

## 1. Duplicate Execution Authorities

### Duplicate A: Single-agent execution vs multi-agent execution

Sources:

- `agentManager.executeAgent()`
- `agentManager.executeMultiAgent()`
- `POST /api/v1/ai-workforce/execute`
- `workforce-orchestrator.orchestrateForGoal()`

Current behavior:

- `executeAgent()` runs one executor selected by `agentId`
- `executeMultiAgent()` loops over multiple `agentId`s and aggregates reports
- `orchestrateForGoal()` chooses a multi-agent chain from goal keywords, then calls `executeMultiAgent()`
- `POST /api/v1/ai-workforce/execute` chooses which path runs

Why this is duplicate authority:

- the API route owns branch selection
- the orchestrator owns keyword-to-agent selection
- the manager owns actual executor dispatch
- multi-agent sequencing is split between route, orchestrator, and manager

Current winner:

- entrypoint-based
- route body decides whether `multi`, `agentId`, or default branch wins

Risk:

`High`

## 2. Duplicate Runtime Routing Authorities

### Duplicate A: Execute route branch routing

Source:

- `src/app/api/v1/ai-workforce/execute/route.ts`

Branches:

- `body.goal && body.multi` -> `orchestrateForGoal()`
- `body.agentId` -> `agentManager.executeAgent()`
- default -> `getRecommendedAgents()` plus `executeMultiAgent()`

This route is currently the strongest runtime routing authority.

### Duplicate B: Keyword goal routing

Source:

- `workforce-orchestrator.orchestrateForGoal()`

The orchestrator maps goal text to agent chains using keyword checks:

- lead/customer/sales -> brand, funnel, traffic, sales, CRM
- content/post -> brand, content, video
- brand/positioning -> brand
- video -> content, video
- traffic/ads -> funnel, traffic
- revenue/KPI/analysis -> CRM, CEO
- fallback -> first four available agents

### Duplicate C: Mission-stage routing

Source:

- `getAgentsForMissionStage()`
- `agentManager.getRecommendedAgents()`

This maps `userProgress.currentStageId` to recommended agents.

Conflict:

- goal keywords can recommend a different agent chain than mission stage
- direct agent execution bypasses both goal and stage routing

Current winner:

- multi-goal request: `workforce-orchestrator`
- single-agent request: direct `agentId`
- no explicit request: mission-stage routing

Risk:

`High`

## 3. Duplicate Lifecycle Authorities

### Duplicate A: Agent availability by plan

Source:

- `getAgentsForPlan()`

Owns:

- which agents are available for a tenant plan

### Duplicate B: Agent recommendation by mission stage

Source:

- `getAgentsForMissionStage()`
- `agentManager.getRecommendedAgents()`

Owns:

- which agents are recommended for current journey stage

### Duplicate C: Workforce health by available count

Source:

- `agentManager.getWorkforceState()`

Owns:

- `health: optimal | good | attention`

### Duplicate D: UI lifecycle display

Source:

- `WorkforceDashboard`

Owns:

- visible recommended badge
- visible recent reports
- visible execution pending state through React Query mutation state

Conflict:

There is no complete lifecycle model. The runtime has availability and recommendation state, but no durable queued/running/completed/failed execution state.

Risk:

`High`

## 4. Duplicate Memory Authorities

### Primary Memory Authority

Source:

- `agentMemoryService`
- `user.metadata.agent_memory`

This is the only direct agent memory storage found in the runtime chain.

### Adjacent AI Logging Authority

Source:

- `AIUsageLog` in Prisma
- AI usage tracker paths elsewhere in the AI module

This is AI usage telemetry, not Agent Runtime execution memory.

Conflict:

- agent reports are stored in `user.metadata.agent_memory`
- AI usage/cost logs are stored in `AIUsageLog`
- there is no single execution ledger that links report, runtime status, token usage, tool calls, and execution result

Risk:

`Medium`

## 5. Duplicate Tool Execution Authorities

### Agent executors as tool boundaries

Sources:

- `executeBrandStrategist()`
- `executeContentDirector()`
- `executeVideoProducer()`
- `executeFunnelArchitect()`
- `executeTrafficStrategist()`
- `executeSalesCoach()`
- `executeCRMManager()`
- `executeCEOAdvisor()`

Each executor directly imports domain services and decides what action/report to return.

Why this is duplicate authority:

- tool access is not centrally permissioned
- domain service reads are chosen inside each executor
- action routes are generated inside executors
- confidence scoring is local to each executor

Current winner:

- whichever executor is selected by `agentManager` or `workforce-orchestrator`

Risk:

`Medium`

## 6. Adjacent Non-Agent Execution Runtime

Source:

- `src/modules/automation/automationEngine.ts`

Why it matters:

- it has its own workflow execution model
- it executes actions and returns `WorkflowExecution`
- it writes leads and activities through Prisma

Why it is not the same authority:

- it is automation workflow execution, not AI Agent Runtime
- it is not consumed by `ai-workforce`
- it does not share `AgentExecutionReport`

Risk:

`Medium`

It should be tracked as adjacent execution authority, not as part of the current Agent Runtime source chain.

## Duplicate Authority Matrix

| Runtime Area | Duplicate Sources | Current Winner |
| --- | --- | --- |
| Single execution | `executeAgent()`, route direct branch, executor module | `agentId` branch in execute route |
| Multi execution | `executeMultiAgent()`, `orchestrateForGoal()`, route default branch | request shape decides |
| Agent selection | `getAgentsForMissionStage()`, `orchestrateForGoal()` keyword map, direct `agentId` | entrypoint decides |
| Availability | `getAgentsForPlan()`, `AGENT_REGISTRY.requiredPlan` | registry helper |
| Workforce health | `getWorkforceState()` | agent manager |
| Memory | `agentMemoryService`, adjacent `AIUsageLog` | `agentMemoryService` for reports |
| Tool execution | individual executor modules | selected executor |

## Retirement Candidates

Discovery-only candidate list:

- default recommended-agent branch inside `/api/v1/ai-workforce/execute` after canonical execution plan exists
- keyword-based agent chain selection in `workforce-orchestrator` if AI COO owns delegation plan
- stage-based assignment in `getAgentsForMissionStage()` if AI COO owns assignment
- local executor route/action generation if canonical runtime result contract owns action routing

These are not deletion recommendations yet. They are duplicate authority candidates for migration planning.

## Final Duplicate Authority Conclusion

The biggest duplicate authority is not memory. It is execution selection.

The runtime currently decides "what executes" through three different inputs:

- explicit `agentId`
- explicit goal keywords
- implicit mission stage recommendation

That means Agent Runtime is active, but its execution authority is entrypoint-based rather than canonical.
