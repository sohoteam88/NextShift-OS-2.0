# Agent Runtime Migration Readiness Review

Status: READY WITH CONDITIONS

Scope: review-only judgment based on completed Agent Runtime audit artifacts.

Required inputs reviewed:

- `audit/agent-runtime-source-inventory.md`
- `audit/agent-runtime-duplicate-authorities.md`
- `audit/agent-runtime-source-summary.md`
- `audit/agent-runtime-consumer-inventory.md`
- `audit/agent-runtime-consumer-summary.md`
- `audit/agent-runtime-consumer-risk-report.md`
- `audit/agent-runtime-precedence-report.md`
- `audit/agent-runtime-conflict-report.md`
- `audit/agent-runtime-read-write-authority-map.md`

## Final Decision

Agent Runtime is ready for migration planning, but not ready for direct implementation or consumer cutover.

Final decision:

`READY WITH CONDITIONS`

Why:

- source audit is complete enough
- consumer audit is complete enough
- precedence and conflict rules are explicit
- current runtime chain is known
- consumer surface is narrow
- blockers are concrete and trackable

But:

- execution selection is still branch-based
- lifecycle is incomplete
- memory is metadata-backed
- no canonical `AgentExecution` persistence exists
- tool execution remains fragmented across executor modules

## Section 1: Source Authority Review

| Source | Status | Reason |
| --- | --- | --- |
| `AGENT_REGISTRY` | KEEP | defines agent identity, labels, plan gates, features, dependencies, and display metadata |
| `getAgentsForPlan()` | KEEP | current plan-availability filter and lifecycle source |
| `getAgentsForMissionStage()` | ADAPTER | current stage-to-agent recommendation source; should be wrapped during migration because it overlaps with future COO assignment |
| `agentManager` | KEEP | strongest current execution manager and executor dispatcher |
| `workforce-orchestrator` | ADAPTER | current goal-to-agent-chain router; useful bridge, but overlaps with future delegation/assignment authority |
| `agentMemoryService` | ADAPTER | only active report memory authority, but metadata-backed storage should not become final runtime persistence |
| `GET /api/v1/ai-workforce` | ADAPTER | active lifecycle/memory read boundary; should become Agent Runtime read projection consumer |
| `POST /api/v1/ai-workforce/execute` | ADAPTER | active execution boundary and branch selector; must be wrapped before retirement or rewrite |
| executor modules | KEEP | current tool execution bodies; should be kept as execution implementations with clearer tool boundaries |
| `AIUsageLog` | KEEP AS ADJACENT | usage/cost telemetry, not Agent Runtime report memory |

## Section 2: Projection Readiness

### Execution

Status: READY WITH CONDITIONS

Evidence:

- sources identified
- consumers identified
- precedence identified
- conflicts identified

Condition:

- execution request contract must explicitly handle direct `agentId`, goal orchestration, and default stage fallback.

### Routing

Status: READY WITH CONDITIONS

Evidence:

- route branch logic is mapped
- goal routing is mapped
- stage routing is mapped
- winner order is known

Condition:

- route branching must be treated as current authority, not as a passive API detail.

### Lifecycle

Status: NOT READY FOR FULL MODEL, READY FOR MIGRATION PLANNING

Evidence:

- availability and recommendation sources are mapped
- lifecycle consumers are mapped
- precedence is explicit

Condition:

- current lifecycle is partial. It lacks durable queued/running/completed/failed/retried/cancelled state.

### Memory

Status: READY WITH CONDITIONS

Evidence:

- `agentMemoryService` is the report memory authority
- `AIUsageLog` is adjacent telemetry, not report memory
- read/write authority is mapped

Condition:

- metadata-backed memory must be handled as a migration blocker, not accepted as final runtime persistence.

### Tool Execution

Status: READY WITH CONDITIONS

Evidence:

- executor modules are identified
- domain service reads are mapped
- selected executor owns report output

Condition:

- tool/domain boundaries are fragmented and need explicit adapter treatment before runtime expansion.

## Section 3: Consumer Migration Readiness

| Consumer Cluster | Status | Reason |
| --- | --- | --- |
| `WorkforceDashboard` | Ready For Migration | narrow primary UI consumer, but must preserve request-shape behavior and report refresh behavior |
| Workforce API read route | Ready For Migration | clear lifecycle/memory read boundary |
| Workforce execute route | Blocked | owns three execution branches and memory writes; cannot be treated as thin transport |
| CEO Mode entry | Ready For Migration | route-entry consumer only; does not read runtime state |
| Journey runtime entry | Ready For Migration | route-entry consumer only through `/ai-workforce` task route |
| Memory consumers | Ready With Conditions | consumers are known, but depend on `user.metadata.agent_memory` |

## Section 4: Retirement Candidates

### Execution

- duplicated execution selection paths after canonical execution request exists
- direct mixed-intent behavior where `goal + multi` silently wins over `agentId`

### Routing

- stage-based fallback routing after canonical execution plan exists
- duplicated branch routing inside `/api/v1/ai-workforce/execute`
- keyword-based routing in `workforce-orchestrator` if AI COO owns assignment/delegation plan

### Lifecycle

- derived lifecycle state that claims `active` but always returns empty active executions
- UI-only pending state as substitute for durable runtime lifecycle

### Memory

- metadata-backed execution history after durable execution log exists

### Tool Execution

- local action route generation inside executors after canonical runtime result/action contract exists

## Section 5: Required Adapters

- `agentManager -> AgentRuntime.execution`
- `agentManager.getWorkforceState() -> AgentRuntime.lifecycle`
- `workforce-orchestrator -> AgentRuntime.routing`
- `agentMemoryService -> AgentRuntime.memory`
- `AGENT_REGISTRY -> AgentRuntime.lifecycle`
- `GET /api/v1/ai-workforce -> AgentRuntime read projection adapter`
- `POST /api/v1/ai-workforce/execute -> AgentRuntime execution adapter`
- executor modules -> `AgentRuntime.toolExecution`

## Section 6: Migration Blockers

Hard blockers to track before implementation:

- execution selection precedence is branch-based
- lifecycle model is missing durable execution states
- execution log model is missing
- memory is stored in `user.metadata.agent_memory`
- plan-gating can be bypassed by direct `agentId` execution path
- orchestrator keyword chains do not clearly reapply plan availability
- immediate execution result and visible report display use different paths
- tool boundaries are fragmented across executor modules
- `AIUsageLog` is not linked to agent execution reports

## Section 7: Migration Readiness Score

| Area | Score |
| --- | --- |
| Source Audit | 92 |
| Consumer Audit | 90 |
| Precedence Audit | 90 |
| Projection Readiness | 76 |
| Migration Risk | 68 |

Overall:

`83/100`

Interpretation:

- discovery is strong enough to start migration planning
- implementation should not begin until execute-route and memory/lifecycle contracts are explicitly scoped

## Section 8: Final Decision

Decision:

`READY WITH CONDITIONS`

Migration planning may begin.

Required conditions:

1. Treat `/api/v1/ai-workforce/execute` as an authority that must be migrated, not as a passive route.
2. Define the execution request contract before consumer cutover.
3. Define the runtime memory/execution-log contract before replacing `agentMemoryService`.
4. Define minimum lifecycle semantics before exposing canonical runtime lifecycle to more consumers.
5. Keep executor modules as current tool implementations, but wrap their output through a canonical runtime result contract.

## Final Judgment

Agent Runtime is more migration-ready than AI COO because the consumer surface is narrow.

It is still not implementation-ready because the most important runtime behavior is concentrated inside one branch-heavy execute route and one metadata-backed memory service.

The correct next step is migration planning, not implementation.
