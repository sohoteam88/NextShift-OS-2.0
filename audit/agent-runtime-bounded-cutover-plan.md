# Agent Runtime Bounded Cutover Plan

Status: P5-004 consumer cutover planning
Authority: Agent Runtime
Work type: planning only
Runtime changes: none

## Objective

Define the first bounded Agent Runtime consumer migration without changing runtime behavior in P5-004.

The first migration must validate this path:

```text
RuntimeStateService
  -> RuntimeState
  -> WorkforceViewModelAdapter
  -> GET /api/v1/ai-workforce
  -> same response
```

## Approved Candidate

Only approved target:

- `GET /api/v1/ai-workforce`
- File: `src/app/api/v1/ai-workforce/route.ts`

## Cutover Decision

Proceed to P5-005 with a bounded read-only route cutover plan.

This does not approve the workforce execute route, Workforce UI, Dashboard runtime widgets, `agentManager`, `workforce-orchestrator`, runtime dispatch, lifecycle writes, assignment changes, or agent memory writes.

## Explicitly Blocked

- `POST /api/v1/ai-workforce/execute`
- `WorkforceDashboard`
- Dashboard runtime widgets
- `agentManager`
- `workforce-orchestrator`
- `executeAgent`
- `executeMultiAgent`
- `orchestrateForGoal`
- Runtime dispatch
- Runtime lifecycle writes
- Runtime assignment changes
- Agent memory writes
- `agentMemoryService.remember`

## Target Flow

Current:

```text
agentManager
  -> GET /api/v1/ai-workforce
  -> response
```

Target:

```text
RuntimeStateService
  -> RuntimeState
  -> WorkforceViewModelAdapter
  -> GET /api/v1/ai-workforce
  -> same response
```

## Current Response Contract

The route currently returns:

```ts
{
  data: {
    available: AgentId[];
    recommended: AgentId[];
    active: Array<{
      agent: AgentId;
      objective: string;
      startedAt: string;
    }>;
    recentReports: AgentExecutionReport[];
    health: 'optimal' | 'good' | 'attention';
    reports: AgentExecutionReport[];
  };
}
```

P5-005 must preserve this response shape for `WorkforceDashboard`.

## P5-005 Implementation Boundary

P5-005 may add:

- `src/modules/agent-runtime/view-models/WorkforceViewModelAdapter.ts`
- focused adapter tests if practical
- route-level wiring in `src/app/api/v1/ai-workforce/route.ts`
- a read-reduction report

P5-005 may import `RuntimeStateService` only in:

- `src/app/api/v1/ai-workforce/route.ts`
- `src/modules/agent-runtime/**`
- approved tests for the route or view model

P5-005 must not import `RuntimeStateService` into:

- `src/app/api/v1/ai-workforce/execute/route.ts`
- `src/modules/ai/components/WorkforceDashboard.tsx`
- Dashboard components or hooks
- AI Coach route/page/card/service
- CEO Advisor or AI COO consumers
- `agentManager`
- `workforce-orchestrator`
- execution services
- memory write paths

## ViewModel Rules

`WorkforceViewModelAdapter` must:

- accept `RuntimeState`
- return the existing workforce route response data shape
- preserve top-level `data` wrapping in the route
- map `RuntimeState.availableAgents` to `available`
- map `RuntimeState.recommendedAgents` to `recommended`
- preserve `active`
- preserve `health`
- preserve `recentReports`
- preserve `reports`
- use explicit compatibility fallback where `RuntimeState` does not yet carry enough display fields

The adapter must not:

- execute agents
- execute multiple agents
- orchestrate for a goal
- dispatch runtime assignments
- change assignment selection behavior
- write lifecycle state
- write agent memory
- mutate database state
- change `WorkforceDashboard`
- change `POST /api/v1/ai-workforce/execute`

## Compatibility Strategy

Because `WorkforceDashboard` still renders legacy `AgentExecutionReport` objects from memory and because durable runtime lifecycle state is not yet authoritative, P5-005 should use a compatibility input.

