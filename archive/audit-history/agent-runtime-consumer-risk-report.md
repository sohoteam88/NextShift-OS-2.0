# Agent Runtime Consumer Risk Report

Status: P5-003 consumer audit
Authority: Agent Runtime

No consumer cutover was performed. No runtime behavior was changed.

## Risk Rules Applied

Low risk:

- display-only shell
- no execution ownership
- no dispatch
- no runtime writes

Medium risk:

- execution observer
- lifecycle/history viewer
- read-only runtime route
- no execution dispatch

High risk:

- executes agents
- dispatches agents
- writes runtime state
- controls orchestration
- controls lifecycle
- changes execution behavior

## High-Risk Consumers

### `src/app/api/v1/ai-workforce/execute/route.ts`

Risk: High

Reasons:

- primary Agent Runtime execution boundary
- chooses local winner by request shape:
  - `goal && multi`
  - `agentId`
  - default recommended agents
- calls execution functions
- writes reports through `agentMemoryService.remember()`

Decision:

- Blocked.
- Not eligible for bounded cutover.
- Requires separate execute-route migration plan.

### `src/modules/ai/components/WorkforceDashboard.tsx`

Risk: High

Reasons:

- triggers multi-agent execution
- triggers direct agent execution
- displays lifecycle, assignment, and results together
- mixes API runtime state with local `AGENT_REGISTRY`

Decision:

- Blocked as Workforce UI.
- Not eligible for P5 bounded route cutover.

### `src/modules/ai/services/agent-manager.ts`

Risk: High

Reasons:

- owns current executor dispatch through `executeAgent()`
- owns multi-agent dispatch through `executeMultiAgent()`
- owns derived workforce state and stage assignment filtering

Decision:

- Blocked.
- Adapter may wrap outputs, but source behavior must not change.

### `src/modules/ai/services/workforce-orchestrator.ts`

Risk: High

Reasons:

- maps explicit goals to agent chains
- calls `agentManager.executeMultiAgent()`
- returns execution reports

Decision:

- Blocked.
- It is delegation plus execution, not a read-only consumer.

### `src/modules/ai/services/agent-memory.ts`

Risk: High for write path, Medium for read path

Reasons:

- `remember()` writes runtime report memory into `user.metadata.agent_memory`
- `recall()` is the current execution history source
- no durable execution table or lifecycle ledger exists

Decision:

- Write path blocked.
- Read path can be wrapped through `GET /api/v1/ai-workforce`, not migrated directly.

## Medium-Risk Consumers

### `src/app/api/v1/ai-workforce/route.ts`

Risk: Medium

Reasons:

- read-only route
- merges current lifecycle/assignment state and recent execution reports
- no dispatch
- no runtime write

Decision:

- Only early bounded cutover candidate.
- Must preserve response shape:
  - `available`
  - `recommended`
  - `reports`
- Must not touch execute route or Workforce UI.

### Entry Route Consumers

Files:

- `src/modules/business-intelligence/components/CEOAdvisorDashboard.tsx`
- `src/modules/business-intelligence/ceoAdvisorEngine.ts`
- `src/modules/mission-engine/services/mission-service.ts`

Risk: Medium

Reasons:

- link users to `/ai-workforce`
- do not pass canonical execution context
- do not consume runtime state directly

Decision:

- Not bounded cutover candidates.
- Future handoff contracts should be handled after runtime read route stabilization.

## Low-Risk Consumers

### `src/app/(auth)/ai-workforce/page.tsx`

Risk: Low

Reason:

- page shell around `WorkforceDashboard`

Decision:

- Not a direct cutover target.

### Automation Workflow Surfaces

Files:

- `src/app/api/v1/automation/route.ts`
- `src/modules/automation/components/AutomationDashboard.tsx`
- `src/modules/automation/automationEngine.ts`

Risk: Low for Agent Runtime

Reason:

- separate workflow automation domain
- not AI Agent Runtime execution state

Decision:

- Excluded from Agent Runtime cutover scope.

## Blocked Consumer List

Must remain blocked until later approval:

- `POST /api/v1/ai-workforce/execute`
- `agentManager`
- `workforce-orchestrator`
- `executeAgent`
- `executeMultiAgent`
- Agent Runtime execution chain
- `agentMemoryService.remember`
- `WorkforceDashboard`
- Dashboard runtime widgets

## Early Cutover Candidate

Candidate:

- `src/app/api/v1/ai-workforce/route.ts`

Why:

- read-only
- no dispatch
- no execution
- no runtime write
- already aggregates lifecycle, assignment, and result read state
- can potentially call `RuntimeStateService` and adapt back to the existing response shape

Constraints:

- preserve current response compatibility for `WorkforceDashboard`
- do not modify `WorkforceDashboard`
- do not modify `POST /api/v1/ai-workforce/execute`
- do not modify `agentManager`
- do not modify `workforce-orchestrator`
- do not modify `agentMemoryService.remember`
- do not alter execution branch precedence
