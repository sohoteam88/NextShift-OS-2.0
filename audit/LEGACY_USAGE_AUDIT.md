# Legacy Usage Audit

Scope: repository-wide inventory of remaining Legacy Evolution dependencies and legacy surfaces.

Method:
- searched `src/modules` and `src/app` for `useUserEvolution(`, `useMissionState(`, `useUserLevel(`, `getUserLevel(`, `unlock-service`, `user-level-service`, `missionService`
- checked the requested legacy component names
- checked the requested legacy routes
- classified each item as `ACTIVE`, `INDIRECTLY ACTIVE`, `DEAD`, or `SAFE TO REMOVE`

## Executive Summary

- `useUserEvolution` is still active. It is consumed by four production hooks and remains the compatibility bridge for content-related surfaces.
- `getUserLevel`, `unlock-service`, and `missionService` are still active through the canonical evolution bridge. They are not removable yet.
- `useMissionState` is still indirectly active. It feeds both legacy bridge code and the canonical projection path.
- `useUserLevel` has zero hits in the current tree.
- `MemberDashboard` and `ContentGeneratorPanel` are not present in the current tree.
- `TeamDashboard`, `SalesDashboard`, and the legacy CRM dashboard are still active because their routes are still mounted.
- `/ai` is an active redirect to `/content-engine`, not a dead route.
- `/content-engine` is active and now canonical, but it still has legacy evolution consumers underneath it.

## Hook Inventory

| Symbol | Status | Evidence | Notes |
|---|---|---|---|
| `useUserEvolution` | ACTIVE | `src/modules/content-engine/hooks/useContentEngine.ts`, `src/modules/content-publishing/hooks/usePublishingCenter.ts`, `src/modules/lead-engine/hooks/useLeadEngine.ts`, `src/modules/content-performance/hooks/useContentPerformance.ts`, `src/modules/user-evolution/hooks/useUserEvolution.ts` | Still the shared compatibility hook for content/lead/performance surfaces. |
| `useMissionState` | INDIRECTLY ACTIVE | `src/modules/revenue-activation/hooks/useRevenueJourney.ts`, `src/modules/activation/hooks/useActivation.ts`, `src/modules/dashboard/hooks/useDashboardMission.ts`, `src/modules/evolution/hooks/use-evolution-projection.ts`, `src/modules/user-evolution/hooks/useUserEvolution.ts`, `src/app/(auth)/journey/page.tsx`, `src/app/(auth)/settings/page.tsx` | Shared mission authority. It is used by both legacy bridge and canonical projection. |
| `useUserLevel` | DEAD | 0 hits | No current symbol usage in `src/modules` or `src/app`. |
| `getUserLevel` | INDIRECTLY ACTIVE | `src/modules/user-evolution/hooks/useUserEvolution.ts`, `src/modules/evolution/adapters/evolution-adapter.ts`, `src/modules/evolution/hooks/use-evolution-projection.ts`, `src/modules/user-evolution/services/user-level-service.ts` | Still part of the projection/bridge pipeline. Not removable yet. |

## Service Inventory

| Symbol | Status | Evidence | Notes |
|---|---|---|---|
| `unlock-service` | INDIRECTLY ACTIVE | `src/modules/user-evolution/hooks/useUserEvolution.ts`, `src/modules/evolution/adapters/evolution-adapter.ts`, `src/modules/evolution/hooks/use-evolution-projection.ts` | Bridge-only today, but still required by canonical projection fallback and legacy compatibility hook. |
| `user-level-service` | INDIRECTLY ACTIVE | `src/modules/user-evolution/hooks/useUserEvolution.ts`, `src/modules/evolution/adapters/evolution-adapter.ts`, `src/modules/evolution/hooks/use-evolution-projection.ts`, `src/modules/user-evolution/services/user-level-service.ts` | Same status as `getUserLevel`; this service is still part of live projection logic. |
| `missionService` | ACTIVE | `src/modules/mission/services/mission-service.ts`, `src/modules/mission/utils/complete-mission.ts`, `src/modules/evolution/adapters/evolution-adapter.ts`, `src/modules/evolution/hooks/use-evolution-projection.ts`, `src/app/api/v1/mission/state/route.ts`, `src/app/api/v1/mission/journey/route.ts`, `src/app/api/v1/mission/mode/route.ts`, `src/app/api/v1/mission/complete-check/route.ts` | Canonical mission authority. Must stay. |

