# V6.1 Evolution Consolidation Review

## Summary

This sprint plan is aligned with the current architecture direction.

It correctly identifies the first real consolidation target:
- one evolution authority
- one evolution DTO
- one unlock source
- one progression result across Sidebar, Dashboard, Journey, and route guards

That is the right first sprint because progression is still the root cause of most downstream inconsistency.

## What The Plan Gets Right

### 1. It starts with evolution
This is the correct order.

Current app behavior still lets different consumers infer progression from different signals:
- user progress
- role
- milestone completion
- unlock helpers
- feature gates

If that is not normalized first, every later domain will keep inheriting inconsistent access rules.

### 2. It introduces an adapter before deletion
That is the right migration shape.

The plan correctly avoids deleting legacy logic before:
- consumers move
- DTOs exist
- verification passes

### 3. It uses a DTO as the consumer contract
That is the correct boundary for UI and route consumers.

The current codebase still has UI hooks and services calculating progression directly, so a DTO layer is necessary.

### 4. It includes a system truth dashboard
`/admin/system-truth` is the right enforcement surface for the whole V6 program.

## Current Reality Versus The Plan

### Evolution is already partially centralized, but not fully
The app already has:
- `user-level-service`
- `unlock-service`
- `useUserEvolution`

But these are still derived helpers, not a canonical DTO contract.

The plan’s `EvolutionSnapshot` and `EvolutionAdapter` do not exist yet, so the sprint is valid but not yet implemented.

### Dashboard, Journey, and sidebar are not yet DTO-only
The plan says those consumers must read `EvolutionSnapshot` only.

Today they still use:
- `useUserEvolution()`
- `getUserLevel()`
- `getUnlockedModules()`
- mission-derived and roadmap-derived heuristics in some places

So the target contract is correct, but the current runtime still violates it.

### Route guards still need a formal migration path
The plan says route guards should move to `unlock-service`.

That is directionally correct, but the route-layer contract is not yet defined as a DTO-only read path.

## Main Gaps In The Sprint Plan

### 1. `EvolutionSnapshot` fields are defined, but the source semantics are not
The DTO includes:
- `level`
- `progressPercentage`
- `currentStage`
- `nextLevel`
- `unlockedModules`
- `completedMissions`
- `totalMissions`

That is sensible, but the plan does not specify which fields are authoritative when user progress and unlock state disagree.

### 2. `userEvolutionService` is named as the authority, but its mutation boundary is not described
The plan says it resolves:
- user level
- progress
- next level
- unlock state

But it does not say whether it is:
- a pure read service
- a projection service
- or also the write authority over progression state

That distinction matters before implementation starts.

### 3. The sidebar migration verification is still too abstract
The plan lists allowed module access per level, which is good.

But it does not specify:
- which sidebar config file becomes canonical
- how unknown modules are handled
- how legacy role checks are mapped during the transition

### 4. The removal gate is correct, but the measurement method is missing
`Legacy Consumers = 0` is the right deletion rule.

However, the plan does not define how consumers are counted:
- static imports
- route imports
- runtime code paths
- test coverage

Without that, the gate is hard to enforce consistently.

## Current Codebase Implications

### Already aligned
- `useUserEvolution()` is the obvious starting point for adapter extraction.
- `unlock-service` already exists and can be used as the basis for route guard consolidation.

### Still conflicting
- `DashboardV4` still derives progression-adjacent behavior from mission and activation state.
- `growth-roadmap-service` still imports `getUserLevel()` and `getUnlockedModules()`.
- `team-engine` and `crm-engine` also import `useUserEvolution()`, so evolution cleanup will cascade into other domains.

That means Sprint 1 is not isolated. It is the foundation sprint.

## Recommended Execution Notes

### Keep the migration narrow
Do not try to solve mission, CRM, or Team in Sprint 1.
The plan correctly excludes them.

### Define adapter ownership now
`src/modules/evolution/adapters` should own the normalization layer, not pages, hooks, or route files.

### Add a compatibility window
Keep legacy progression helpers alive during the migration window, but make them consume the adapter rather than recompute truth.

### Verify all listed consumers explicitly
The plan should include concrete checks for:
- Sidebar
- Dashboard
- Journey
- route guards
- any hidden consumers in `content-engine`, `crm-engine`, `team-engine`, and roadmap components

## Final Assessment

This is a valid and necessary Sprint 1 plan.

It is not just a design note; it is the right first implementation step.

The only missing pieces are operational:
- exact adapter ownership
- source-of-truth semantics when inputs conflict
- consumer counting for the legacy removal gate
- explicit verification list for hidden progression consumers

Once those are clarified, the sprint is ready to execute.
