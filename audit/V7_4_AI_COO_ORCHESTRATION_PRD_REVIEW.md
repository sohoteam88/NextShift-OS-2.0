# V7.4 AI COO Orchestration PRD Review

## Verdict

Direction is correct.

If:

- V7.1 owns user truth
- V7.2 owns business diagnostic truth
- V7.3 owns journey and mission orchestration truth

then V7.4 should own delegation truth.

That layering is coherent.

My conclusion:

`APPROVE DIRECTION, BUT ONLY IF AI COO REMAINS A PURE CONSUMER OF V7.1–V7.3`

## What This PRD Gets Right

### 1. It defines the right question

The best line in the PRD is:

```text
AI COO answers:
Who should do the work?
```

That is the correct next layer.

It does not compete with:

- Interview Authority: who is the user
- Business State: where the business is
- Journey Engine: what should happen next

It adds:

- which agent or domain should own the execution

That is a valid and useful layer.

### 2. It correctly forbids upward authority writes

This is the most important rule in the document:

- AI COO may not modify Interview Authority
- AI COO may not modify Business State
- AI COO may not modify Journey State

That must stay absolute.

If that rule holds, AI COO can be introduced without corrupting the lower canonical layers.

### 3. It keeps domains specialized

The PRD says AI COO does not directly:

- generate content
- create funnels

and instead delegates to specialized agents.

That is the right architecture.

It prevents the orchestration layer from quietly becoming another domain engine.

## Why This PRD Matters In This Codebase

The repository already contains partial agent and coach systems, but they are not governed by one orchestration authority.

Relevant current surfaces:

- [ai-coach-service.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/modules/ai-coach/ai-coach-service.ts)
- [/api/v1/ai/coach/recommend/route.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/app/api/v1/ai/coach/recommend/route.ts)
- [/api/v1/ai-workforce/execute/route.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/app/api/v1/ai-workforce/execute/route.ts)
- existing AI agent and orchestration inventory referenced in [ai-domain-audit.md](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/audit/ai-domain-audit.md)

Current reality is fragmented:

- AI Coach gives recommendations
- dashboard AI guidance still mixes mission logic
- workforce execution route already does multi-agent orchestration
- various agents already exist with domain behaviors

So V7.4 is solving a real problem:

there is already orchestration behavior in the repo, but it is not canonical.

## Main Architectural Strength

The strongest idea in this PRD is that AI COO is not another "smart recommender".
It is a planner and delegator sitting above the Business Digital Twin.

This is the right structure:

```text
BusinessDigitalTwin
  -> AI COO
  -> COOPlan
  -> domain agent assignment
```

That allows:

- one active objective
- agent selection from one registry
- explicit delegated tasks
- explicit execution timeline

If implemented well, this can finally align:

- Dashboard execution plan
- AI Coach explanation layer
- domain work recommendations

## Main Risks

### 1. AI COO can easily become a competing recommendation authority

The current codebase already has multiple recommendation producers:

- AI Coach recommendation API
- dashboard mission helper outputs
- funnel next action logic
- domain-specific recommendations

If V7.4 starts generating its own priorities without strictly consuming V7.3 mission and V7.2 state, it will recreate the same fragmentation under a new label.

This is the biggest risk.

### 2. Existing `ai-workforce` orchestration can conflict with the proposed AI COO

There is already a runtime route doing multi-agent execution:

- [/api/v1/ai-workforce/execute/route.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/app/api/v1/ai-workforce/execute/route.ts)

That means V7.4 cannot be treated as if the orchestration layer does not exist yet.

The PRD needs to clarify whether:

- AI COO replaces that route's recommendation logic
- wraps it
- or feeds it with canonical plans

Without that, you will have two orchestration authorities.

### 3. AI Coach currently does not behave as a clean consumer

Historical audits already showed that AI Coach has been a fragmented layer:

- [V6_MISSION_TRUTH_REPORT.md](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/audit/V6_MISSION_TRUTH_REPORT.md)

The PRD says AI Coach should become a consumer of AI COO.

That is correct.

But it also means:

- AI Coach must stop inventing priorities
- AI Coach must stop holding its own next-best-action logic
- AI Coach becomes explanation and coaching UX only

That is a bigger migration than the PRD currently spells out.

### 4. Agent registry contract is still too shallow

The proposed `Agent` contract only includes:

- id
- role
- domain
- capabilities

That is enough for documentation, but not enough for real orchestration.

At minimum, runtime delegation will also need:

- input contract
- output contract
- execution cost / latency class
- eligibility rules
- required upstream state

Otherwise the COO can name agents, but not delegate safely.

## What Must Be Tightened Before Implementation

### 1. AI COO must consume `JourneyState.mission`, not invent mission

This point is non-negotiable.

If V7.3 owns mission generation, then V7.4 can only:

- interpret the mission
- break it into delegated tasks
- assign agents
- propose execution timing

It must not redefine the mission itself.

Otherwise V7.3 and V7.4 will overlap immediately.

### 2. `COOPlan` should distinguish assignment from advice

The current contract includes:

- active objective
- delegated tasks
- recommended agents
- execution plan

That is good, but implementation should distinguish:

- hard delegation
- soft recommendation

Example:

- `delegatedTasks`: actionable assignments derived from current mission
- `recommendedAgents`: optional supporting participants

That separation matters if the UI later shows one primary owner and several suggested helpers.

### 3. Agent registry should be projection-backed, not static product copy

The initial agent set is sensible:

- Brand Strategist
- Content Strategist
- Lead Architect
- Sales Coach
- Team Builder

But the PRD should clarify whether registry membership is:

- static config
- plan-gated
- tenant-gated
- state-gated

The current repo already has plan-aware and stage-aware AI behavior in places.
AI COO should not bypass those constraints.

### 4. Dashboard rollout should be strictly first-wave, not domain rollout

The PRD's rollout order is mostly right:

- Dashboard
- AI Coach
- then domains

That order should remain strict.

The worst implementation path would be to let domain modules consume AI COO before Dashboard and AI Coach have converged, because then you'll multiply orchestration surfaces before stabilizing the main one.

## Recommended Implementation Order

### V7.4A

Define canonical types only:

- `COOPlan`
- `DelegatedTask`
- `Agent`
- `AgentAssignment`
- `ExecutionPlan`

No consumer migration.

### V7.4B

Create Agent Registry as read model:

- available agents
- eligibility rules
- domain ownership metadata

No execution yet.

### V7.4C

Create AI COO projection:

- consume `BusinessDigitalTwin`
- consume `JourneyState.mission`
- output `COOPlan`

No domain integration yet.

### V7.4D

Migrate first-wave consumers:

- Dashboard execution plan
- AI Coach explanation layer

At this point AI Coach must stop generating competing priorities.

### V7.4E

Only then wire:

- `ai-workforce`
- domain agent entrypoints
- future SDK integration

## Final Recommendation

This PRD is good.

It is the right layer after V7.3, and it introduces a useful distinction:

- Journey Engine decides what should happen next
- AI COO decides who should take the work

That is a clean architecture.

But it will only work if AI COO is treated as a pure consumer and delegator, not as a new recommendation or mission authority.

So the right decision is:

`APPROVE AS ARCHITECTURE DIRECTION`

with three hard conditions:

1. AI COO must consume mission, not generate a competing mission
2. AI Coach must be demoted to explanation consumer, not priority authority
3. existing `ai-workforce` orchestration must be explicitly absorbed, wrapped, or retired

If those conditions are enforced, V7.4 can become the canonical delegation layer instead of another smart-but-parallel AI surface.
