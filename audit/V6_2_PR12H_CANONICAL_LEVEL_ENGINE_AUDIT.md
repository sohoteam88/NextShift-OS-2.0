# V6.2 PR-12H — Canonical Level Engine Audit

## Summary

This PR is feasible and correctly scoped for the adapter layer.

`EvolutionAdapter` can move off `getUserLevel` and `unlock-service` by introducing canonical pure helpers in `src/modules/evolution/core/`.

However, the legacy bridge is still not fully retireable because:
- `useEvolutionProjection` still has a legacy fallback path that imports `getUserLevel` and `unlock-service`
- `useUserEvolution` still depends on the legacy services and still has at least one live consumer in `useContentPerformance`

So the correct status is:
- Adapter decoupling: READY
- Bridge retirement: BLOCKED

## 1. Adapter Dependency Map

Current canonical flow:

`EvolutionProjection`
→ `EvolutionAdapter`
→ `loadUser(userId)`
→ `missionService.getState(authUser)`
→ `missionService.getJourneyMap(authUser)`
→ `getUserLevel(...)`
→ `getUnlockedModules(level)`
→ `canonicalModulesFromRaw(...)`
→ `EvolutionSnapshot`

Current direct legacy dependencies in the adapter:
- `missionService`
- `getUserLevel`
- `unlock-service` via `getUnlockedModules`

The adapter is already mostly deterministic. The only legacy pieces left are the pure level and unlock transforms.

## 2. Level Dependency Analysis

### `getUserLevel()` in `src/modules/evolution/adapters/evolution-adapter.ts`

- Input:
  - `brandInterview`
  - `brandDNA`
  - `socialSetup`
  - `contentCount`
  - `leadCount`
  - `customerCount`
  - `teamMemberCount`
  - `crmActive`
  - `followUpActive`
- Output:
  - `level`
  - `completedMilestones`
  - `unlockedModules`
  - `nextMilestone`
  - `progressPercentage`
- Purpose:
  - Convert mission-derived signals into the canonical evolution level.
- Used snapshot fields:
  - `snapshot.level`
  - `snapshot.progressPercentage`
  - `snapshot.unlockedModules`
  - `snapshot.completedMissions`
  - `snapshot.totalMissions`
  - `snapshot.nextLevel`

### `getUserLevel()` in `src/modules/evolution/hooks/use-evolution-projection.ts`

- Input:
  - Same mission-derived signals, but computed from `useMissionState()`.
- Output:
  - Legacy `UserEvolutionState`
- Purpose:
  - Provide a synchronous fallback snapshot while the canonical projection loads or fails.
- Used snapshot fields:
  - `snapshot.level`
  - `snapshot.progressPercentage`
  - `snapshot.currentStage`
  - `snapshot.nextLevel`
  - `snapshot.unlockedModules`
  - `snapshot.completedMissions`
  - `snapshot.totalMissions`

### `getUserLevel()` in `src/modules/user-evolution/hooks/useUserEvolution.ts`

- Input:
  - Same mission-derived signals from `useMissionState()`
- Output:
  - Legacy `UserEvolutionState`
- Purpose:
  - Preserve the old evolution contract for legacy consumers.

## 3. Unlock Dependency Analysis

### `unlock-service` in `src/modules/evolution/adapters/evolution-adapter.ts`

- Input:
  - `levelState.level`
- Output:
  - raw unlocked module ids from `getUnlockedModules(level)`
- Purpose:
  - Map level to unlockable modules before canonical module normalization.
- Used snapshot fields:
  - `snapshot.unlockedModules`

### `unlock-service` in `src/modules/evolution/hooks/use-evolution-projection.ts`

- Input:
  - `levelState.level`
- Output:
  - raw unlocked module ids from `getUnlockedModules(level)`
- Purpose:
  - Rebuild a legacy-compatible snapshot when the canonical projection is unavailable.
- Used snapshot fields:
  - `snapshot.unlockedModules`

### `unlock-service` in `src/modules/user-evolution/hooks/useUserEvolution.ts`

- Input:
  - `legacyLevelState.level`
