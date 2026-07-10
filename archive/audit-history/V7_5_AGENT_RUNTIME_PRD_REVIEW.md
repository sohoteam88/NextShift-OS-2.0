# V7.5 Agent Runtime PRD Review

## Verdict

Direction is correct.

If:

- V7.1 owns user truth
- V7.2 owns business diagnostic truth
- V7.3 owns execution sequence and mission truth
- V7.4 owns delegation truth

then V7.5 should own execution truth.

That is the right final layering.

My conclusion:

`APPROVE DIRECTION, BUT ONLY IF EXISTING AI-WORKFORCE / AGENT-MANAGER IS ABSORBED INTO THIS RUNTIME`

## What This PRD Gets Right

### 1. It defines the final missing question

The strongest line in the PRD is:

```text
Agent Runtime answers:
How is the work executed?
```

That is the correct final layer.

It stays below:

- Interview Authority
- Business State
- Journey Engine
- AI COO

and should only execute work assigned from above.

That is the right architecture.

### 2. It explicitly forbids upward authority writes

These prohibitions are correct:

- may not modify Interview Authority
- may not modify Business State
- may not modify Journey State
- may not generate new Missions
- may not create competing Priorities

Those rules must remain absolute.

If they do, the runtime can stay operational without becoming another planning layer.

### 3. It introduces the right execution primitives

These objects are the right primitives for a runtime layer:

- `AgentExecution`
- `AgentResult`
- `AgentDefinition`
- `AgentMemory`

Those are runtime concerns, not planning concerns.

That is a good sign. The PRD is thinking at the correct abstraction level.

## Why This PRD Matters In This Codebase

The repository already has partial runtime behavior.
This is important: V7.5 is not introducing agent execution from zero.

Existing runtime surfaces:

- [agent-manager.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/modules/ai/services/agent-manager.ts)
- [workforce-orchestrator.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/modules/ai/services/workforce-orchestrator.ts)
- [/api/v1/ai-workforce/route.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/app/api/v1/ai-workforce/route.ts)
- [/api/v1/ai-workforce/execute/route.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/app/api/v1/ai-workforce/execute/route.ts)
- [WorkforceDashboard.tsx](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/modules/ai/components/WorkforceDashboard.tsx)

There is already:

- agent execution
- multi-agent execution
- workforce UI
- recommended agents
- agent manager tests

So the real job of V7.5 is not "invent runtime".
It is "make runtime canonical and subordinate to V7.4".

## Main Architectural Strength

The strongest idea in this PRD is that runtime is execution-only.

That means:

- V7.4 selects owners and assignments
- V7.5 executes those assignments

If kept clean, this prevents the runtime from becoming another orchestration brain.

That is the single most important constraint in the whole document.

## Main Risks

### 1. Existing `agentManager` already behaves like a partial runtime

This is the central migration risk.

Today, `agentManager` and `ai-workforce` already do some of these things:

- agent selection
- multi-agent execution
- recommended actions
- workforce reporting

If V7.5 starts from a clean-sheet runtime design without explicitly absorbing those behaviors, the codebase will end up with:

- legacy runtime
- new runtime

That would be a direct repeat of earlier SSOT problems.

This is the biggest risk.

### 2. The PRD's `AgentDefinition` is better than V7.4, but still not enough by itself

The new contract improves things by adding:

- input schema
- output schema
- required context
- allowed tools
- execution class

That is much better.

But production runtime also needs:

- failure policy
- retry policy
- timeout budget
- idempotency rules
- side-effect permissions

Without those, the runtime cannot safely manage real work beyond demos.

### 3. Agent Memory is dangerous if not scoped narrowly

The PRD introduces:

```ts
interface AgentMemory {
  agentId: string
  key: string
  value: unknown
  updatedAt: string
}
```

This is reasonable, but memory is the easiest place for runtime to leak into authority.

If memory starts storing:

- user truth
- business state
- mission truth

then V7.5 will silently become another source of truth.

So memory must be scoped to execution continuity only.

### 4. Tool layer can bypass domain authority if too permissive

The PRD lists tools like:

- Brand Generator
- Content Generator
- Video Engine
- Landing Page Builder
- CRM Adapter
- WhatsApp Adapter

This is correct in principle.

But runtime tools must not let agents bypass:

- Brand domain authority
- Content domain authority
- CRM domain authority

The tool layer needs capability boundaries, not just names.

Otherwise runtime becomes a backdoor around the product architecture.

## What Must Be Tightened Before Implementation

### 1. Explicit migration rule for existing `ai-workforce`

The PRD must say exactly one of these:

- `ai-workforce` becomes the first implementation shell of Agent Runtime
- `ai-workforce` is wrapped by Agent Runtime
- `ai-workforce` is retired after Agent Runtime lands

That choice cannot be left implicit.

Today there is already live runtime behavior in that surface.

### 2. Runtime must consume `COOPlan`, not infer work independently

This point is non-negotiable.

If V7.4 owns delegation, then V7.5 runtime can only:

- accept task assignments
- run agents
- return results
- report status

It must not:

- pick its own priorities
- choose a different active objective
- create a different mission

Otherwise V7.4 and V7.5 overlap immediately.

### 3. Define side-effect classes

Runtime outputs are not all equal.

Some are:

- read-only analyses
- proposed drafts

Others are:

- database writes
- content creation
- funnel creation
- CRM updates
- WhatsApp sends

The PRD needs explicit side-effect classes, for example:

- `read_only`
- `draft_only`
- `write_requires_confirmation`
- `autonomous_write`

Without that, "execution" is too ambiguous.

### 4. Queue and retry semantics need business-safe boundaries

The PRD says:

- FIFO
- priority-aware
- retry enabled

Good start, but insufficient.

It needs to answer:

- when retries are safe
- when retries duplicate output
- whether heavy jobs are resumable
- whether failed writes roll back or reconcile forward

This matters because agent runtime is where real side effects begin.

## Recommended Implementation Order

### V7.5A

Inventory and normalize current runtime:

- `agentManager`
- `workforce-orchestrator`
- `ai-workforce` routes
- current agent definitions

Do not build a second runtime first.

### V7.5B

Define canonical runtime contracts:

- `AgentExecution`
- `AgentResult`
- `AgentDefinition`
- `AgentMemory`
- side-effect permissions
- retry / timeout policies

### V7.5C

Wrap existing runtime behind the new contracts:

- old manager becomes adapter or internal engine
- runtime APIs expose canonical execution records

### V7.5D

Connect runtime input to `COOPlan` only:

- execution should start from delegated tasks
- not from ad hoc UI prompts

### V7.5E

Only after that expand:

- memory layer
- richer tool registry
- SDK-agnostic adapters for future external runtimes

## Final Recommendation

This PRD is good.

It completes the V7 stack in a logically correct way:

- V7.1: user truth
- V7.2: business truth
- V7.3: next-step truth
- V7.4: delegation truth
- V7.5: execution truth

That architecture is strong.

But in this codebase, the implementation success condition is very specific:

`V7.5 must absorb the existing ai-workforce / agentManager runtime, not coexist beside it.`

So the right decision is:

`APPROVE AS ARCHITECTURE DIRECTION`

with four hard conditions:

1. runtime must consume `COOPlan`, not invent tasks
2. existing `ai-workforce` and `agentManager` must be explicitly absorbed or wrapped
3. memory must remain execution-scoped, never authority-scoped
4. tool side effects must be permission-classified before rollout

If those conditions hold, V7.5 can become the real execution layer instead of another parallel AI subsystem.
