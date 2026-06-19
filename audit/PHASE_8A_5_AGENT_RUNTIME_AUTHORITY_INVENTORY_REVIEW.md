# PHASE 8A.5 Agent Runtime Authority Inventory Review

## Verdict

`APPROVE AS INVENTORY SCOPE, REJECT AS COMPLETED INVENTORY`

This document is the right next Phase 8A discovery step after AI COO readiness, but it is not itself a completed authority inventory.

The scope is correct because V7.5 must answer:

`How is the work executed?`

The repo already has partial agent runtime behavior, so this cannot be treated as greenfield architecture.

## Why The Scope Is Correct

The requested audit targets the right runtime zones:

- `agentManager.executeAgent()`
- `agentManager.executeMultiAgent()`
- `workforce-orchestrator`
- `agent-memory`
- `ai-workforce` routes
- agent executors under `src/modules/ai/agents`
- `agent-registry`
- workforce dashboard runtime consumption

These are the actual places where execution, assignment, memory, and runtime routing currently happen.

## Current Repo Reality

The active runtime chain is already visible:

`agent-registry -> agentManager -> workforce-orchestrator -> /api/v1/ai-workforce/execute -> agentMemoryService`

Important runtime files:

- `src/modules/ai/services/agent-manager.ts`
- `src/modules/ai/services/workforce-orchestrator.ts`
- `src/modules/ai/services/agent-registry.ts`
- `src/modules/ai/services/agent-memory.ts`
- `src/app/api/v1/ai-workforce/route.ts`
- `src/app/api/v1/ai-workforce/execute/route.ts`
- `src/modules/ai/components/WorkforceDashboard.tsx`

## Preliminary Authority Findings

### Execution Authority

Current execution authority is centered in:

- `agentManager.executeAgent()`
- `agentManager.executeMultiAgent()`
- individual executors under `src/modules/ai/agents/*`

This is a real runtime authority and should be audited at file level.

### Runtime Routing Authority

Runtime routing currently lives in:

- `/api/v1/ai-workforce/execute`
- `workforce-orchestrator.orchestrateForGoal()`
- `agentManager.executeAgent()`
- `agentManager.executeMultiAgent()`

The route currently has at least three execution branches:

- explicit multi-agent goal orchestration
- direct single-agent execution
- default recommended-agent execution

That makes runtime routing a duplicate-authority risk.

### Agent Lifecycle Authority

Lifecycle is only partially modeled today.

Existing lifecycle-like state is mostly derived from:

- `AGENT_REGISTRY`
- tenant plan gates
- current mission stage
- `WorkforceState.available`
- `WorkforceState.recommended`
- `WorkforceState.health`

There is no obvious canonical lifecycle object for:

- queued
- running
- failed
- retried
- completed
- cancelled

This needs a dedicated inventory finding.

### Memory Authority

Current memory authority is:

- `agentMemoryService.remember()`
- `agentMemoryService.recall()`
- `user.metadata.agent_memory`

This is an execution-history store, not a domain authority.

It must not be allowed to become source of truth for:

- user profile
- business state
- journey state
- COO planning

### Tool Execution Authority

Tool execution authority is not yet clearly centralized.

The current agent executors call their own implementation logic and return reports. The requested inventory must identify whether tools are:

- direct code calls inside each executor
- AI provider calls
- domain service calls
- future capability wrappers

This is not resolved by the Phase 8A.5 brief itself.

## What Is Missing Before This Counts As Completed Inventory

The brief does not yet deliver:

- file-level source inventory
- duplicate runtime authority findings
- execution branch map
- lifecycle state map
- memory read/write authority map
- tool execution boundary map
- consumer inventory for runtime execution outputs
- retirement candidates
- migration readiness judgment

## Required Outputs Are Correct

The required output files are the right next artifacts:

- `agent-runtime-source-inventory.md`
- `agent-runtime-duplicate-authorities.md`
- `agent-runtime-source-summary.md`

These should be produced by a dedicated execution task, likely `TASK_013_AGENT_RUNTIME_SOURCE_AUDIT`.

## Main Risks To Track In TASK_013

1. `agentManager` is both executor and recommender.
2. `/api/v1/ai-workforce/execute` owns multiple runtime branch rules.
3. `workforce-orchestrator` chooses agent chains from goal keywords.
4. `agent-registry` mixes agent identity, plan gating, dependencies, and stage mapping.
5. `agent-memory` writes runtime history into `user.metadata`.
6. Individual agent executors may hide tool/domain side effects.
7. There is no canonical `AgentExecution` persistence model yet.

## Final Judgment

Phase 8A.5 is correctly scoped and should proceed.

But this document is still an inventory brief, not a completed inventory.

Final status:

`APPROVE AS INVENTORY SCOPE, REJECT AS COMPLETED INVENTORY`
