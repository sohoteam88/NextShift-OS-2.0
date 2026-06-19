# Agent Runtime Conflict Report

Scope: TASK_015 Agent Runtime conflict audit.

This report documents current conflicts between runtime authorities.

## Final Conflict Judgment

Agent Runtime conflicts are concentrated in routing and execution selection.

Memory has weak modeling but not many competing live sources.

Lifecycle has layered precedence, but no durable execution lifecycle.

## Conflict 1: Multi-goal vs Single-agent Execution

Sources:

- `POST /api/v1/ai-workforce/execute`
- `workforce-orchestrator.orchestrateForGoal()`
- `agentManager.executeAgent()`

Conflict:

The request schema allows both:

- `agentId`
- `goal`
- `multi`

Current winner:

- if `goal && multi` is present, multi-goal orchestration wins
- `agentId` is ignored by branch precedence in that case

Risk:

`High`

Why it matters:

A user or caller can send mixed intent, but the route silently chooses multi-goal orchestration.

## Conflict 2: Goal Routing vs Stage Routing

Sources:

- `workforce-orchestrator.orchestrateForGoal()`
- `getAgentsForMissionStage()`
- `agentManager.getRecommendedAgents()`

Conflict:

Goal keywords can select a different agent chain than the user's current mission stage.

Examples:

- a user in `brand_discovery` can enter a sales goal and trigger sales/CRM/funnel agents
- a user in `crm_setup` can enter a content goal and trigger content/video agents

Current winner:

- explicit `goal + multi` wins over stage routing
- stage routing only wins in default execution

Risk:

`High`

Why it matters:

Agent Runtime can execute outside Journey stage recommendation when goal text is explicit.

## Conflict 3: Direct Agent Selection vs Availability/Plan Gates

Sources:

- `WorkforceDashboard` agent cards
- `POST /api/v1/ai-workforce/execute`
- `agentManager.executeAgent()`
- `getAgentsForPlan()`

Conflict:

The UI displays available agents from plan-filtered state, but the direct execution API branch accepts arbitrary `agentId` string and casts it to `any`.

Current winner:

- direct `agentId` branch calls `agentManager.executeAgent()` directly
- `executeAgent()` checks only whether `AGENT_EXECUTORS[input.agentId]` exists
- plan availability is not rechecked in the direct execution branch

Risk:

`High`

Why it matters:

Plan availability is enforced in list/recommendation state, but not clearly enforced at direct execution dispatch.

## Conflict 4: Orchestrator Goal Chain vs Plan Availability

Sources:

- `workforce-orchestrator.orchestrateForGoal()`
- `agentManager.getAvailableAgents()`
- `agentManager.executeMultiAgent()`

Conflict:

Most explicit keyword branches in `orchestrateForGoal()` assign fixed agent chains before execution.

Only the final fallback branch uses `agentManager.getAvailableAgents(plan)`.

Current winner:

- explicit keyword chain wins
- plan availability is not clearly applied to explicit keyword chains before `executeMultiAgent()`

Risk:

`High`

Why it matters:

Goal keyword routing may execute agents that would not appear in the plan-filtered available list.

## Conflict 5: Lifecycle State vs UI Mutation State

Sources:

- `agentManager.getWorkforceState()`
- `WorkforceState.active`
- `WorkforceDashboard.useExecute()`

Conflict:

Runtime lifecycle state claims an `active` field, but `getWorkforceState()` returns `active: []`.

The actual "running" state shown in UI comes from React Query mutation pending state.

Current winner:

- UI mutation state wins for loading/running UX
- `WorkforceState.active` does not represent live running executions

Risk:

`Medium`

Why it matters:

There is no durable active execution lifecycle. A refresh loses running context.

## Conflict 6: Runtime Results vs Memory Results

Sources:

- `POST /api/v1/ai-workforce/execute`
- `agentMemoryService.remember()`
- `GET /api/v1/ai-workforce`
- `WorkforceDashboard`

Conflict:

Execution mutation returns a report immediately, but visible "recent reports" come from memory recall after query invalidation.

Current winner:

- visible result display trusts `GET /api/v1/ai-workforce` memory reports
- immediate mutation result is not the primary rendered report path

Risk:

`Medium-High`

Why it matters:

If memory write fails after execution succeeds, the user may not see the report in recent reports.

## Conflict 7: Agent Memory vs AI Usage Logging

Sources:

- `agentMemoryService`
- `AIUsageLog`

Conflict:

Both sound like AI runtime history, but they store different facts.

- `agentMemoryService` stores agent reports in `user.metadata.agent_memory`
- `AIUsageLog` stores provider/model/token/cost telemetry

Current winner:

- `agentMemoryService` wins for Agent Runtime reports
- `AIUsageLog` wins for AI usage/cost telemetry

Risk:

`Medium`

Why it matters:

There is no shared execution ID linking report history to usage/cost logs.

## Conflict 8: Tool Output Routes vs Product Route Authority

Sources:

- individual agent executors
- domain services consumed by executors
- product routes returned in `AgentExecutionReport.actions`

Conflict:

Executors generate action routes locally:

- `/brand-builder/profile`
- `/content-engine`
- `/video-production`
- `/lead-magnet`
- `/funnel-builder`
- `/traffic-engine`
- `/whatsapp-ai`
- `/crm`
- `/analytics-center`

Current winner:

- selected executor owns route action output

Risk:

`Medium`

Why it matters:

There is no central route/action authority for Agent Runtime results.

## Conflict Matrix

| Conflict | Current Winner | Risk |
| --- | --- | --- |
| `goal+multi` vs `agentId` | `goal+multi` branch | High |
| goal routing vs stage routing | goal routing if `multi` request; stage routing only fallback | High |
| direct `agentId` vs plan availability | direct executor dispatch | High |
| explicit orchestrator chain vs plan availability | orchestrator keyword chain | High |
| `WorkforceState.active` vs UI pending state | UI pending state | Medium |
| immediate execution result vs memory display | memory display | Medium-High |
| agent memory vs AI usage log | split by data class | Medium |
| executor action routes vs central route authority | selected executor | Medium |

## Final Conflict Conclusion

The biggest current runtime conflict is:

`execution request shape determines authority more strongly than any canonical runtime policy.`

That means Agent Runtime has a clear operational path, but not a single system-level conflict resolver.
