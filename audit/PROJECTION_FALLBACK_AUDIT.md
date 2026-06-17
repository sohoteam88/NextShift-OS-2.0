# Projection Fallback Audit

## 1. Fallback Dependency Graph

`useEvolutionProjection`
→ `legacySnapshot`
→ `useMissionState()`
→ mission state input (`completedChecks`, `progressPercent`)
→ `getUserLevel(input)`
→ `buildLegacyEvolutionSnapshot(...)`
→ `getUnlockedModules(levelState.level)`
→ returned `EvolutionSnapshot`

Runtime behavior:
- When `NEXT_PUBLIC_ENABLE_EVOLUTION_PROJECTION_V6` is off, the hook returns the legacy snapshot directly.
- When the flag is on, the hook returns `projectionSnapshot ?? legacySnapshot`.
- That means the fallback is still the synchronous safety net for loading and error recovery.

## 2. Legacy Import Inventory

### `src/modules/evolution/hooks/use-evolution-projection.ts`
- `user-level-service` -> `getUserLevel`
- `unlock-service` -> `getUnlockedModules`
- `useUserEvolution` -> no direct import

### `src/modules/user-evolution/services/user-level-service.ts`
- definition only

### `src/modules/user-evolution/services/unlock-service.ts`
- definition only

### `src/modules/user-evolution/hooks/useUserEvolution.ts`
- imports `getUserLevel`
- imports `getUnlockedModules`
- imports `isModuleUnlocked`
- imports `getLockedReason`
- does not import `useEvolutionProjection` indirectly from this audit scope, but still owns legacy progression logic

## 3. Snapshot Field Inventory

Inside fallback:

- `snapshot.level`
  - Source: `getUserLevel(input).level`
- `snapshot.progressPercentage`
  - Source: `getUserLevel(input).progressPercentage`
- `snapshot.currentStage`
  - Source: `buildLegacyEvolutionSnapshot(...) -> LEVEL_TO_STAGE[levelState.level]`
- `snapshot.unlockedModules`
  - Source: `getUnlockedModules(levelState.level)`
- `snapshot.completedMissions`
  - Source: `buildLegacyEvolutionSnapshot(...) -> input.completedMilestones.length`
- `snapshot.totalMissions`
  - Source: `buildLegacyEvolutionSnapshot(...) -> Math.max(input.completedMilestones.length, 7)`

## 4. Canonical Replacement Analysis

### Can fallback replace `getUserLevel()` with `deriveLevel()`?
YES.

Reason:
- `deriveLevel()` already reproduces the same milestone, threshold, and level behavior as the legacy service.
- The fallback input is already the same mission-derived boolean/count model.
- `deriveLevel()` is pure and can be used without changing loading semantics.

### Can fallback replace `getUnlockedModules()` with `deriveUnlocks()`?
YES.

Reason:
- `deriveUnlocks()` already reproduces the same level-to-module mapping after canonical module mapping.
- The fallback only needs the `level`, which `deriveLevel()` already produces.

## 5. Fallback Purpose Analysis

Primary purpose:
- Loading State
- Error Recovery
- Legacy Compatibility

Secondary purpose:
- Preserve a usable snapshot when canonical projection has not loaded yet or cannot be resolved.

Not the main purpose:
- Offline State

The hook is not an offline cache. It is a deterministic synchronous compatibility path.

## 6. Removal Readiness

Can fallback be removed today?
- NO

Why:
- The hook still returns `projectionSnapshot ?? legacySnapshot` to avoid a null snapshot during canonical loading.
- Several direct `useEvolutionProjection()` consumers read snapshot fields eagerly.
- Removing the fallback would change initial render behavior and can expose null snapshot states that current consumers do not uniformly guard against.

## 7. Impact Analysis

If fallback is removed today, the direct consumers of `useEvolutionProjection()` become exposed to a null-loading window:

- `src/components/layouts/Sidebar.tsx`
- `src/modules/experience/components/UnlockPreview.tsx`
- `src/modules/team-engine/hooks/useTeamEngine.ts`
- `src/modules/crm-engine/hooks/useCRMEngine.ts`
- `src/modules/growth-roadmap/hooks/useGrowthRoadmap.ts`
- `src/modules/dashboard/components/DashboardV4.tsx`
- `src/modules/dashboard/hooks/useDashboardMission.ts`
- `src/modules/content-engine/hooks/useContentEngine.ts`
- `src/modules/content-publishing/hooks/usePublishingCenter.ts`
- `src/modules/lead-engine/hooks/useLeadEngine.ts`
- `src/modules/sales-engine/hooks/useSalesEngine.ts`

Route impact follows those consumers:
- `/dashboard`
- `/content-engine`
- `/crm`
- `/crm-center`
- `/sales`
- `/team/growth`
- `/brand-builder`
- authenticated shell routes that render `Sidebar`

`src/modules/user-evolution/hooks/useUserEvolution.ts` would still function because it already has its own legacy level path, but it would keep the legacy bridge alive.

## 8. Retirement Readiness

After fallback migration:

- `useUserEvolution` - BLOCKED
- `user-level-service` - BLOCKED
- `unlock-service` - BLOCKED

Reason:
- `useUserEvolution` still owns legacy progression behavior and still has at least one live consumer in `useContentPerformance`.
- `user-level-service` and `unlock-service` remain required by that legacy hook until the bridge is removed end-to-end.

## Conclusion

The projection fallback can be canonicalized, but it cannot be removed yet.

Best next step:
1. Replace the fallback's `getUserLevel()` call with `deriveLevel()`.
2. Replace the fallback's `getUnlockedModules()` call with `deriveUnlocks()`.
3. Keep the fallback itself until all eager snapshot consumers are verified against canonical loading behavior.
4. Only then consider removing the legacy bridge and the fallback path together.

## Validation

- `pnpm type-check` passed
- `pnpm build` passed

