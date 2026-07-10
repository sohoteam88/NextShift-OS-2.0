# V7.3 Dynamic Journey Engine PRD Review

## Verdict

This is the correct conceptual layer for V7.3.

If:

- V7.1 Interview Authority defines user truth
- V7.2 Business State Engine defines diagnostic business truth

then V7.3 should define orchestration truth.

That layering is coherent.

My conclusion:

`APPROVE DIRECTION, BUT ONLY IF MISSION OWNERSHIP IS CLEANLY MOVED HERE`

## What This PRD Gets Right

### 1. It defines a real orchestration layer

The strongest sentence in the PRD is:

```text
It does not diagnose.
It does not determine business readiness.
It does not detect bottlenecks.
Its responsibility is:
determine what should happen next
determine execution sequence
determine milestone progression
determine mission generation
```

That is the right separation.

This is the layer the product currently approximates with several mixed helpers, but does not yet own cleanly in one place.

### 2. It creates the right dependency chain

This structure is strong:

```text
Interview Authority -> Business State -> Journey State
```

That means Journey is not allowed to invent:

- user identity
- audience truth
- business mode truth
- readiness truth
- bottleneck truth

It only translates those into:

- current path
- milestone order
- active mission
- next actions

That is exactly how this layer should behave.

### 3. It gives Dashboard a sensible target architecture

This proposed chain:

```text
Business State
-> Journey State
-> Today's Mission
-> Recommended Action
```

is better than the current product reality.

Today the dashboard still mixes:

- mission state
- journey helper logic
- legacy coach logic
- various domain-derived CTAs

So the PRD is correctly aiming at a simpler runtime.

## Why This PRD Matters In This Codebase

The codebase already has multiple live systems trying to answer "what should happen next?"

Active current realities:

- [mission-service.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/modules/mission-engine/services/mission-service.ts)
- [getNextJourneyAction.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/modules/journey/utils/getNextJourneyAction.ts)
- [useDashboardMission.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/modules/dashboard/hooks/useDashboardMission.ts)
- [funnel-health-service.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/modules/funnel/services/funnel-health-service.ts)
- [funnel-progress-service.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/modules/funnel/services/funnel-progress-service.ts)

This PRD matters because it is the first one that explicitly says:

```text
No domain may create its own journey.
No module may generate its own milestone roadmap.
```

That is the right corrective constraint.

## Main Architectural Strength

The biggest strength here is that V7.3 is not trying to make domain modules smart.

Instead it says:

- domain modules execute
- Journey Engine sequences

That is important because the current codebase has too much "local next action" logic at the edges.

If V7.3 is implemented well, these kinds of outputs become downstream consumers instead of authorities:

- Dashboard CTA
- Journey page milestone view
- AI coach mission suggestion
- domain entry recommendations

## Main Risks

### 1. Mission ownership is the critical fault line

The PRD says:

```text
Mission ownership moves from V7.2 to V7.3.
```

That is the correct call.

But it creates a hard requirement:

the implementation must not leave active mission truth split between:

- Business State Engine
- Journey Engine
- current `missionService`

If that split happens, V7.3 fails immediately.

This is the biggest risk.

### 2. Current runtime already has multiple journey-like layers

Today the product has:

- `/journey` beginner flow built from `getNextJourneyAction()`
- mission state from `missionService`
- dashboard mission aggregation from `useDashboardMission()`
- activation repackaging of journey logic
- funnel-specific next actions

So this PRD is entering a very crowded authority zone.

That means V7.3 cannot be introduced casually as "yet another journey engine".
It must be introduced as a replacement plan for those current orchestration helpers.

### 3. `JourneyPath` is underdefined relative to current business model reality

The proposed values are:

- `creator`
- `consultant`
- `coach`
- `agency`
- `retail`
- `recruitment`
- `hybrid`

This mixes two different taxonomies:

1. business model or role archetype
   - creator
   - consultant
   - coach
   - agency