Recommended function shape:

```ts
toWorkforceViewModel(
  runtimeState: RuntimeState,
  fallback: WorkforceViewModel
): WorkforceViewModel
```

Allowed compatibility behavior:

- use `runtimeState.availableAgents` for `available` when present
- use `runtimeState.recommendedAgents` for `recommended` when present
- preserve fallback `active` until durable lifecycle writes are approved
- preserve fallback `recentReports` where response compatibility requires `AgentExecutionReport`
- preserve fallback `reports` from `agentMemoryService.recall(user.id).slice(-5)`
- preserve fallback `health` unless `RuntimeState` provides a response-compatible health value

This keeps the first cutover bounded to read authority validation instead of forcing a full execution-result or lifecycle migration.

## Route Rules

The route may continue to:

- authenticate with `requireAuthApi`
- return `NextResponse.json({ data })`
- use `agentManager.getWorkforceState()` as compatibility fallback
- use `agentMemoryService.recall()` as compatibility fallback
- read tenant plan and current stage where needed for response compatibility

The route must:

- call `runtimeStateService.getRuntimeState(user.id)`
- pass the returned `RuntimeState` through `WorkforceViewModelAdapter`
- preserve current workforce response fields
- remain read-only

The route must not:

- call `agentManager.executeAgent`
- call `agentManager.executeMultiAgent`
- call `orchestrateForGoal`
- call `agentMemoryService.remember`
- change request method behavior
- add POST behavior
- change `WorkforceDashboard` imports or runtime behavior
- change execution branch precedence

## Acceptance Checks

P5-005 must verify:

- `GET /api/v1/ai-workforce` still returns `data`
- `data.available` exists
- `data.recommended` exists
- `data.active` exists
- `data.recentReports` exists
- `data.health` exists
- `data.reports` exists
- route remains read-only
- no execution dispatch occurs
- no lifecycle write occurs
- no assignment behavior changes
- no memory write occurs
- no Workforce UI changes are introduced
- no execute route changes are introduced

## Required Verification

Run:

```bash
pnpm type-check
grep -RIn "RuntimeStateService\|runtimeStateService\|getRuntimeState" src --exclude-dir=node_modules --exclude-dir=.next
grep -n "executeAgent\|executeMultiAgent\|orchestrateForGoal\|agentMemoryService\.remember\|\.create\|\.update\|\.upsert\|\.delete" src/app/api/v1/ai-workforce/route.ts src/modules/agent-runtime/view-models/WorkforceViewModelAdapter.ts
```

Expected import boundary after P5-005:

- `src/modules/agent-runtime/**`
- `src/app/api/v1/ai-workforce/route.ts`
- approved tests only

Expected forbidden execution/write grep:

- no matches in the approved route or view model adapter

## Rollback Plan

If response compatibility fails in P5-005:

1. Revert only `src/app/api/v1/ai-workforce/route.ts`.
2. Keep `WorkforceViewModelAdapter` only if unused and type-safe.
3. Restore direct route call to `agentManager.getWorkforceState()` and `agentMemoryService.recall()`.
4. Do not touch `POST /api/v1/ai-workforce/execute`, Workforce UI, Dashboard, `agentManager`, `workforce-orchestrator`, or memory write paths.

## Success Criteria

- One read-only route is included.
- Workforce response compatibility is preserved.
- No execution dispatch is introduced.
- No lifecycle write is introduced.
- No assignment behavior is changed.
- No memory write is introduced.
- No Workforce UI dependency is introduced.
- No Dashboard migration is introduced.
- No runtime behavior changes are made in P5-004.

## Exit Gate

Eligible for:

- `P5-005_BOUNDED_AGENT_RUNTIME_CUTOVER_IMPLEMENTATION.md`

Not eligible for:

- `POST /api/v1/ai-workforce/execute` cutover
- Workforce UI cutover
- Dashboard runtime cutover
- `agentManager` migration
- `workforce-orchestrator` migration
- execution behavior changes
- lifecycle write changes
- agent memory write changes
