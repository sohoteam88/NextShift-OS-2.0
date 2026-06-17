# Legacy Retirement Audit

## 1. Legacy Hook Inventory

### `useUserEvolution`
- `src/modules/user-evolution/hooks/useUserEvolution.ts` - LEGACY
- `src/modules/content-performance/hooks/useContentPerformance.ts` - INDIRECT ACTIVE through this hook, but the consumer itself is dead

### `useContentPerformance`
- `src/modules/content-performance/hooks/useContentPerformance.ts` - DEAD

Reason:
- No source-tree consumer exists.
- The only reference found is its own definition file.

## 2. Legacy Service Inventory

### `user-level-service`
- `src/modules/user-evolution/services/user-level-service.ts` - LEGACY
- `src/modules/user-evolution/hooks/useUserEvolution.ts` - LEGACY dependency

### `unlock-service`
- `src/modules/user-evolution/services/unlock-service.ts` - LEGACY
- `src/modules/user-evolution/hooks/useUserEvolution.ts` - LEGACY dependency

## 3. Legacy Utility Inventory

### `isModuleUnlocked`
- `src/modules/user-evolution/services/unlock-service.ts` - ACTIVE only inside legacy hook
- `src/modules/user-evolution/hooks/useUserEvolution.ts` - ACTIVE

### `getLockedReason`
- `src/modules/user-evolution/services/unlock-service.ts` - ACTIVE only inside legacy hook
- `src/modules/user-evolution/hooks/useUserEvolution.ts` - ACTIVE

Both utilities are still used, but only by `useUserEvolution`.

## 4. Content Performance Analysis

Status: DEAD

Evidence:
- `grep` found only the definition file.
- No route, component, or hook in `src` consumes `useContentPerformance`.
- The hook still imports `useUserEvolution`, so it keeps the legacy bridge alive only as dead code.

## 5. Legacy Island Map

`useContentPerformance`
→ `useUserEvolution`
→ `getUserLevel()`
→ `getUnlockedModules()`
→ `isModuleUnlocked()`
→ `getLockedReason()`
→ `user-level-service`
→ `unlock-service`

There is no active runtime consumer above `useContentPerformance`.

## 6. Retirement Readiness Matrix

- `useUserEvolution` - BLOCKED
- `user-level-service` - BLOCKED
- `unlock-service` - BLOCKED
- `isModuleUnlocked` - BLOCKED
- `getLockedReason` - BLOCKED
- `useContentPerformance` - READY

Interpretation:
- `useContentPerformance` can be removed immediately because it has no consumers.
- The rest remain blocked because `useUserEvolution` is still live.

## 7. Deletion Impact Matrix

### If `useContentPerformance` is deleted today
- Routes broken: none
- Components broken: none
- Hooks broken: none
- Exact files impacted:
  - `src/modules/content-performance/hooks/useContentPerformance.ts` only

### If `useUserEvolution` is deleted today
- Routes broken: none directly
- Components broken: none directly
- Hooks broken:
  - `src/modules/content-performance/hooks/useContentPerformance.ts`

### If `user-level-service` or `unlock-service` are deleted today
- Hooks broken:
  - `src/modules/user-evolution/hooks/useUserEvolution.ts`
  - `src/modules/content-performance/hooks/useContentPerformance.ts` indirectly through `useUserEvolution`

## 8. Recommended Retirement Order

1. Delete `src/modules/content-performance/hooks/useContentPerformance.ts`
2. Remove `src/modules/user-evolution/hooks/useUserEvolution.ts` once no live consumer remains
3. Delete `src/modules/user-evolution/services/user-level-service.ts`
4. Delete `src/modules/user-evolution/services/unlock-service.ts`

## 9. Final Recommendation

The legacy evolution stack is not fully retireable yet, but it is almost isolated.

`useContentPerformance` is dead and can be removed now.
`useUserEvolution`, `user-level-service`, `unlock-service`, `isModuleUnlocked`, and `getLockedReason` are still blocked by the remaining live legacy hook path.

## Validation

- `pnpm type-check` passed
- `pnpm build` passed