## Component Inventory

| Component | Status | Evidence | Notes |
|---|---|---|---|
| `MemberDashboard` | DEAD | not found in current tree | No file and no import sites found. |
| `ContentGeneratorPanel` | DEAD | not found in current tree | No file and no import sites found. |
| `TeamDashboard` | ACTIVE | `src/app/(auth)/team/growth/page.tsx` | Legacy team surface is still mounted. |
| `SalesDashboard` | ACTIVE | `src/app/(auth)/sales/page.tsx` | Legacy sales surface is still mounted. |
| `CRMDashboard` | ACTIVE | `src/app/(auth)/customers/page.tsx`, `src/app/(auth)/crm-center/page.tsx` | Split surface: legacy `/customers` and canonical `/crm-center`. |

## Route Inventory

| Route | Status | Evidence | Notes |
|---|---|---|---|
| `/customers` | ACTIVE | `src/app/(auth)/customers/page.tsx` | Legacy CRM engine surface. |
| `/team/growth` | ACTIVE | `src/app/(auth)/team/growth/page.tsx` | Legacy Team Engine surface. |
| `/sales` | ACTIVE | `src/app/(auth)/sales/page.tsx` | Legacy Sales Engine surface. |
| `/ai` | ACTIVE | `src/app/(auth)/ai/page.tsx` | Redirects to `/content-engine`; still reachable and intentional. |
| `/content-engine` | ACTIVE | `src/app/(auth)/content-engine/page.tsx` | Canonical content surface. Still has `useUserEvolution` consumers underneath. |
| `/crm-center` | ACTIVE | `src/app/(auth)/crm-center/page.tsx` | Canonical CRM surface. |

## What Is Still Safe to Remove

| Item | Status | Why |
|---|---|---|
| `useUserLevel` | SAFE TO REMOVE | No remaining call sites. |
| `MemberDashboard` | SAFE TO REMOVE | Not present in the current tree. |
| `ContentGeneratorPanel` | SAFE TO REMOVE | Not present in the current tree. |

## What Is Not Safe to Remove Yet

| Item | Status | Why |
|---|---|---|
| `useUserEvolution` | NOT SAFE | Still consumed by content, publishing, lead, and performance hooks. |
| `getUserLevel` | NOT SAFE | Still part of canonical projection and legacy bridge. |
| `unlock-service` | NOT SAFE | Still part of canonical projection and legacy bridge. |
| `missionService` | NOT SAFE | Canonical mission authority and API backing. |
| `useMissionState` | NOT SAFE | Shared mission state consumed by both bridge and canonical flows. |
| `TeamDashboard` | NOT SAFE | Mounted by `/team/growth`. |
| `SalesDashboard` | NOT SAFE | Mounted by `/sales`. |
| `CRMDashboard` | NOT SAFE | Mounted by `/customers` and `/crm-center`. |

## Removal Order Recommendation

1. Migrate the remaining `useUserEvolution` consumers:
   - `useContentEngine`
   - `usePublishingCenter`
   - `useLeadEngine`
   - `useContentPerformance`
2. Once those consumers are off the bridge, remove the bridge fallback from `useUserEvolution`.
3. Retire `getUserLevel` and `unlock-service` only after the bridge fallback is gone.
4. Keep `missionService` and `useMissionState` as shared authority unless the mission architecture is intentionally redesigned.

## Raw Search Counts

- `useUserEvolution(`: 5 file hits
- `useMissionState(`: 8 file hits
- `useUserLevel(`: 0 file hits
- `getUserLevel(`: 4 file hits
- `unlock-service`: 3 file hits
- `missionService`: 7 file hits

## Bottom Line

The remaining legacy usage is concentrated in two places:

1. Content and AI-adjacent hooks still rely on `useUserEvolution`.
2. The canonical projection layer still relies on `getUserLevel` and `unlock-service` as bridge helpers.

So today:
- `useUserLevel` can be treated as dead.
- `useUserEvolution`, `getUserLevel`, `unlock-service`, and `missionService` cannot be removed yet.
- `MemberDashboard` and `ContentGeneratorPanel` are already gone from the current tree.