2. business operating mode
   - retail
   - recruitment
   - hybrid

Those are not the same axis.

If they stay merged into one enum, path logic will become incoherent.

This contract needs to be split.

### 4. Milestone system may collide with current mission/journey maps

The codebase already contains milestone-like systems:

- [journey-map.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/modules/mission/constants/journey-map.ts)
- mission stages in [mission-service.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/modules/mission-engine/services/mission-service.ts)
- funnel progress stages in [funnel-progress-service.ts](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/src/modules/funnel/services/funnel-progress-service.ts)

The PRD does not yet specify how `Milestone` relates to:

- current persisted checks
- existing stage IDs
- funnel-specific progression

Without that mapping, migration will drift.

## What Must Be Tightened Before Implementation

### 1. Split path identity from business mode

`JourneyPath` currently combines two different dimensions.

Recommended split:

- `BusinessMode`
  - `retail | recruitment | hybrid`
- `OperatorArchetype`
  - `creator | consultant | coach | agency`

Then `JourneyState.currentPath` can be one of:

- a business-mode-aware execution path
- or a composed object, not a single overloaded enum

That prevents path logic from becoming ambiguous.

### 2. Define relationship to current `missionService`

The current runtime persisted truth still lives in `public.userProgress` through `missionService`.

So before implementation, the PRD must answer:

- is `missionService` being replaced?
- wrapped as persistence adapter?
- or kept as durable check store behind Journey Engine?

The safest answer is probably:

```text
Journey Engine becomes the orchestration authority.
missionService becomes the persistence adapter until migration is complete.
```

But that needs to be explicit.

### 3. Clarify whether `JourneyState` is diagnostic-progress or execution-progress

The contract includes:

- completed milestones
- active milestone
- next milestones
- mission
- progress

That is good, but it must be clear that:

- `BusinessState.stage` is diagnostic state
- `JourneyState.progress` is execution progress

Those are not interchangeable.

If consumers mix them, dashboard copy and domain CTAs will diverge again.

### 4. Define consumer rollout order

The PRD lists many allowed consumers:

- Dashboard
- AI Coach
- AI COO
- Agent System
- future domain modules

That is too broad for the first rollout.

Recommended first-wave consumers:

- Dashboard
- `/journey`
- `useDashboardMission`

Only after those stabilize should you migrate:

- AI Coach
- domain recommendation systems
- future agent orchestration

## Recommended Implementation Order

### V7.3A

Define types only:

- `JourneyState`
- `JourneyPath`
- `Milestone`
- `JourneyProgress`
- `Mission`

No migration yet.

### V7.3B

Implement orchestration projection only:

- path recommendation
- milestone selection
- next milestone ordering
- progress mapping

No mission generation yet.

### V7.3C

Move mission ownership into Journey Engine:

- one active mission rule
- mission derived from active milestone + bottleneck + readiness delta

At this stage, explicitly adapt or replace current `missionService`.

### V7.3D

Migrate first-wave consumers:

- `/journey`
- dashboard mission surfaces
- dashboard next action CTA

### V7.3E

Audit and retire local journey helpers:

- `getNextJourneyAction()`
- mixed dashboard mission orchestration
- local domain-specific milestone shortcuts where applicable

## Final Recommendation

This PRD is good.

It is the first document in the V7 chain that gives the product a credible execution SSOT:

- V7.1 = user truth
- V7.2 = business diagnostic truth
- V7.3 = execution sequencing truth

That overall architecture is coherent.

But the PRD still needs three critical fixes before implementation:

1. split `JourneyPath` taxonomy
2. explicitly define how current `missionService` is absorbed or adapted
3. define migration order for `/journey` and dashboard before touching AI consumers

So the right decision is:

`APPROVE AS ARCHITECTURE DIRECTION`

with one hard condition:

V7.3 must be the only mission-orchestration authority by the time first-wave consumer migration starts. If mission truth remains split, the whole V7 stack will drift again.
