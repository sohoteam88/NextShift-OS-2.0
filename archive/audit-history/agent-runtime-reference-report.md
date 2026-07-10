# Agent Runtime Reference Report

Status: P5-006 reference report
Authority: Agent Runtime
Decision: PASS

## Approved Cutover Reference

Approved route:

- `src/app/api/v1/ai-workforce/route.ts`

Current flow:

```text
requireAuthApi
  -> runtimeStateService.getRuntimeState(user.id)
  -> toWorkforceViewModel(runtimeState)
  -> NextResponse.json({ data })
```

## View Model Reference

File:

- `src/modules/agent-runtime/view-models/WorkforceViewModelAdapter.ts`

Export:

- `toWorkforceViewModel(runtimeState: RuntimeState): WorkforceViewModel`

Output shape:

```ts
interface WorkforceViewModel extends WorkforceState {
  reports: AgentExecutionReport[];
}
```

Mapping:

- `availableAgents` -> `available`
- `recommendedAgents` -> `recommended`
- `activeExecutions` -> `active`
- `recentResults` -> `reports`
- `health` -> `health`

## Agent Runtime Authority Files

Contracts:

- `src/modules/agent-runtime/contracts/RuntimeAssignment.ts`
- `src/modules/agent-runtime/contracts/RuntimeExecution.ts`
- `src/modules/agent-runtime/contracts/RuntimeLifecycle.ts`
- `src/modules/agent-runtime/contracts/RuntimeResult.ts`
- `src/modules/agent-runtime/contracts/RuntimeState.ts`

Adapters:

- `src/modules/agent-runtime/adapters/RuntimeAssignmentAdapter.ts`
- `src/modules/agent-runtime/adapters/RuntimeExecutionAdapter.ts`
- `src/modules/agent-runtime/adapters/RuntimeLifecycleAdapter.ts`
- `src/modules/agent-runtime/adapters/RuntimeResultAdapter.ts`
- `src/modules/agent-runtime/adapters/RuntimeStateAssembler.ts`

Service:

- `src/modules/agent-runtime/services/RuntimeStateService.ts`

View model:

- `src/modules/agent-runtime/view-models/WorkforceViewModelAdapter.ts`

## Preserved Legacy Runtime References

Execution route remains outside the cutover:

- `src/app/api/v1/ai-workforce/execute/route.ts`

Execution services remain outside the cutover:

- `src/modules/ai/services/agent-manager.ts`
- `src/modules/ai/services/workforce-orchestrator.ts`
- `src/modules/ai/services/agent-memory.ts`

UI remains outside the cutover:

- `src/modules/ai/components/WorkforceDashboard.tsx`

## Import Boundary Reference

Allowed `RuntimeStateService` usage:

- `src/app/api/v1/ai-workforce/route.ts`
- `src/modules/agent-runtime/**`

Observed usage:

- `src/app/api/v1/ai-workforce/route.ts`
- `src/modules/agent-runtime/services/RuntimeStateService.ts`

No unauthorized consumer usage was found.

## Governance Reference

P5-005 complied with:

- bounded route-only migration
- read-only route cutover
- response compatibility
- no execution dispatch
- no memory write
- no lifecycle write
- no UI cutover
- no execute route cutover
