# V6.2 PR-12J — Fallback Canonicalization Report

## 1. Files Modified

- `src/modules/evolution/hooks/use-evolution-projection.ts`

## 2. Legacy Imports Removed

- `getUserLevel` from `src/modules/user-evolution/services/user-level-service`
- `getUnlockedModules` from `src/modules/user-evolution/services/unlock-service`

## 3. Canonical Imports Added

- `deriveLevel` from `src/modules/evolution/core/derive-level`
- `deriveUnlocks` from `src/modules/evolution/core/derive-unlocks`

## 4. Old Dependency Chain

`useEvolutionProjection`
→ `legacySnapshot`
→ `getUserLevel()`
→ `getUnlockedModules()`
→ `buildLegacyEvolutionSnapshot()`

## 5. New Dependency Chain

`useEvolutionProjection`
→ `legacySnapshot`
→ `deriveLevel()`
→ `deriveUnlocks()`
→ `buildLegacyEvolutionSnapshot()`

## 6. Snapshot Equivalence Verification

Verified fields kept equivalent in the fallback path:
- `snapshot.level`
- `snapshot.progressPercentage`
- `snapshot.currentStage`
- `snapshot.unlockedModules`
- `snapshot.completedMissions`
- `snapshot.totalMissions`

Fallback behavior preserved exactly:
- `projectionSnapshot ?? legacySnapshot`

## 7. Type-check Result

- `pnpm type-check` passed

## 8. Build Result

- `pnpm build` passed

## 9. Remaining Legacy References

Remaining source references to the old legacy services still exist outside the fallback:
- `src/modules/user-evolution/hooks/useUserEvolution.ts`
- `src/modules/user-evolution/services/user-level-service.ts`
- `src/modules/user-evolution/services/unlock-service.ts`

Those references are expected for now because the legacy bridge still exists and `useUserEvolution` is still consumed by `useContentPerformance`.

## 10. Risk Assessment

Risk level: Low

Why:
- The change is limited to the fallback path in one hook.
- Loading and error recovery behavior are unchanged.
- The canonical helpers already matched the old derivation logic in the adapter migration.

Residual risk:
- The fallback still depends on `buildLegacyEvolutionSnapshot`, so the compatibility layer remains in place until the bridge is retired.
- Any future removal of the fallback would need consumer-by-consumer loading verification.

