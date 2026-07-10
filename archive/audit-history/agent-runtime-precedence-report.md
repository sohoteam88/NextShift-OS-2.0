# Agent Runtime Precedence Report

Scope: TASK_015 Agent Runtime precedence audit.

Question:

`When multiple Agent Runtime sources disagree, who wins?`

This is current runtime reality only.

## Final Precedence Judgment

Agent Runtime precedence is not globally canonical today.

Current precedence is decided by:

1. request shape in `POST /api/v1/ai-workforce/execute`
2. goal keyword routing in `workforce-orchestrator`
3. mission-stage routing in `agent-registry`
4. plan availability filtering in `getAgentsForPlan()`
5. memory writes through `agentMemoryService`

The strongest runtime chain is:

`AGENT_REGISTRY -> agentManager -> workforce-orchestrator -> /api/v1/ai-workforce/execute -> agentMemoryService`

But the actual winner depends on which branch the execute route takes.

## 1. Execution Precedence

### Primary

`POST /api/v1/ai-workforce/execute`

Why:

- it receives the execution request
- it decides which runtime branch runs
- it calls either `orchestrateForGoal()`, `agentManager.executeAgent()`, or `agentManager.executeMultiAgent()`
- it writes execution results to memory after execution

### Secondary

`agentManager`

Why:

- `executeAgent()` owns executor dispatch
- `executeMultiAgent()` owns sequential multi-agent execution and report aggregation
- all execution paths eventually pass through `agentManager` except route-level branch selection

### Fallback

Default stage-based execution branch in `/api/v1/ai-workforce/execute`

Fallback chain:

`userProgress.currentStageId -> agentManager.getRecommendedAgents() -> agentManager.executeMultiAgent(recommended.slice(0, 2))`

### Conflict Rule

Current branch order in `POST /api/v1/ai-workforce/execute`:

1. if `body.goal && body.multi`, run `orchestrateForGoal()`
2. else if `body.agentId`, run `agentManager.executeAgent()`
3. else run stage-based recommended multi-agent execution

So if a request includes both `goal + multi` and `agentId`, the multi-goal branch wins.

## 2. Routing Precedence

### Primary

`POST /api/v1/ai-workforce/execute`

Why:

- it owns top-level route branch selection

### Secondary

`workforce-orchestrator.orchestrateForGoal()`

Why:

- once the multi-goal branch wins, it owns goal-to-agent-chain routing
- it maps goal keywords to agent sequences

### Fallback

`agentManager.getRecommendedAgents()`

Why:

- default execution uses `userProgress.currentStageId`
- stage mapping comes from `getAgentsForMissionStage()`
- plan availability is applied through `getAgentsForPlan()`

### Conflict Rule

Routing precedence is entrypoint-based:

- direct `agentId` bypasses goal and stage routing
- `goal + multi` bypasses stage routing
- no explicit routing input falls back to mission-stage routing

## 3. Lifecycle Precedence

### Primary

`AGENT_REGISTRY`

Why:

- it defines which agents exist
- it owns required plans, features, dependencies, labels, capabilities, and display metadata

### Secondary

`getAgentsForPlan()`

Why:

- it filters agent availability by tenant plan
- `agentManager.getAvailableAgents()` depends on it

### Fallback

`getAgentsForMissionStage()` through `agentManager.getRecommendedAgents()`

Why:

- if the question is "which agents should be recommended now?", stage mapping wins after availability filtering

### Conflict Rule

Lifecycle precedence is layered:

1. `AGENT_REGISTRY` defines possible agents
2. `getAgentsForPlan()` narrows possible agents to available agents
3. `getAgentsForMissionStage()` proposes recommended agents
4. `getRecommendedAgents()` intersects stage recommendations with plan availability
5. `getWorkforceState()` packages available/recommended/active/health for API consumers

If a stage recommends an agent that the plan does not allow, plan availability wins and removes it.

## 4. Memory Precedence

### Primary

`agentMemoryService`

Why:

- `remember()` is the only direct Agent Runtime report writer
- `recall()` is the only direct Agent Runtime report reader
- storage target is `user.metadata.agent_memory`

### Secondary

`AIUsageLog`

Why:

- it exists as AI usage/cost telemetry
- it does not store `AgentExecutionReport`
- it is adjacent AI logging, not Agent Runtime memory

### Fallback

No durable fallback exists.

If `agent_memory` is absent or malformed, `recall()` returns an empty array.

### Conflict Rule

For Agent Runtime reports:

- `agentMemoryService` wins
- `AIUsageLog` does not override agent memory
- recent report display uses `agentMemoryService.recall()` via `GET /api/v1/ai-workforce`

Retention rule:

- `remember()` keeps the last 20 reports
- `GET /api/v1/ai-workforce` returns the last 5 reports

## 5. Tool Execution Precedence

### Primary

Selected executor from `AGENT_EXECUTORS` in `agent-manager.ts`

Why:

- executor dispatch is keyed by `AgentId`
- each executor owns its domain reads, findings, recommendations, action routes, and confidence score

### Secondary

Domain services imported by each executor

Examples:

- Brand DNA services
- Content Engine services
- Video Production service
- Lead Magnet service
- Funnel Builder service
- Traffic Engine service
- WhatsApp AI service
- CRM command center service
- Analytics Center service

### Fallback

No central tool fallback exists.

If an executor throws, there is no route-level retry or tool fallback in the current Agent Runtime path.

### Conflict Rule

Whichever executor is selected by routing owns the report.

There is no central cross-agent conflict resolver for findings, recommendations, route actions, or confidence scores.

## Effective Winner Matrix

| Runtime Projection | Primary | Secondary | Fallback | Conflict Rule |
| --- | --- | --- | --- | --- |
| Execution | `/api/v1/ai-workforce/execute` | `agentManager` | default stage-based branch | request body branch order wins |
| Routing | execute route branch logic | `workforce-orchestrator` | `getRecommendedAgents()` | explicit request shape beats stage fallback |
| Lifecycle | `AGENT_REGISTRY` | `getAgentsForPlan()` | `getAgentsForMissionStage()` | plan availability filters stage recommendations |
| Memory | `agentMemoryService` | `AIUsageLog` as adjacent telemetry | empty array | `agent_memory` wins for reports |
| Tool Execution | selected executor | domain services | none | selected agent owns report |

## Strongest Runtime Chain

The strongest current chain for actual execution is:

`WorkforceDashboard -> POST /api/v1/ai-workforce/execute -> agentManager / workforce-orchestrator -> executor modules -> agentMemoryService -> GET /api/v1/ai-workforce -> WorkforceDashboard`

The strongest current chain for lifecycle display is:

`AGENT_REGISTRY -> getAgentsForPlan() -> getAgentsForMissionStage() -> agentManager.getWorkforceState() -> GET /api/v1/ai-workforce -> WorkforceDashboard`

## Final Precedence Conclusion

Current precedence is explicit enough to migrate later, but it is not canonical.

The system currently answers "who wins?" with:

`the execute route branch wins first; agentManager dispatch wins second; registry/lifecycle helpers win for availability and recommendation; agentMemoryService wins for reports.`
