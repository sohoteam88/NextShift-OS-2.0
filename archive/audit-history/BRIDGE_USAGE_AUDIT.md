# Bridge Usage Audit

Scope: repository-wide runtime references to the Legacy Evolution Bridge.

I searched the source tree and also checked repo-wide matches. Historical audit docs and generated artifacts still contain many string mentions of these symbols; those are not runtime dependencies and are treated as documentation only.

## 1. `useUserEvolution` Inventory

| File | Classification | Notes |
|---|---|---|
| `src/modules/user-evolution/hooks/useUserEvolution.ts` | LEGACY | Bridge implementation. Still exported and still builds on legacy helpers. |
| `src/modules/content-performance/hooks/useContentPerformance.ts` | DEAD | Only remaining consumer. No current consumer of this hook was found elsewhere in `src`. |

## 2. `getUserLevel` Inventory

| File | Classification | Notes |
|---|---|---|
| `src/modules/user-evolution/services/user-level-service.ts` | LEGACY | Source of the legacy level derivation logic. |
| `src/modules/user-evolution/hooks/useUserEvolution.ts` | LEGACY | Calls `getUserLevel()` directly. |
| `src/modules/evolution/adapters/evolution-adapter.ts` | INDIRECT ACTIVE | Canonical projection adapter still uses it to build `EvolutionSnapshot`. |
| `src/modules/evolution/hooks/use-evolution-projection.ts` | INDIRECT ACTIVE | Legacy fallback path still uses it when projection is unavailable. |

## 3. `unlock-service` Inventory

| File | Classification | Notes |
|---|---|---|
| `src/modules/user-evolution/services/unlock-service.ts` | LEGACY | Source of the legacy module-unlock matrix. |
| `src/modules/user-evolution/hooks/useUserEvolution.ts` | LEGACY | Calls `getUnlockedModules`, `isModuleUnlocked`, and `getLockedReason`. |
| `src/modules/evolution/adapters/evolution-adapter.ts` | INDIRECT ACTIVE | Canonical projection adapter still uses it. |
| `src/modules/evolution/hooks/use-evolution-projection.ts` | INDIRECT ACTIVE | Legacy fallback path still uses it. |

## 4. `user-level-service` Inventory

| File | Classification | Notes |
|---|---|---|
| `src/modules/user-evolution/services/user-level-service.ts` | LEGACY | The service definition file itself. |
| `src/modules/user-evolution/hooks/useUserEvolution.ts` | LEGACY | Imports and calls `getUserLevel`. |
| `src/modules/evolution/adapters/evolution-adapter.ts` | INDIRECT ACTIVE | Adapter still imports `getUserLevel` from this service. |
| `src/modules/evolution/hooks/use-evolution-projection.ts` | INDIRECT ACTIVE | Legacy fallback path still imports `getUserLevel` from this service. |

## 5. Bridge Entry Points

| File | Bridge Dependency |
|---|---|
| `src/modules/content-performance/hooks/useContentPerformance.ts` | `useUserEvolution` |
| `src/modules/user-evolution/hooks/useUserEvolution.ts` | `useMissionState`, `getUserLevel`, `unlock-service`, `user-level-service` |
| `src/modules/evolution/adapters/evolution-adapter.ts` | `missionService`, `getUserLevel`, `unlock-service`, `user-level-service` |
| `src/modules/evolution/hooks/use-evolution-projection.ts` | `useMissionState`, `getUserLevel`, `unlock-service`, `user-level-service` |

`useUserLevel` has zero hits in the current source tree.

## 6. Deletion Readiness

### `useUserEvolution`

`NO`

Reason: `src/modules/content-performance/hooks/useContentPerformance.ts` still imports it, and that hook would break on deletion. The hook itself is legacy, but it is still referenced.

### `getUserLevel`

`NO`

Reason: it is still part of the canonical projection pipeline via `EvolutionAdapter` and the legacy fallback inside `useEvolutionProjection`.

### `unlock-service`

`NO`

Reason: same as `getUserLevel`. It is still required by the canonical projection bridge and legacy fallback path.

### `user-level-service`

`NO`

Reason: it remains the source implementation for `getUserLevel` and is still imported by both the adapter and the projection fallback.

## 7. Migration Completion Assessment

`PARTIAL`

All known business consumers have been migrated to `useEvolutionProjection()`, but the bridge is still required for:
- the canonical projection fallback path
- the canonical adapter
- one remaining dead content-performance hook

So business migration is done, but bridge retirement is not.

## 8. Bridge Risk Matrix

| Bridge Component | Risk | Reason |
|---|---|---|
| `useUserEvolution` | MEDIUM | Only one direct consumer remains, but deleting it now breaks `useContentPerformance`. |
| `getUserLevel` | HIGH | Still used by the canonical adapter and fallback projection path. |
| `unlock-service` | HIGH | Same as `getUserLevel`; it is part of the live projection pipeline. |
| `user-level-service` | HIGH | It is the underlying source of the level derivation used by live projection code. |

## 9. Recommended Retirement Order

1. Remove or replace `src/modules/content-performance/hooks/useContentPerformance.ts`.
2. Remove the legacy fallback inside `useEvolutionProjection` once canonical projection is fully trusted.
3. Remove legacy helper use from `EvolutionAdapter` if the adapter no longer needs them.
4. Delete `useUserEvolution`.
5. Delete `user-level-service` and `unlock-service` after nothing imports them.

## Bottom Line

The bridge is still used. It is no longer used by the main business consumers, but it is still used by:
- the canonical projection fallback
- the canonical adapter
- one dead content-performance hook

So the bridge cannot be retired today.
