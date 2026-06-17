# CRM Dependency Audit

## 1. Dependency Graph

### Legacy CRM Engine

`/customers`
→ `src/modules/crm-engine/components/CRMDashboard.tsx`
→ `src/modules/crm-engine/hooks/useCRMEngine.ts`
→ `useUserEvolution()`
→ `useMissionState()`
→ mission state API
→ mission authority

### Modern CRM Command Center

`/crm-center`
→ `src/modules/crm/components/CRMDashboard.tsx`
→ `crmCenterService`
→ Prisma queries + brand context
→ database authority

### Conclusion

CRM is split into two surfaces:
- legacy CRM engine on `/customers`
- modern CRM command center on `/crm-center`

Only the legacy CRM engine still depends on the evolution stack.

## 2. Evolution Sources

| Source | Classification | Notes |
| --- | --- | --- |
| `useUserEvolution` | Direct | Imported directly by `useCRMEngine` |
| `getUserLevel` | Indirect | Used inside `useUserEvolution` |
| `unlock-service` | Indirect | Used inside `useUserEvolution` |
| `missionService` | Indirect | Reached through `useMissionState()` inside `useUserEvolution` |

## 3. Hidden Consumers

The CRM pieces that still depend on evolution state are:
- `src/modules/crm-engine/hooks/useCRMEngine.ts`
- `src/modules/crm-engine/components/CRMDashboard.tsx`
- `src/app/(auth)/customers/page.tsx`

Behavior that still depends on evolution:
- CRM lock gate for explorer/builder
- `showPipeline` for operator/leader
- `showAdvanced` for leader
- lock reason text tied to operator unlock

The modern CRM center stack is not an evolution consumer:
- `src/modules/crm/components/CRMDashboard.tsx`
- `src/modules/crm/crmCenterService.ts`

## 4. Projection Readiness

**PARTIAL**

Reason:
- the modern CRM command center is already projection-neutral
- the legacy CRM engine still uses `useUserEvolution()` and should be migrated before CRM can be considered fully projection-ready

## 5. Migration Difficulty

**HIGH**

Reason:
- CRM is split across two user-facing surfaces
- one surface is already modernized, the other still gates features by legacy evolution level
- the migration must preserve lock behavior, operator/leader visibility, and current dashboard copy

## 6. Recommended Migration Order

1. Migrate `useCRMEngine()` to `useEvolutionProjection()`
2. Keep `crmCenterService` unchanged
3. Preserve `/customers` UI behavior while swapping the data source
4. Verify lock states for explorer, builder, operator, and leader
5. Confirm `/crm-center` remains unchanged

## Validation

- `pnpm type-check` passed
- `pnpm build` passed

## Notes

- No CRM code was modified in this audit.
- No projection code was modified in this audit.
- No evolution hook was modified in this audit.
