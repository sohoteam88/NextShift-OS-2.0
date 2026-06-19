# Agent Runtime Consumer Inventory

Status: P5-003 consumer audit
Authority: Agent Runtime
Scope: runtime consumers of execution, lifecycle, assignment, and result state.

No consumer cutover was performed. No runtime behavior was changed.

## Inventory

| File Path | Consumer Name | Consumer Type | Reads Execution | Reads Lifecycle | Reads Assignment | Reads Result | Triggers Execution | Writes Runtime State | Current Source | Chooses Local Winner | Migration Risk | Early Cutover Candidate | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `src/app/api/v1/ai-workforce/route.ts` | `GET /api/v1/ai-workforce` | Runtime | No | Yes | Yes | Yes | No | No | `agentManager.getWorkforceState()`, `agentMemoryService.recall()` | Yes | Medium | Yes | Read-only runtime projection route. It merges available/recommended agents and recent memory reports. Candidate only if response shape remains compatible and no execute behavior changes. |
| `src/app/api/v1/ai-workforce/execute/route.ts` | `POST /api/v1/ai-workforce/execute` | Runtime | Yes | Yes | Yes | Yes | Yes | Yes | `orchestrateForGoal()`, `agentManager.executeAgent()`, `agentManager.getRecommendedAgents()`, `agentManager.executeMultiAgent()`, `agentMemoryService.remember()` | Yes | High | No | Execution authority and branch selector. Must remain blocked. |
| `src/app/api/v1/ai-workforce/execute/route.ts` | Multi-goal branch | Delegation | Yes | No | Yes | Yes | Yes | Yes | `orchestrateForGoal()` and `agentMemoryService.remember()` | Yes | High | No | Branch selected by `goal && multi`; dispatches multi-agent execution and writes reports. |
| `src/app/api/v1/ai-workforce/execute/route.ts` | Direct agent branch | Runtime | Yes | No | Yes | Yes | Yes | Yes | `agentManager.executeAgent()` and `agentMemoryService.remember()` | Yes | High | No | Branch selected by `agentId`; dispatches one agent directly. |
| `src/app/api/v1/ai-workforce/execute/route.ts` | Default recommended branch | Assignment | Yes | Yes | Yes | Yes | Yes | Yes | `userProgress.currentStageId`, `agentManager.getRecommendedAgents()`, `agentManager.executeMultiAgent()`, `agentMemoryService.remember()` | Yes | High | No | Branch selected when no direct agent or multi-goal request exists. |
| `src/modules/ai/components/WorkforceDashboard.tsx` | `useWorkforce()` | Workforce | No | Yes | Yes | Yes | No | No | `GET /api/v1/ai-workforce` | No | Medium | No | UI hook reads runtime projection. Not a candidate because Workforce UI cutover is blocked. |
| `src/modules/ai/components/WorkforceDashboard.tsx` | `useExecute()` | Workforce | Yes | No | Yes | Yes | Yes | No | `POST /api/v1/ai-workforce/execute` | Yes | High | No | UI mutation chooses request shape and invalidates workforce query. |
| `src/modules/ai/components/WorkforceDashboard.tsx` | Goal execution button | Workforce | Yes | No | Yes | Yes | Yes | No | `useExecute({ goal, multi: true })` | Yes | High | No | Triggers multi-agent orchestration path. |
| `src/modules/ai/components/WorkforceDashboard.tsx` | Agent card button | Workforce | Yes | No | Yes | Yes | Yes | No | `useExecute({ agentId })` | Yes | High | No | Triggers direct agent execution path. |
| `src/modules/ai/components/WorkforceDashboard.tsx` | Agent list and recommended badges | Workforce | No | Yes | Yes | No | No | No | `GET /api/v1/ai-workforce`, `AGENT_REGISTRY` | No | Medium | No | Displays available/recommended agents with local registry metadata. |
| `src/modules/ai/components/WorkforceDashboard.tsx` | Recent reports rendering | Workforce | No | No | No | Yes | No | No | `reports` from `GET /api/v1/ai-workforce` | No | Medium | No | Displays memory-backed execution results. |
| `src/app/(auth)/ai-workforce/page.tsx` | `WorkforcePage` | Workforce | No | No | No | No | No | No | `WorkforceDashboard` | No | Low | No | Page shell only. |
| `src/modules/ai/services/agent-manager.ts` | `agentManager.getWorkforceState()` | Assignment | No | Yes | Yes | No | No | No | `getAgentsForPlan()`, `getRecommendedAgents()` | Yes | High | No | Produces current derived workforce lifecycle/assignment state. Source remains blocked. |
| `src/modules/ai/services/agent-manager.ts` | `agentManager.getRecommendedAgents()` | Assignment | No | No | Yes | No | No | No | `getAgentsForMissionStage()`, `getAgentsForPlan()` | Yes | High | No | Stage assignment filtered by plan. ADR-021 says AI COO owns planning; Agent Runtime consumes selected assignment later. |
| `src/modules/ai/services/agent-manager.ts` | `agentManager.executeAgent()` | Runtime | Yes | No | Yes | Yes | Yes | No | `AGENT_EXECUTORS` | Yes | High | No | Dispatches selected executor. Must not change under consumer audit. |
| `src/modules/ai/services/agent-manager.ts` | `agentManager.executeMultiAgent()` | Runtime | Yes | No | Yes | Yes | Yes | No | `executeAgent()` loop | Yes | High | No | Dispatches multiple selected executors. Must remain blocked. |
| `src/modules/ai/services/workforce-orchestrator.ts` | `orchestrateForGoal()` | Delegation | Yes | No | Yes | Yes | Yes | No | Goal keyword selection, `agentManager.executeMultiAgent()` | Yes | High | No | Explicit-goal chain selector and executor. Not a read-only consumer. |
| `src/modules/ai/services/agent-memory.ts` | `agentMemoryService.recall()` | Runtime | No | No | No | Yes | No | No | `user.metadata.agent_memory` | No | Medium | No | Reads metadata-backed execution memory. Candidate only through route-level wrapper, not direct service migration. |
| `src/modules/ai/services/agent-memory.ts` | `agentMemoryService.remember()` | Runtime | No | No | No | Yes | No | Yes | `user.metadata.agent_memory` | No | High | No | Writes runtime report memory. Blocked until durable runtime memory plan. |
| `src/modules/business-intelligence/components/CEOAdvisorDashboard.tsx` | AI workforce CTA | Dashboard | No | No | No | No | No | No | `router.push('/ai-workforce')` | No | Medium | No | Entry link only. Does not consume runtime state. |
| `src/modules/business-intelligence/ceoAdvisorEngine.ts` | `/ai-workforce` action route hints | Dashboard | No | No | No | No | No | No | route strings in `actions[]` | No | Medium | No | Strategic route handoff only. No runtime state read. |
| `src/modules/mission-engine/services/mission-service.ts` | AI assistant task route | Dashboard | No | No | No | No | No | No | task route `/ai-workforce` | No | Medium | No | Journey-to-runtime entry route only. |
| `src/app/api/v1/automation/route.ts` | Automation executions GET | Runtime | No | No | No | No | No | No | `prisma.activity` workflow/automation logs | No | Low | No | Not Agent Runtime. Automation workflow execution is a separate domain. |
| `src/modules/automation/components/AutomationDashboard.tsx` | Automation execution history | Runtime | No | No | No | No | No | No | `/api/v1/automation` | No | Low | No | Not Agent Runtime. Displays automation workflow executions only. |
| `src/__tests__/services/agent-manager.test.ts` | Agent manager tests | Assignment | No | Yes | Yes | No | No | No | `agentManager` helper methods | No | Low | No | Test consumer only. Does not validate execute route branches or memory writes. |

## Consumer Notes

- The only bounded cutover candidate is `GET /api/v1/ai-workforce`.
- `POST /api/v1/ai-workforce/execute` is not a candidate because it dispatches agents and writes runtime memory.
- `WorkforceDashboard` is not a candidate because Workforce UI cutover is explicitly blocked.
- Automation workflow execution is not Agent Runtime, even though it uses execution terminology.
- `AIUsageLog` exists in schema and adjacent admin analytics, but no active Agent Runtime consumer currently uses it as execution-result authority.
