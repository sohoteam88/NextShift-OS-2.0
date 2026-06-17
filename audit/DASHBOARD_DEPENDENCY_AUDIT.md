# Dashboard Dependency Audit

Discovery only. No code changes were made.

## 1. Dependency Graph

`DashboardV4`
↓
`useDashboardMission`
↓
`getUserLevel`
↓
`user-level-service`
↓
`unlock-service`

`DashboardV4`
↓
`useGrowthRoadmap`
↓
`getGrowthRoadmapState`
↓
`getUserLevel`
↓
`user-level-service`
↓
`unlock-service`

`DashboardV4`
↓
`UnlockPreview`
↓
`useUserEvolution`
↓
`getUserLevel`
↓
`user-level-service`
↓
`unlock-service`

`DashboardV4`
↓
`useUserEvolution`
↓
`getUserLevel`
↓
`user-level-service`
↓
`unlock-service`

## 2. Evolution Sources

| Source | Status | Notes |
| --- | --- | --- |
| `getUserLevel()` | Direct | Used in `useDashboardMission`, `useGrowthRoadmap`, and `useUserEvolution` |
| `useUserEvolution()` | Direct | Used by `DashboardV4` and `UnlockPreview` |
| `unlock-service` | Direct | Used by `useUserEvolution` and `roadmap-service` |
| `missionService` | Indirect | Consumed through `useMissionState()` inside `useDashboardMission` |

## 3. Mission Sources

`useDashboardMission`
↓
`useMissionState`
↓
`/api/v1/mission/state`
↓
`missionService`

`useDashboardMission` also derives mission selection through `getUserLevel()` and `getCurrentMission()`, so it is not mission-only. It is a mission + evolution helper.

## 4. Roadmap Sources

`useGrowthRoadmap`
↓
`getGrowthRoadmapState`
↓
`getUserLevel`
↓
`unlock-service`

Exact chain:
`DashboardV4 -> useGrowthRoadmap -> getGrowthRoadmapState -> getUserLevel -> unlock-service`

## 5. Unlock Sources

`UnlockPreview`
↓
`useUserEvolution`
↓
`getUserLevel`
↓
`unlock-service`

`DashboardV4` does not talk to `unlock-service` directly. The unlock logic is inherited through `useUserEvolution` and `UnlockPreview`.

## 6. Migration Readiness

**PARTIAL**

Why partial:
- `DashboardV4` itself can consume canonical evolution data, but its current helper stack is still wired through legacy evolution authority.
- `useDashboardMission` still computes next action from mission state plus `getUserLevel`.
- `useGrowthRoadmap` still depends on `getUserLevel` and `unlock-service`.
- `UnlockPreview` is a direct legacy evolution consumer.

`DashboardV4` should not be migrated as a single step unless `useDashboardMission`, `useGrowthRoadmap`, and `UnlockPreview` are already compatible with the canonical projection contract.

## 7. Recommended Migration Strategy

Step 1:
`UnlockPreview`

Step 2:
`useGrowthRoadmap` and `roadmap-service`

Step 3:
`useDashboardMission`

Step 4:
`DashboardV4`

## Classification

- `DashboardV4`: Direct migration candidate, but only after helper compatibility is confirmed
- `useDashboardMission`: Indirect migration candidate; helper migration required first
- `useGrowthRoadmap`: Indirect migration candidate; helper migration required first
- `UnlockPreview`: Direct migration candidate
- `missionService`: Not a migration target; source of mission state only

## Conclusion

Dashboard is a high fan-out consumer with three helper branches:
- mission branch
- roadmap branch
- unlock preview branch

The dashboard surface is not ready for a one-shot direct projection swap unless those helper dependencies are normalized first.
