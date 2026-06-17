# V6.1 Evolution Projection Consolidation Review

## Summary

This sprint plan is workable and correctly scoped as a projection-first consolidation.

It preserves the real progression authority in `missionService` and avoids introducing a new persistence layer.
That is the right constraint for Sprint 1.

The plan’s main value is that it turns the current mess into a single consumer contract:
- `EvolutionSnapshot`
- `EvolutionAdapter`
- `EvolutionProjection`

## What The Plan Gets Right

### 1. It does not move authority
The plan explicitly keeps:
- `public.userProgress`
- `missionService`

That is correct.

Sprint 1 should not create another persistence owner.

### 2. It focuses on consumers first
The right consumers are listed:
- Sidebar
- Dashboard
- Lead Engine
- CRM Engine
- Sales Engine
- Team Engine

Those are the surfaces currently duplicating unlock and level logic.

### 3. It preserves Journey as mission-driven
This is correct.

Journey should be allowed to consume mission state and evolution state, but it should not become the source of level calculation.

### 4. It introduces a system truth dashboard
`/admin/system-truth` is the right place to expose:
- progression authority
- current projection
- feature flag state
- legacy vs migrated consumers

## Where The Plan Is Stronger Than The Current Runtime

### EvolutionProjection does not exist yet
That is fine.

The current codebase still uses:
- `useUserEvolution()`
- `getUserLevel()`
- `unlock-service`
- module-specific lock helpers

The new projection layer is necessary because the current runtime still lets each consumer interpret evolution differently.

### Sidebar migration is currently a real bottleneck
The sidebar already pulls from `useUserEvolution()` and mission sidebar config.
It is exactly the kind of consumer that should move to a canonical projection first.

### Engine migration is the right place to remove duplicated unlock logic
`useLeadEngine`, `useCRMEngine`, `useSalesEngine`, and `useTeamEngine` all depend on `useUserEvolution()` for access gating.
That means this sprint can remove a lot of duplicated lock behavior without touching persistence.

## Gaps In The Plan

### 1. `EvolutionProjection` is not fully defined as a read contract
The plan says the projection should expose canonical `EvolutionSnapshot`, but it does not define whether the projection:
- is a hook
- is a server-side service
- is a client-side data wrapper
- or supports both

That matters because consumers are split between server pages and client components.

### 2. `user-level-service` ownership remains ambiguous
The plan says to keep `user-level-service` and `unlock-service` during Sprint 1, which is sensible.

But it does not define whether they remain:
- low-level helpers inside the adapter
- or shared public utilities for other modules

That boundary should be explicit.

### 3. `completedMissions` and `totalMissions` need semantic definition
The DTO is feasible, but these two fields need a stable meaning:
- mission map stages?
- journey checks?
- completed progression milestones?

Without that, different consumers may display different counts even while using the same DTO.

### 4. The verification matrix should include hidden consumers
The plan lists the obvious surfaces, but the current repo also has indirect consumers in:
- content engine
- publishing center
- roadmap
- team/CRM helpers

Those may not need migration now, but they should be checked for hidden `useUserEvolution()` imports before the sprint is considered complete.

## Current Codebase Alignment

### Already aligned
- `useUserEvolution()` is the obvious source to adapt from.
- `unlock-service` already exists and can be reused by the adapter.
- `Sidebar` already branches on evolution level and can be moved to the projection contract.

### Still conflicting
- `DashboardV4` still mixes mission, evolution, and quick stats.
- Engine hooks still own local lock logic.
- Some UI surfaces still assume level logic from helper calls instead of a normalized snapshot.

## Recommended Implementation Notes

### Keep the adapter inside the evolution module
The plan is correct that adapters should live under the domain.
Do not put them in pages, hooks, or route files.

### Use the projection as the only consumer-facing wrapper
Consumers should not reach into `user-level-service` or `unlock-service` directly once the projection is in place.

### Treat Sprint 1 as a compatibility sprint
The current helpers should remain temporarily, but they should become implementation details behind the adapter/projection stack.

### Expand the test matrix
Add explicit tests for:
- Explorer
- Builder
- Operator
- Leader

Across:
- Sidebar
- Dashboard
- Lead Engine
- CRM Engine
- Sales Engine
- Team Engine

## Final Assessment

This is a valid and properly bounded Sprint 1 plan.

It is implementable without introducing a new persistence authority, and it correctly targets the consumer layer first.

The only things still missing are operational:
- exact projection form factor
- semantic definition for mission counts
- hidden consumer audit
- clear boundary for `user-level-service` and `unlock-service` during the migration window

If those are clarified, the plan is ready to execute.