- Output:
  - `getUnlockedModules()`
  - `isModuleUnlocked()`
  - `getLockedReason()`
- Purpose:
  - Preserve legacy module gating and lock labels.

## 4. Snapshot Field Inventory

### Canonical path: `src/modules/evolution/adapters/evolution-adapter.ts`

- `snapshot.level`
  - Source: `getUserLevel(input).level`
- `snapshot.currentStage`
  - Source: `missionService.getState(authUser).currentStage?.id ?? 'growth_mode'`
- `snapshot.progressPercentage`
  - Source: `missionService.getState(authUser).progressPercent`
- `snapshot.unlockedModules`
  - Source: `getUnlockedModules(levelState.level)` then canonical module mapping
- `snapshot.completedMissions`
  - Source: `normalizeMissionChecks(progress.completedChecks).length`
- `snapshot.totalMissions`
  - Source: `missionService.getJourneyMap(authUser).length`

### Fallback path: `src/modules/evolution/hooks/use-evolution-projection.ts`

- `snapshot.level`
  - Source: `getUserLevel(input).level`
- `snapshot.currentStage`
  - Source: `LEVEL_TO_STAGE[levelState.level]`
- `snapshot.progressPercentage`
  - Source: `getUserLevel(input).progressPercentage`
- `snapshot.unlockedModules`
  - Source: `getUnlockedModules(levelState.level)`
- `snapshot.completedMissions`
  - Source: `levelState.completedMilestones.length`
- `snapshot.totalMissions`
  - Source: `Math.max(levelState.completedMilestones.length, 7)`

## 5. Replacement Feasibility

### Can `getUserLevel` be replaced by direct snapshot logic?

YES.

Reason:
- It is already pure threshold logic.
- The adapter already has the normalized inputs needed to derive the same result.
- A canonical `deriveLevel()` helper can reproduce the current behavior without touching mission persistence.

### Can `unlock-service` be replaced by direct snapshot logic?

YES.

Reason:
- Unlocks are a pure function of level.
- The canonical snapshot already carries `level`.
- A canonical `deriveUnlocks()` helper can replace the legacy unlock matrix inside the adapter.

## 6. Fallback Dependency

Why fallback still requires legacy services:
- `useEvolutionProjection` must return something synchronously while the async canonical snapshot loads.
- The fallback path currently reconstructs the same progression state from `useMissionState()`.
- That fallback still uses `getUserLevel` and `unlock-service` because no canonical core helper exists yet.

Can fallback be removed?

NO, not in this PR.

Reason:
- The scope forbids modifying `useEvolutionProjection`.
- Removing fallback would change runtime behavior and loading semantics.
- The projection stack still needs a compatibility path until all callers trust the canonical projection fully.

## 7. Retirement Readiness

- `useUserEvolution` - BLOCKED
- `getUserLevel` - BLOCKED
- `unlock-service` - BLOCKED
- `user-level-service` - BLOCKED

Interpretation:
- These are blocked for deletion today, not blocked for replacement inside the adapter.
- `EvolutionAdapter` itself is ready to stop importing them once canonical helpers exist.

## 8. Recommended Decoupling Order

1. Add `src/modules/evolution/core/derive-level.ts`
   - Move the pure milestone and threshold math here.
   - Keep behavior identical to `getUserLevel()`.

2. Add `src/modules/evolution/core/derive-unlocks.ts`
   - Move the level-to-unlock mapping here.
   - Preserve canonical module mapping behavior.

3. Switch `src/modules/evolution/adapters/evolution-adapter.ts`
   - Replace legacy service imports with the new core helpers.
   - Keep `missionService` for progress and journey totals.

4. Re-evaluate `useEvolutionProjection`
   - Once the adapter is stable, decide whether the fallback still needs the legacy services or can be simplified later.

5. Delete legacy services only after the fallback and remaining legacy consumers are removed.

## Validation

- `pnpm type-check` passed
- `pnpm build` passed

## Bottom Line

PR-12H is the right next step.

It can decouple the adapter from legacy level/unlock services without breaking `EvolutionSnapshot`.
It does not, by itself, make the bridge retireable because the fallback path and legacy hook surface still exist.
