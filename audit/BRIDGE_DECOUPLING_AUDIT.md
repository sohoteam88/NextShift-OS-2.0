# Bridge Decoupling Audit

## 1. Adapter Dependency Map

`EvolutionProjection`
→ `evolutionProjection.getSnapshot(userId)`
→ `buildEvolutionSnapshot({ userId })`
→ `loadUser(userId)` → `prisma.user`
→ `missionService.getState(authUser)`
→ `missionService.getJourneyMap(authUser)`
→ `getUserLevel(input)`
→ `getUnlockedModules(level)`
→ `canonicalModulesFromRaw(...)`
→ `EvolutionSnapshot`

Direct legacy dependencies still present in the adapter:
- `missionService`
- `getUserLevel`
- `getUnlockedModules` from `unlock-service`

## 2. Level Dependency Analysis

### `getUserLevel()` use in `src/modules/evolution/adapters/evolution-adapter.ts`
- Input: mission-derived boolean and count signals from `missionService.getState()`:
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
  - Derive user level from mission progress so the canonical snapshot can be generated from one deterministic progression model.
- Used snapshot fields:
  - `snapshot.level`
  - `snapshot.unlockedModules`
  - `snapshot.progressPercentage`
  - `snapshot.completedMissions`
  - `snapshot.totalMissions`
  - `snapshot.nextLevel`

### `getUserLevel()` use in `src/modules/evolution/hooks/use-evolution-projection.ts`
- Input:
  - Same mission-derived boolean/count signals, but computed from `useMissionState()` in the client fallback path.
- Output:
  - Same legacy `UserEvolutionState` shape.
- Purpose:
  - Provide a synchronous fallback snapshot while the async canonical projection is loading or unavailable.
- Used snapshot fields:
  - `snapshot.level`
  - `snapshot.progressPercentage`
  - `snapshot.currentStage`
  - `snapshot.nextLevel`
  - `snapshot.unlockedModules`
  - `snapshot.completedMissions`
  - `snapshot.totalMissions`

### `getUserLevel()` use in `src/modules/user-evolution/hooks/useUserEvolution.ts`
- Input:
  - Same mission-derived signals from `useMissionState()`.
- Output:
  - Legacy `UserEvolutionState`.
- Purpose:
  - Preserve the old user-evolution contract for legacy consumers and bridge logic.
- Used snapshot fields:
  - Indirect only. This hook does not produce `EvolutionSnapshot`, but it feeds:
    - `level`
    - `progress`
    - `completedMilestones`
    - `unlockedModules`
    - `isModuleUnlocked`
    - `getLockedReason`

## 3. Unlock Dependency Analysis

### `unlock-service` use in `src/modules/evolution/adapters/evolution-adapter.ts`
- Input:
  - `levelState.level`
- Output:
  - Raw unlocked module ids via `getUnlockedModules(level)`
- Purpose:
  - Translate a level into unlockable module ids before canonicalizing them into `EvolutionModule`.
- Used snapshot fields:
  - `snapshot.unlockedModules`

### `unlock-service` use in `src/modules/evolution/hooks/use-evolution-projection.ts`
- Input:
  - `levelState.level`
- Output:
  - Raw unlocked module ids via `getUnlockedModules(level)`
- Purpose:
  - Rebuild the legacy-compatible snapshot when the canonical projection is unavailable.
- Used snapshot fields:
  - `snapshot.unlockedModules`

### `unlock-service` use in `src/modules/user-evolution/hooks/useUserEvolution.ts`
- Input:
  - `legacyLevelState.level`
- Output:
  - Raw unlocked module ids, plus `isModuleUnlocked()` and `getLockedReason()`
- Purpose:
  - Preserve legacy module gating for old consumers.
- Used snapshot fields:
  - Indirect only. This hook powers legacy gating and labels, not the canonical snapshot DTO.

## 4. Snapshot Field Inventory

### Canonical path: `src/modules/evolution/adapters/evolution-adapter.ts`
- `snapshot.level`
  - Source: `getUserLevel({ ... }).level`
- `snapshot.currentStage`
  - Source: `missionService.getState(authUser).currentStage?.id ?? 'growth_mode'`
- `snapshot.progressPercentage`
  - Source: `missionService.getState(authUser).progressPercent`
- `snapshot.unlockedModules`
  - Source: `getUnlockedModules(levelState.level)` → `canonicalModulesFromRaw(...)`
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
YES, in principle.

Reason:
- The adapter and fallback already have all raw mission signals needed to derive level deterministically.
- The current `getUserLevel` logic is pure threshold math, not an external dependency.

What is still missing:
- A canonical level-derivation helper inside the evolution domain, so the adapter no longer imports the legacy service.

### Can `unlock-service` be replaced by direct snapshot logic?
YES, in principle.

Reason:
- The unlock matrix is also deterministic and purely derived from `level`.
- `EvolutionSnapshot.level` already contains enough information to derive unlockable modules.

What is still missing:
- A canonical unlock map or helper in the evolution domain, so `EvolutionAdapter` and `useEvolutionProjection` stop importing the legacy unlock service.

## 6. Fallback Dependency Analysis

Why fallback still requires `getUserLevel` and `unlock-service`:
- `useEvolutionProjection` is async when the canonical projection is enabled.
- The client needs a synchronous fallback snapshot while the async request is loading or unavailable.
- The fallback currently rebuilds the same progression state from `useMissionState()` to avoid an empty or flickering UI.

Can fallback be removed?
NO, not yet.

Reason:
- The canonical projection is not yet the only runtime path.
- The hook still needs a synchronous state source for first paint and error recovery.
- Removing fallback now would require either SSR hydration of the snapshot or consumer changes to accept loading-only behavior.

## 7. Retirement Readiness

- `useUserEvolution` - BLOCKED
- `getUserLevel` - BLOCKED
- `unlock-service` - BLOCKED
- `user-level-service` - BLOCKED

## 8. Recommended Decoupling Order

1. Move level derivation into canonical evolution code.
   - Introduce a canonical helper for `snapshot.level` computation.
   - Stop importing `getUserLevel` from the legacy service.

2. Move unlock derivation into canonical evolution code.
   - Introduce a canonical unlock map or helper derived from `snapshot.level`.
   - Stop importing `getUnlockedModules` from the legacy unlock service.

3. Keep `useEvolutionProjection` fallback only until the canonical snapshot is trusted everywhere.
   - If loading-only behavior is acceptable, then remove the fallback and let the projection load explicitly.

4. Delete `useUserEvolution` after all surviving consumers are migrated.

5. Delete `user-level-service` and `unlock-service` after the canonical helpers own the logic.

## Validation

- `pnpm type-check` passed
- `pnpm build` passed

## Bottom Line

The bridge is not ready for retirement yet.

The blockers are not business consumers anymore. The blockers are the canonical projection fallback and adapter still depending on legacy level/unlock logic to keep `EvolutionSnapshot` stable during async loading and legacy compatibility.
