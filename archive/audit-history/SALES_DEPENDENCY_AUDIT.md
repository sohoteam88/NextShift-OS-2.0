# Sales Dependency Audit

## 1. Dependency Graph

`/sales`
→ `src/modules/sales-engine/components/SalesDashboard.tsx`
→ `src/modules/sales-engine/hooks/useSalesEngine.ts`
→ `useUserEvolution()`
→ `getUserLevel()`
→ `unlock-service`
→ evolution authority

## 2. Evolution Sources

| Source | Classification | Notes |
| --- | --- | --- |
| `useUserEvolution` | Direct | Imported directly by `useSalesEngine` |
| `useEvolutionProjection` | Not Used | Not currently imported by Sales |
| `getUserLevel` | Direct | Reached through `useUserEvolution` |
| `unlock-service` | Direct | Reached through `useUserEvolution` |
| `missionService` | Indirect | Reached through `useUserEvolution` via `useMissionState()` |

## 3. Hidden Consumers

The Sales domain currently has one visible surface and one hidden dependency path:
- `src/modules/sales-engine/hooks/useSalesEngine.ts`
- `src/modules/sales-engine/components/SalesDashboard.tsx`
- `src/app/(auth)/sales/page.tsx`

Behavior that still depends on evolution:
- lock gate for explorer/builder
- `showFeatures` for operator/leader
- `showAdvanced` for leader
- lock reason text tied to operator unlock

I did not find a separate modern Sales surface equivalent to `/crm-center`.

## 4. Projection Readiness

**NO**

Reason:
- Sales still imports `useUserEvolution()` directly
- the hook is the only authority for lock state and feature visibility
- no projection-based Sales hook exists yet

## 5. Migration Difficulty

**LOW**

Reason:
- only one hook is carrying the legacy dependency
- the surface is single-entry and self-contained
- behavior is mostly a small lock gate plus feature flags

## 6. Split Surface Analysis

Sales is **not** split into modern and legacy surfaces like CRM.

Current surface:
- `/sales` → legacy `SalesDashboard` → `useSalesEngine`

No separate modern command-center projection surface was found.

## 7. Recommended Migration Order

1. Migrate `useSalesEngine()` to `useEvolutionProjection()`
2. Preserve lock reason copy and operator/leader visibility
3. Verify `/sales` renders unchanged for explorer, builder, operator, and leader
4. Leave sales services and revenue/objection logic untouched

## Validation

- `pnpm type-check` passed
- `pnpm build` passed

## Notes

- No Sales code was modified in this audit.
- No evolution code was modified in this audit.
- No projection code was modified in this audit.
