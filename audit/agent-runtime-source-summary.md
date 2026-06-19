# Agent Runtime Source Summary

Scope: summary of TASK_013 Agent Runtime source audit.

## Runtime Reality

Agent Runtime already exists in the codebase as a partial live runtime.

It is not yet a canonical runtime module.

The strongest current chain is:

`AGENT_REGISTRY -> agentManager -> workforce-orchestrator -> /api/v1/ai-workforce/execute -> agentMemoryService`

## Main Source Clusters

### 1. Agent Definition And Availability

Primary files:

- `src/modules/ai/types/agents.ts`
- `src/modules/ai/services/agent-registry.ts`

What this cluster owns:

- agent IDs
- agent definitions
- required features
- required plans
- declared dependencies
- mission-stage-to-agent mapping

Current status:

`Active`

Risk:

`High`, because lifecycle, plan gating, dependencies, and stage assignment are all in one static registry layer.

### 2. Agent Execution Manager

Primary file:

- `src/modules/ai/services/agent-manager.ts`

What this cluster owns:

- dynamic executor dispatch
- single-agent execution
- multi-agent execution
- available agent state
- recommended agent state
- workforce health

Current status:

`Active`

Risk:

`High`, because it mixes execution, lifecycle, assignment, and aggregation.

### 3. Workforce Orchestration

Primary file:

- `src/modules/ai/services/workforce-orchestrator.ts`

What this cluster owns:

- keyword-based goal routing
- multi-agent chain selection
- delegation to `agentManager.executeMultiAgent()`

Current status:

`Active`

Risk:

`High`, because it is an execution router and assignment authority that can conflict with mission-stage recommendation.

### 4. Runtime API Boundary

Primary files:

- `src/app/api/v1/ai-workforce/route.ts`
- `src/app/api/v1/ai-workforce/execute/route.ts`

What this cluster owns:

- authenticated runtime reads
- execution entrypoint
- branch selection between multi-goal, single-agent, and default recommended execution
- memory writes after execution

Current status:

`Active`

Risk:

`High`, because the execute route is currently the strongest branch-selection authority.

### 5. Runtime Memory

Primary file:

- `src/modules/ai/services/agent-memory.ts`

What this cluster owns:

- `remember()`
- `recall()`
- storage in `user.metadata.agent_memory`
- retention of last 20 reports

Current status:

`Active`

Risk:

`High`, because this is runtime execution history stored in user metadata without a dedicated execution model.

### 6. Agent Executors

Primary files:

- `src/modules/ai/agents/brand-strategist.ts`
- `src/modules/ai/agents/content-director.ts`
- `src/modules/ai/agents/video-producer.ts`
- `src/modules/ai/agents/funnel-architect.ts`
- `src/modules/ai/agents/traffic-strategist.ts`
- `src/modules/ai/agents/sales-coach.ts`
- `src/modules/ai/agents/crm-manager.ts`
- `src/modules/ai/agents/ceo-advisor.ts`

What this cluster owns:

- domain service reads
- local findings
- local recommendations
- local confidence scores
- local action route generation

Current status:

`Active`

Risk:

`Medium to High`, depending on executor, because tool/domain access is distributed across executor files.

### 7. Runtime UI

Primary files:

- `src/app/(auth)/ai-workforce/page.tsx`
- `src/modules/ai/components/WorkforceDashboard.tsx`

What this cluster owns:

- runtime surface
- goal input
- direct agent execution button
- recent reports display
- recommended badge display

Current status:

`Active`

Risk:

`Medium`, because UI is a consumer, but it also determines whether the user sends direct agent execution or goal-based multi-agent execution.

## Execution Sources Identified

- `agentManager.executeAgent()`
- `agentManager.executeMultiAgent()`
- `workforce-orchestrator.orchestrateForGoal()`
- `POST /api/v1/ai-workforce/execute`
- eight executor functions under `src/modules/ai/agents`

## Routing Sources Identified

- request branch logic in `/api/v1/ai-workforce/execute`
- keyword routing in `workforce-orchestrator`
- mission-stage routing in `getAgentsForMissionStage()`
- executor dispatch in `AGENT_EXECUTORS`

## Lifecycle Sources Identified

- `AGENT_REGISTRY`
- `getAgentsForPlan()`
- `getAgentsForMissionStage()`
- `agentManager.getRecommendedAgents()`
- `agentManager.getWorkforceState()`
- `WorkforceState`

Current lifecycle is incomplete. It tracks availability, recommendation, active, recent reports, and health, but it does not persist queued/running/completed/failed/retried/cancelled states.

## Memory Sources Identified

- `agentMemoryService.remember()`
- `agentMemoryService.recall()`
- `user.metadata.agent_memory`

Adjacent but not equivalent:

- `AIUsageLog`

## Tool Execution Sources Identified

Agent executors are the current tool execution boundary.

They call domain services directly:

- Brand DNA
- Content Engine
- Video Production
- Lead Magnet
- Funnel Builder
- Traffic Engine
- WhatsApp AI
- CRM command center
- Analytics Center

## Main Duplicate Authority Findings

1. Execution selection is split between direct `agentId`, goal keyword orchestration, and default mission-stage recommendation.
2. Runtime routing is split between API branch logic, orchestrator keyword logic, and registry mission-stage logic.
3. Lifecycle is split between plan availability, stage recommendation, workforce health, and UI mutation state.
4. Memory has one active agent-memory store, but no dedicated execution log model.
5. Tool execution is distributed across executor modules with no centralized permission or side-effect boundary.

## Current Runtime Winner By Question

| Question | Current Winner |
| --- | --- |
| Which agents exist? | `AGENT_REGISTRY` |
| Which agents are available? | `getAgentsForPlan()` |
| Which agents are recommended for stage? | `getAgentsForMissionStage()` via `agentManager.getRecommendedAgents()` |
| Which agents run for a goal? | `workforce-orchestrator.orchestrateForGoal()` |
| Which execution branch runs? | `/api/v1/ai-workforce/execute` |
| Which executor runs? | `AGENT_EXECUTORS` in `agent-manager.ts` |
| Where reports are stored? | `agentMemoryService` in `user.metadata.agent_memory` |
| What recent reports are shown? | `GET /api/v1/ai-workforce` plus `WorkforceDashboard` |

## Final Summary

Agent Runtime is currently live but fragmented.

It has enough runtime behavior to justify migration planning later, but TASK_013 shows the current source truth is still distributed across:

- registry
- manager
- orchestrator
- API route branch logic
- executor modules
- metadata-backed memory
- UI-triggered execution mode

The next audit should be consumer-focused and should identify every surface that reads runtime state, triggers runtime execution, or displays runtime results.
