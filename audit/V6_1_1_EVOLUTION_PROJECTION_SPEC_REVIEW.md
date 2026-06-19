# V6.1.1 Evolution Projection Specification Review

## Summary

This specification is now precise enough to implement.

It removes the main ambiguity from the earlier projection plan:
- the projection is a server contract plus a client hook
- `user-level-service` and `unlock-service` become internal helpers
- the sprint must produce a consumer inventory before closing
- the authority remains `missionService`

That is the correct shape for Sprint 1.

## What The Specification Gets Right

### 1. It freezes authority
This is the most important part.

The spec explicitly keeps:
- `public.userProgress`
- `missionService`

It also explicitly forbids:
- a new persistence layer
- a new progression source
- a new authority service

That matches the current architecture and avoids scope creep.

### 2. It defines a clear projection boundary
The server-side `EvolutionProjection.getSnapshot(userId)` is a good contract.

It gives the rest of the app one place to ask for evolution state.

### 3. It defines a client-facing hook
`useEvolutionProjection()` is the right consumer API for React pages and components.

This is better than letting consumers call `user-level-service`, `unlock-service`, or `getUserLevel()` directly.

### 4. It locks helper ownership
Making `user-level-service` and `unlock-service` internal to the adapter is correct.

That is exactly how you stop helper drift from becoming hidden authority.

### 5. It requires a hidden consumer audit
This is necessary.

The repo still has multiple consumers of evolution logic, including:
- Sidebar
- Dashboard
- Lead Engine
- CRM Engine
- Sales Engine
- Team Engine

The inventory requirement is a real guardrail, not paperwork.

## Current Codebase Alignment

### Already aligned
- `missionService` is the real progression authority today.
- `user-level-service` and `unlock-service` already exist and can be wrapped.
- `Sidebar` already branches by evolution level, so it is a natural first migration consumer.

### Still conflicting
- `useUserEvolution()` is still imported by many modules.
- `getUserLevel()` is still called directly in dashboard and roadmap logic.
- `unlock-service` is still imported directly by some consumers.
- `DashboardV4` still mixes mission and evolution signals in the same experience.

So the spec is correct, but the codebase still needs the migration.

## Important Contract Notes

### 1. `completedMissions` and `totalMissions` are semantically pinned
This is good.

The spec correctly says these come from `missionService.getState()` and may not use roadmap or dashboard counts.

That prevents the common drift where every consumer invents a different notion of completion.

### 2. `nextLevel` is derivable
This is also good.

The spec avoids introducing a separate persistence field for next level.

### 3. The projection must not mutate mission state
Correct.

The adapter and projection are read-only.

## Gaps To Watch

### 1. The spec does not yet define exact `EvolutionProjection` implementation style
It says server contract plus hook, which is enough to implement, but the repo will need a clear decision on:
- SSR fetch vs shared server helper
- cache behavior
- client invalidation behavior

### 2. Hidden consumer audit is mandatory but not yet performed in this turn
The spec requires it, and that is correct.

The implementation should not proceed to deletion until the inventory exists and is reviewed.

### 3. Feature flag rollout should be staged
`ENABLE_EVOLUTION_PROJECTION_V6` is the correct flag, but the actual rollout should be:
- legacy default on
- projection behind flag
- inventory verified
- then consumer-by-consumer migration

## Recommended Implementation Priority

1. Create `EvolutionSnapshot`
2. Create `EvolutionAdapter`
3. Create `EvolutionProjection`
4. Create `useEvolutionProjection()`
5. Generate the consumer inventory
6. Migrate Sidebar
7. Migrate Dashboard
8. Migrate engine consumers
9. Wire `/admin/system-truth`

That sequence matches the spec and avoids moving consumers before the contract exists.

## Final Assessment

This specification is ready for implementation.

It is stricter and better than the earlier projection plan because it removes ambiguity around:
- authority
- helper ownership
- consumer API
- hidden consumer inventory

The remaining work is execution, not architecture.
