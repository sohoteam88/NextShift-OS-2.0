# Agent Runtime Source Inventory

Scope: V7.5 Agent Runtime source audit.

Authority question:

`How is the work executed?`

This is discovery only. No migration or implementation recommendation is applied here.

## Inventory

| File Path | Source Name | Authority Role | Read Path | Write Path | Active Status | Migration Risk |
| --- | --- | --- | --- | --- | --- | --- |
| `src/modules/ai/types/agents.ts` | `AgentId` | Lifecycle | Imported by `agent-manager`, agent executors, `WorkforceDashboard`, API routes | Type only | Active | Medium |
| `src/modules/ai/types/agents.ts` | `AgentDefinition` | Lifecycle / Tool | Consumed by `agent-registry` and `WorkforceDashboard` | Type only | Active | Medium |
| `src/modules/ai/types/agents.ts` | `AgentExecutionInput` | Execution | Consumed by every agent executor and `agentManager.executeAgent()` | Type only | Active | Medium |
| `src/modules/ai/types/agents.ts` | `AgentExecutionReport` | Execution / Memory | Returned by all agent executors; stored by `agentMemoryService` | Type only | Active | High |
| `src/modules/ai/types/agents.ts` | `MultiAgentReport` | Execution / Routing | Returned by `workforce-orchestrator` and `executeMultiAgent()` | Type only | Active | High |
| `src/modules/ai/types/agents.ts` | `WorkforceState` | Lifecycle | Returned by `agentManager.getWorkforceState()` and read by `/api/v1/ai-workforce` | Type only | Active | High |
| `src/modules/ai/services/agent-registry.ts` | `AGENT_REGISTRY` | Lifecycle / Tool | Read by `getAgentsForPlan()`, `WorkforceDashboard`, and registry helpers | Static source | Active | High |
| `src/modules/ai/services/agent-registry.ts` | `getAgentsForPlan()` | Lifecycle | Read by `agentManager.getAvailableAgents()`, `agentManager.getRecommendedAgents()`, `workforce-orchestrator` fallback | Static source | Active | High |
| `src/modules/ai/services/agent-registry.ts` | `getAgentsForMissionStage()` | Lifecycle / Routing | Read by `agentManager.getRecommendedAgents()` | Static stage map | Active | High |
| `src/modules/ai/services/agent-manager.ts` | `AGENT_EXECUTORS` | Execution / Routing | Read by `agentManager.executeAgent()` | Dynamic imports to executor modules | Active | High |
| `src/modules/ai/services/agent-manager.ts` | `agentManager.executeAgent()` | Execution | Called by `/api/v1/ai-workforce/execute` and `executeMultiAgent()` | Returns `AgentExecutionReport` | Active | High |
| `src/modules/ai/services/agent-manager.ts` | `agentManager.executeMultiAgent()` | Execution / Routing | Called by `workforce-orchestrator` and default branch in `/api/v1/ai-workforce/execute` | Returns aggregate multi-agent report | Active | High |
| `src/modules/ai/services/agent-manager.ts` | `agentManager.getRecommendedAgents()` | Lifecycle / Routing | Called by `getWorkforceState()` and default execution branch | Reads mission stage plus plan availability | Active | High |
| `src/modules/ai/services/agent-manager.ts` | `agentManager.getWorkforceState()` | Lifecycle | Called by `GET /api/v1/ai-workforce` | Returns available/recommended/active/health state | Active | High |
| `src/modules/ai/services/workforce-orchestrator.ts` | `orchestrateForGoal()` | Routing / Execution | Called by multi-goal branch in `/api/v1/ai-workforce/execute` | Calls `agentManager.executeMultiAgent()` | Active | High |
| `src/modules/ai/services/agent-memory.ts` | `agentMemoryService.remember()` | Memory | Called after single-agent, multi-goal, and default execution branches | Writes `user.metadata.agent_memory` | Active | High |
| `src/modules/ai/services/agent-memory.ts` | `agentMemoryService.recall()` | Memory | Called by `GET /api/v1/ai-workforce` | Reads `user.metadata.agent_memory` | Active | High |
| `src/app/api/v1/ai-workforce/route.ts` | `GET /api/v1/ai-workforce` | Lifecycle / Memory | Consumed by `WorkforceDashboard.useWorkforce()` | Reads tenant plan, `userProgress.currentStageId`, workforce state, memory reports | Active | High |
| `src/app/api/v1/ai-workforce/execute/route.ts` | `POST /api/v1/ai-workforce/execute` | Routing / Execution / Memory | Consumed by `WorkforceDashboard.useExecute()` | Executes agents and writes memory reports | Active | High |
| `src/modules/ai/components/WorkforceDashboard.tsx` | `useWorkforce()` | Lifecycle / Memory Consumer | Calls `GET /api/v1/ai-workforce` | No direct write | Active | Medium |
| `src/modules/ai/components/WorkforceDashboard.tsx` | `useExecute()` | Execution Consumer | Calls `POST /api/v1/ai-workforce/execute` | Invalidates workforce query after execution | Active | Medium |
| `src/modules/ai/components/WorkforceDashboard.tsx` | Agent button execution | Routing Consumer | Sends `{ agentId }` to execute route | No direct write | Active | Medium |
| `src/modules/ai/components/WorkforceDashboard.tsx` | Goal execution | Routing Consumer | Sends `{ goal, multi: true }` to execute route | No direct write | Active | Medium |
| `src/app/(auth)/ai-workforce/page.tsx` | `WorkforcePage` | Runtime Surface | Dynamically renders `WorkforceDashboard` | No direct write | Active | Low |
| `src/modules/ai/agents/brand-strategist.ts` | `executeBrandStrategist()` | Tool / Execution | Called through `agentManager.executeAgent()` | Reads Brand DNA services; returns report/actions | Active | High |
| `src/modules/ai/agents/content-director.ts` | `executeContentDirector()` | Tool / Execution | Called through `agentManager.executeAgent()` | Reads Brand Context and Content Engine services; returns report/actions | Active | High |
| `src/modules/ai/agents/video-producer.ts` | `executeVideoProducer()` | Tool / Execution | Called through `agentManager.executeAgent()` | Reads Video Production service; returns report/actions | Active | Medium |
| `src/modules/ai/agents/funnel-architect.ts` | `executeFunnelArchitect()` | Tool / Execution | Called through `agentManager.executeAgent()` | Reads Lead Magnet and Funnel Builder services; returns report/actions | Active | High |
| `src/modules/ai/agents/traffic-strategist.ts` | `executeTrafficStrategist()` | Tool / Execution | Called through `agentManager.executeAgent()` | Reads Traffic Engine service; returns report/actions | Active | Medium |
| `src/modules/ai/agents/sales-coach.ts` | `executeSalesCoach()` | Tool / Execution | Called through `agentManager.executeAgent()` | Reads WhatsApp AI service; returns report/actions | Active | Medium |
| `src/modules/ai/agents/crm-manager.ts` | `executeCRMManager()` | Tool / Execution | Called through `agentManager.executeAgent()` | Reads CRM command center service; returns report/actions | Active | High |
| `src/modules/ai/agents/ceo-advisor.ts` | `executeCEOAdvisor()` | Tool / Execution | Called through `agentManager.executeAgent()` | Reads Analytics Center service; returns report/actions | Active | High |
| `src/modules/ai/index.ts` | AI public runtime exports | Runtime Export | Exports `agentManager`, `agentMemoryService`, `orchestrateForGoal`, and runtime types | No direct write | Active | Medium |
| `src/__tests__/services/agent-manager.test.ts` | Agent manager tests | Runtime Test Coverage | Tests available/recommended/workforce state only | Test only | Active | Low |
| `src/modules/automation/automationEngine.ts` | `executeWorkflow()` / `executeActions()` | Adjacent Execution | Not agent runtime, but owns separate workflow/action execution | Writes leads/activities through Prisma | Active | Medium |
| `prisma/schema.prisma` | `AIUsageLog` | Adjacent AI Logging | Not used as Agent Runtime execution log | Writes AI usage/cost telemetry elsewhere | Active | Low |

