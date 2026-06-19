# Agent Runtime Read Reduction Report

Status: P5-005 consumer cutover implementation
Authority: Agent Runtime
Approved route: `GET /api/v1/ai-workforce`

## Summary

`GET /api/v1/ai-workforce` now reads workforce state through `RuntimeStateService` and maps the resulting `RuntimeState` through `WorkforceViewModelAdapter`.

No execution route, Workforce UI, dashboard component, lifecycle write, assignment write, or memory write was changed.

## Before

The approved route directly imported and coordinated:

- `prisma`
- `agentManager`
- `agentMemoryService`

The route directly read:

- tenant plan
- current mission stage
- workforce state from `agentManager.getWorkforceState()`
- recent reports from `agentMemoryService.recall()`

## After

The approved route imports only:

- `runtimeStateService`
- `toWorkforceViewModel`

The route now reads:

- `runtimeStateService.getRuntimeState(user.id)`
- `toWorkforceViewModel(runtimeState)`

Compatibility reads remain behind the Agent Runtime boundary in `RuntimeStateAssembler`. This preserves the existing response while moving route-level read authority to `RuntimeState`.

## Response Compatibility

The response still returns:

```ts
{
  data: {
    available,
    recommended,
    active,
    recentReports,
    health,
    reports,
  }
}
```

`WorkforceViewModelAdapter` maps:

- `RuntimeState.availableAgents` to `available`
- `RuntimeState.recommendedAgents` to `recommended`
- `RuntimeState.activeExecutions` to `active`
- `RuntimeState.health` to `health`
- `RuntimeState.recentResults` to `reports`

`recentReports` remains an empty compatibility array, matching the current derived `agentManager.getWorkforceState()` behavior.

## Boundary Confirmation

Changed files:

- `src/app/api/v1/ai-workforce/route.ts`
- `src/modules/agent-runtime/view-models/WorkforceViewModelAdapter.ts`
- `audit/agent-runtime-read-reduction-report.md`

Explicitly unchanged:

- `src/app/api/v1/ai-workforce/execute/route.ts`
- `src/modules/ai/components/WorkforceDashboard.tsx`
- `src/modules/ai/services/agent-manager.ts`
- `src/modules/ai/services/workforce-orchestrator.ts`
- memory write paths

## Execution And Write Confirmation

The approved route and view model do not call:

- `executeAgent`
- `executeMultiAgent`
- `orchestrateForGoal`
- `agentMemoryService.remember`
- Prisma create/update/upsert/delete operations

## Exit Gate

Eligible for:

- `P5-006_AGENT_RUNTIME_POST_CUTOVER_AUDIT.md`
