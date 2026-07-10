# Agent Runtime Consumer Summary

Status: P5-003 consumer audit
Authority: Agent Runtime
Final Decision: READY FOR BOUNDED CUTOVER

No consumer cutover was performed. No runtime behavior was changed.

## Summary

Agent Runtime has a narrow active consumer surface:

- `GET /api/v1/ai-workforce`
- `POST /api/v1/ai-workforce/execute`
- `WorkforceDashboard`
- `agentManager`
- `workforce-orchestrator`
- `agentMemoryService`

Most other product surfaces only link to `/ai-workforce`; they do not consume runtime state directly.

## Execution Consumers

Execution consumers:

- `POST /api/v1/ai-workforce/execute`
- `WorkforceDashboard.useExecute()`
- `agentManager.executeAgent()`
- `agentManager.executeMultiAgent()`
- `workforce-orchestrator.orchestrateForGoal()`

Finding:

- Execution remains concentrated in the execute route and runtime services.
- These are blocked and not eligible for bounded cutover.

## Lifecycle Consumers

Lifecycle consumers:

- `GET /api/v1/ai-workforce`
- `WorkforceDashboard.useWorkforce()`
- `WorkforceDashboard` agent list and recommended badges
- `agentManager.getWorkforceState()`

Finding:

- Current lifecycle is derived, not durable.
- `available` and `recommended` are real read fields.
- `active` exists in `WorkforceState` but currently remains empty.

## Assignment Consumers

Assignment consumers:

- `agentManager.getRecommendedAgents()`
- `agentManager.getWorkforceState()`
- `GET /api/v1/ai-workforce`
- `WorkforceDashboard`
- default branch in `POST /api/v1/ai-workforce/execute`

Finding:

- Runtime assignment is still tied to stage fallback and plan filtering.
- ADR-021 says AI COO owns assignment planning; Agent Runtime executes selected plans.
- P5 cutover must preserve current branch behavior until later execution migration.

## Runtime Result Consumers

Runtime result consumers:

- `agentMemoryService.recall()`
- `GET /api/v1/ai-workforce`
- `WorkforceDashboard` recent reports rendering
- `WorkforceDashboard.useExecute()` mutation response

Finding:

- Visible runtime reports come from metadata-backed memory after query invalidation.
- `AIUsageLog` exists but is not the active Agent Runtime result authority.

## Blocked Consumers

The following are not eligible for immediate cutover:

- `POST /api/v1/ai-workforce/execute`
- `WorkforceDashboard`
- `agentManager`
- `workforce-orchestrator`
- `executeAgent`
- `executeMultiAgent`
- `agentMemoryService.remember`
- dashboard runtime widgets
- execution behavior

## Bounded Cutover Candidate

Only one bounded candidate was found:

- `src/app/api/v1/ai-workforce/route.ts`

Reason:

- read-only route
- no execution dispatch
- no runtime write
- current runtime state aggregation point
- can be planned as a response-compatible wrapper around `RuntimeStateService`

Required cutover constraints:

- preserve current response shape for `WorkforceDashboard`
- do not modify `WorkforceDashboard`
- do not modify `POST /api/v1/ai-workforce/execute`
- do not modify `agentManager`
- do not modify `workforce-orchestrator`
- do not modify execution branch precedence
- do not write runtime state

## Non-Agent Runtime Findings

Automation workflow execution was found in:

- `src/app/api/v1/automation/route.ts`
- `src/modules/automation/automationEngine.ts`
- `src/modules/automation/components/AutomationDashboard.tsx`

This is excluded from Agent Runtime because it is workflow automation, not AI agent execution/runtime state.

## Exit Gate

Eligible for:

- `P5-004_BOUNDED_AGENT_RUNTIME_CUTOVER_PLAN.md`

Not eligible for:

- Agent Runtime execute route cutover
- Workforce UI cutover
- Dashboard runtime cutover
- execution behavior changes
