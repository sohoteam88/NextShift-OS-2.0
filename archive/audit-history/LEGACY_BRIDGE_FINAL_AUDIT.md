# Legacy Bridge Final Audit

## 1. Runtime Consumer Inventory

### `useUserEvolution`
- `src/modules/user-evolution/hooks/useUserEvolution.ts` - DEAD as a runtime surface; only the definition remains

### `user-level-service`
- `src/modules/user-evolution/services/user-level-service.ts` - DEAD; only referenced by `useUserEvolution`

### `unlock-service`
- `src/modules/user-evolution/services/unlock-service.ts` - DEAD; only referenced by `useUserEvolution`

### `isModuleUnlocked`
- `src/modules/user-evolution/services/unlock-service.ts` - DEAD utility surface
- `src/modules/user-evolution/hooks/useUserEvolution.ts` - DEAD dependency path only

### `getLockedReason`
- `src/modules/user-evolution/services/unlock-service.ts` - DEAD utility surface
- `src/modules/user-evolution/hooks/useUserEvolution.ts` - DEAD dependency path only

## 2. Route Consumer Inventory

No live route currently depends on `useUserEvolution` directly or indirectly.

Confirmed source-tree consumers of `useEvolutionProjection` remain active, but they do not route through the legacy bridge:
- `/dashboard`
- `/content-engine`
- `/crm`
- `/crm-center`
- `/sales`
- `/team/growth`
- authenticated shell routes using `Sidebar`

None of those routes import `useUserEvolution`.

## 3. Hook Consumer Inventory

No live hook depends on `useUserEvolution` directly or indirectly.

`useContentPerformance` was the last consumer and was deleted in PR-14A.

## 4. Service Consumer Inventory

### `user-level-service`
- No live consumer remains.

### `unlock-service`
- No live consumer remains.

### `isModuleUnlocked`
- No live consumer remains.

### `getLockedReason`
- No live consumer remains.

## 5. Bridge Isolation Assessment

Legacy Bridge Isolation: FULL

Reason:
- `useUserEvolution` has no runtime consumers.
- `useContentPerformance` was removed.
- The canonical projection stack now uses `deriveLevel()` and `deriveUnlocks()` instead of legacy level/unlock services.
- Remaining mentions are definition-only or historical documentation.

## 6. Deletion Readiness Matrix

- `useUserEvolution` - READY
- `user-level-service` - READY
- `unlock-service` - READY
- `isModuleUnlocked` - READY
- `getLockedReason` - READY

## 7. Impact Analysis

If deleted today:
- Routes broken: none
- Components broken: none
- Hooks broken: none

Exact files that would be removed:
- `src/modules/user-evolution/hooks/useUserEvolution.ts`
- `src/modules/user-evolution/services/user-level-service.ts`
- `src/modules/user-evolution/services/unlock-service.ts`

Exact files that would need cleanup only if the deleted files were still imported anywhere:
- none in `src`

## 8. Final Recommendation

PR-15 can begin.

The legacy bridge is now isolated enough to delete because:
- there are no runtime consumers left in `src`
- the last dead consumer `useContentPerformance` has already been removed
- canonical evolution code owns the live projection path

## Validation

- `pnpm type-check` passed
- `pnpm build` passed

## Notes

Repo-wide grep still finds historical references in architecture docs, but those are not runtime dependencies:
- `docs/architecture/ADR-011-user-evolution-engine.md`