## Execution Sources

Runtime execution is currently owned by:

- `agentManager.executeAgent()`
- `agentManager.executeMultiAgent()`
- `orchestrateForGoal()`
- `POST /api/v1/ai-workforce/execute`
- the eight executor functions under `src/modules/ai/agents`

There is no single persisted `AgentExecution` model. Execution reports are returned in memory and then optionally stored in `user.metadata.agent_memory`.

## Runtime Routing Sources

Runtime routing is split across:

- `POST /api/v1/ai-workforce/execute`
- `orchestrateForGoal()`
- `agentManager.getRecommendedAgents()`
- `AGENT_EXECUTORS`
- `getAgentsForMissionStage()`

The execute route decides between:

- explicit multi-agent goal orchestration
- direct single-agent execution
- default recommended-agent execution

## Lifecycle Sources

Lifecycle is not a full job lifecycle today. It is mostly availability and recommendation state.

Current lifecycle-like sources:

- `AGENT_REGISTRY`
- `getAgentsForPlan()`
- `getAgentsForMissionStage()`
- `agentManager.getWorkforceState()`
- `WorkforceState.available`
- `WorkforceState.recommended`
- `WorkforceState.active`
- `WorkforceState.health`

`WorkforceState.active` currently returns an empty array from `agentManager.getWorkforceState()`.

