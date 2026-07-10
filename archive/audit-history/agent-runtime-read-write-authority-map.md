# Agent Runtime Read/Write Authority Map

Scope: TASK_015 Agent Runtime read/write authority audit.

This map separates read authority, write authority, and current conflict rules for Agent Runtime.

## Final Read/Write Judgment

Agent Runtime has more write behavior than it first appears.

Writes are concentrated in:

- `agentMemoryService.remember()` writing `user.metadata.agent_memory`

Execution itself is mostly read/compute/return behavior:

- it reads domain services
- produces `AgentExecutionReport`
- stores reports in metadata memory

There is no dedicated persisted `AgentExecution` table.

## 1. Execution

### Read Authority

| Source | Reads |
| --- | --- |
| `POST /api/v1/ai-workforce/execute` | authenticated user, tenant plan, request body, sometimes `userProgress.currentStageId` |
| `agentManager.executeAgent()` | `AGENT_EXECUTORS[input.agentId]` |
| `agentManager.executeMultiAgent()` | provided `agentIds`, executor reports |
| executor modules | domain services such as Brand DNA, Content Engine, CRM, Analytics |

### Write Authority

| Source | Writes |
| --- | --- |
| executor modules | no shared Agent Runtime persistence; return reports |
| `agentManager.executeAgent()` | no persistence; returns report |
| `agentManager.executeMultiAgent()` | no persistence; returns aggregate report |
| `POST /api/v1/ai-workforce/execute` | writes reports to memory through `agentMemoryService.remember()` |

### Current Winner

`POST /api/v1/ai-workforce/execute` wins execution branch selection.

`agentManager` wins executor dispatch.

## 2. Routing

### Read Authority

| Source | Reads |
| --- | --- |
| `POST /api/v1/ai-workforce/execute` | `body.goal`, `body.multi`, `body.agentId` |
| `workforce-orchestrator.orchestrateForGoal()` | goal objective text, tenant plan |
| `agentManager.getRecommendedAgents()` | current stage, plan |
| `getAgentsForMissionStage()` | stage string |
| `getAgentsForPlan()` | tenant plan |

### Write Authority

Routing has no persisted write.

It writes only transient execution choice:

- selected branch
- selected agent IDs
- selected executor chain

### Current Winner

Branch order:

1. `goal && multi`
2. `agentId`
3. default stage-based recommendation

## 3. Lifecycle

### Read Authority

| Source | Reads |
| --- | --- |
| `AGENT_REGISTRY` | static agent definitions |
| `getAgentsForPlan()` | registry required plan |
| `getAgentsForMissionStage()` | static stage-to-agent map |
| `agentManager.getWorkforceState()` | available agents, recommended agents |
| `GET /api/v1/ai-workforce` | tenant plan, current stage, workforce state |
| `WorkforceDashboard` | API response and local `AGENT_REGISTRY` metadata |

### Write Authority

There is no durable Agent Runtime lifecycle write authority.

Current lifecycle is derived at read time.

Notably:

- `active` is returned as an empty array by `getWorkforceState()`
- `health` is computed from available agent count
- recommended agents are derived from current stage and plan

### Current Winner

Layered winner:

1. `AGENT_REGISTRY` defines possible agents
2. `getAgentsForPlan()` defines available agents
3. `getAgentsForMissionStage()` proposes recommended agents
4. `getRecommendedAgents()` intersects recommended with available
5. `getWorkforceState()` packages the result

## 4. Memory

### Read Authority

| Source | Reads |
| --- | --- |
| `agentMemoryService.recall()` | `user.metadata.agent_memory` |
| `GET /api/v1/ai-workforce` | recalled memory reports |
| `WorkforceDashboard` | `reports` returned by API |
| `AIUsageLog` | provider/model/token/cost telemetry elsewhere; not Agent Runtime reports |

### Write Authority

| Source | Writes |
| --- | --- |
| `agentMemoryService.remember()` | appends reports to `user.metadata.agent_memory` |
| `POST /api/v1/ai-workforce/execute` | invokes `remember()` after each execution path |
| `AIUsageLog` | writes AI usage/cost telemetry through AI usage systems, not agent reports |

### Current Winner

For Agent Runtime report memory:

`agentMemoryService` wins.

For AI cost/usage:

`AIUsageLog` wins.

There is no shared execution ID or canonical ledger between them.

## 5. Tool Execution

### Read Authority

| Executor | Domain Reads |
| --- | --- |
| `executeBrandStrategist()` | Brand DNA and Brand DNA validation |
| `executeContentDirector()` | Brand Context and Content Engine |
| `executeVideoProducer()` | Video Production |
| `executeFunnelArchitect()` | Lead Magnet and Funnel Builder |
| `executeTrafficStrategist()` | Traffic Engine |
| `executeSalesCoach()` | WhatsApp AI |
| `executeCRMManager()` | CRM command center |
| `executeCEOAdvisor()` | Analytics Center |

### Write Authority

The executor modules return reports and actions.

They do not share a central Agent Runtime write authority.

Any domain writes would be hidden inside imported domain services, but the audited executor paths are primarily read/report actions.

### Current Winner

The selected executor owns:

- findings
- recommendations
- actions
- confidence score
- route hints

## Read/Write Matrix

| Runtime Area | Read Authority | Write Authority | Current Winner |
| --- | --- | --- | --- |
| Execution | execute route, agentManager, executors | memory write after execution | execute route branch, then agentManager |
| Routing | request body, goal text, current stage, plan | no persisted routing write | request branch order |
| Lifecycle | registry, plan, stage, workforce state | no durable lifecycle write | registry + derived helpers |
| Memory | `agentMemoryService.recall()`, `AIUsageLog` adjacent | `agentMemoryService.remember()`, `AIUsageLog` adjacent | agent memory for reports |
| Tool Execution | selected executor and domain services | report return only | selected executor |

## Current Missing Write Authorities

No canonical write authority exists for:

- `AgentExecution`
- execution status
- queued/running/completed/failed lifecycle
- retry state
- execution cost linked to report
- execution tool calls
- canonical runtime result history

## Final Read/Write Conclusion

Current Agent Runtime reads from several sources, but writes only one runtime-specific artifact:

`user.metadata.agent_memory`

That makes current Agent Runtime operational but not durable as a full execution system.