There is no canonical lifecycle state for queued, running, failed, retried, completed, or cancelled agent execution.

## Memory Sources

Memory is currently owned by:

- `agentMemoryService.remember()`
- `agentMemoryService.recall()`
- `user.metadata.agent_memory`

The memory retention rule is local:

- append latest report
- keep last 20 reports
- `GET /api/v1/ai-workforce` returns last 5 reports

## Tool Execution Sources

The agent executors are the current tool boundary.

Each executor calls domain services directly:

- Brand Strategist reads Brand DNA and Brand DNA validation
- Content Director reads Brand Context and Content Engine
- Video Producer reads Video Production
- Funnel Architect reads Lead Magnet and Funnel Builder
- Traffic Strategist reads Traffic Engine
- Sales Coach reads WhatsApp AI
- CRM Manager reads CRM command center
- CEO Advisor reads Analytics Center

These tools are currently read-heavy. They return recommended actions and routes, but most do not perform domain writes.

## Agent Runtime Mapping

| AgentRuntime Area | Current Sources |
| --- | --- |
| `execution` | `agentManager.executeAgent()`, `agentManager.executeMultiAgent()`, executor functions, `POST /api/v1/ai-workforce/execute` |
| `routing` | `POST /api/v1/ai-workforce/execute`, `orchestrateForGoal()`, `getAgentsForMissionStage()`, `AGENT_EXECUTORS` |
| `lifecycle` | `AGENT_REGISTRY`, `getAgentsForPlan()`, `getAgentsForMissionStage()`, `getWorkforceState()`, `WorkforceState` |
| `memory` | `agentMemoryService`, `user.metadata.agent_memory` |
| `toolExecution` | executor modules under `src/modules/ai/agents/*` |

## Final Source Inventory Judgment

Agent Runtime already exists as a partial runtime, not just a concept.

The strongest current runtime authority chain is:

`AGENT_REGISTRY -> agentManager -> workforce-orchestrator -> /api/v1/ai-workforce/execute -> agentMemoryService`

But execution, routing, lifecycle, memory, and tool boundaries are still spread across multiple files and are not represented by a single canonical `AgentRuntime` module or persisted execution object.
