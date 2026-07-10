# Content Engine Dependency Map

Scope: `src/modules/content-engine`, plus the content dependencies that `ContentCommandCenter`, `ContentDashboard`, and `ContentEngineDashboard` pull in.

Audit only. No migration. No code changes.

## 1. Full Dependency Graph

### Branch A: ContentCommandCenter

`ContentCommandCenter`
↓
`useDashboardMission()`
↓
`useMissionState()`
↓
`missionService`

`ContentCommandCenter`
↓
`usePublishingCenter()`
↓
`useEvolutionProjection()`
↓
`EvolutionProjection`
↓
`EvolutionAdapter`
↓
`EvolutionSnapshot`

### Branch B: ContentDashboard

`ContentDashboard`
↓
`useContentEngine()`
↓
`useUserEvolution()`
↓
`getUserLevel()` / `unlock-service` / `user-level-service`

`ContentDashboard`
↓
`useDashboardMission()`
↓
`useMissionState()`
↓
`missionService`

`ContentDashboard`
↓
`usePublishingCenter()`
↓
`useEvolutionProjection()`
↓
`EvolutionProjection`
↓
`EvolutionAdapter`
↓
`EvolutionSnapshot`

### Branch C: ContentEngineDashboard

`ContentEngineDashboard`
↓
local `useContentEngine()` query
↓
`GET /api/v1/content-engine`
↓
`contentEngineService`
↓
`Prisma`
↓
`brandProfile` / `content` / `contentCalendar`

`ContentEngineDashboard`
↓
local mutation hooks
↓
`POST /api/v1/content-engine/generate`
↓
`contentEngineService.generatePlatformPost()`
↓
`Prisma content.create()`

`ContentEngineDashboard`
↓
local mutation hooks
↓
`POST /api/v1/content-engine/calendar`
↓
`contentEngineService.generateCalendar()`
↓
`Prisma contentCalendar.deleteMany()` / `createMany()`

## 2. Mission Dependencies

### `useDashboardMission`

Usages:
- `src/modules/content-engine/components/ContentCommandCenter.tsx`
- `src/modules/content-engine/components/ContentDashboard.tsx`
- `src/modules/dashboard/components/DashboardV4.tsx`

Authority chain:
`useDashboardMission`
↓
`useMissionState`
↓
`missionService`
and
`useEvolutionProjection`
↓
`EvolutionProjection`
↓
`EvolutionAdapter`

### `useMissionState`

Usages in this scope:
- `src/modules/dashboard/hooks/useDashboardMission.ts`
- `src/modules/mission/hooks/use-mission.ts`

Direct uses found in content surfaces:
- `useDashboardMission`

Authority chain:
`useMissionState`
↓
`missionService`

### `missionService`

Usages relevant to content engine:
- `src/modules/dashboard/hooks/useDashboardMission.ts` via `getCurrentMission`
- `src/modules/mission/utils/complete-mission.ts`
- `src/modules/mission/services/mission-service.ts`

Authority chain:
`missionService`
↓
`dashboard mission`
↓
`ContentCommandCenter`
and
`ContentDashboard`

## 3. Publishing Dependencies

### `usePublishingCenter`

Usages:
- `src/modules/content-engine/components/ContentCommandCenter.tsx`
- `src/modules/content-engine/components/ContentDashboard.tsx`
- `src/modules/content-publishing/hooks/usePublishingCenter.ts`

Current dependency chain:
`usePublishingCenter`
↓
`useEvolutionProjection`
↓
`EvolutionProjection`
↓
`EvolutionAdapter`
↓
`EvolutionSnapshot`

### `useEvolutionProjection`

Usages in this scope:
- `src/modules/content-publishing/hooks/usePublishingCenter.ts`
- `src/modules/dashboard/hooks/useDashboardMission.ts`

### `useUserEvolution`

Usages in this scope:
- `src/modules/content-engine/hooks/useContentEngine.ts`

## 4. Database Dependencies

### ContentEngineDashboard API calls

- `GET /api/v1/content-engine`
- `POST /api/v1/content-engine/generate`
- `POST /api/v1/content-engine/calendar`

### Backend state reads and writes

`GET /api/v1/content-engine`
↓
`contentEngineService.getPillars()`
↓
brand DNA / `brandProfile.contentPillars`

`GET /api/v1/content-engine`
↓
`contentEngineService.getLastPost()`
↓
`Prisma content.findFirst()`

`GET /api/v1/content-engine`
↓
`contentEngineService.getCalendar()`
↓
`Prisma contentCalendar.findMany()`

`GET /api/v1/content-engine`
↓
`contentEngineService.getPublishedCount()`
↓
`Prisma content.count()`

`POST /api/v1/content-engine/generate`
↓
`contentEngineService.generatePlatformPost()`
↓
`Prisma content.create()`
↓
`content` table

`POST /api/v1/content-engine/calendar`
↓
`contentEngineService.generateCalendar()`
↓
`Prisma contentCalendar.deleteMany()`
↓
`Prisma contentCalendar.createMany()`

## 5. Evolution Dependencies

Does `useContentEngine()` itself still call legacy evolution?

`YES`

Current chain:
`useContentEngine`
↓
`useUserEvolution`
↓
`getUserLevel`
↓
`unlock-service`

So `useContentEngine` remains the only content-engine hook still directly on the legacy bridge.

## 6. Migration Strategy

Can Content Engine migrate by changing `useContentEngine` only?

`NO`

Why:
- `ContentCommandCenter` does not use `useContentEngine`; it uses `useDashboardMission` and `usePublishingCenter`.
- `ContentDashboard` uses all three hooks: `useContentEngine`, `useDashboardMission`, and `usePublishingCenter`.
- `ContentEngineDashboard` is already database-backed and independent of legacy evolution.

To fully remove legacy evolution from the content engine surface, `useContentEngine` must change, and the consumer graph around `ContentDashboard` must still be checked for UX consistency.

## 7. Hidden Consumers

Still evolution-dependent:
- content cards
- publishing permissions
- CTA visibility
- smart schedule visibility
- content strategy unlock state

Not evolution-dependent:
- content generation API results
- calendar persistence
- published content counts

## 8. Authority Analysis

Content Engine is controlled by three different authorities:

`mission state`
↓
`useDashboardMission`
↓
`missionService`

`evolution level`
↓
`useContentEngine`
↓
`useUserEvolution`
↓
`getUserLevel` / `unlock-service`

`database state`
↓
`contentEngineService`
↓
`Prisma`

So the surface is not canonical yet. It is a mixed authority stack.

## 9. Projection Readiness

| Surface | Status | Reason |
|---|---|---|
| ContentCommandCenter | PARTIAL | Mission and publishing branches are already split; publishing is canonical, mission is still mission-state-backed. |
| ContentDashboard | PARTIAL | `useContentEngine` is still legacy; other branches already use canonical projection. |
| ContentEngineDashboard | YES | Already database-backed; no legacy evolution dependency. |

## 10. Removal Readiness

`useContentEngine` is not removable yet.

Reason:
- It is still directly used by `ContentDashboard`
- It still directly calls `useUserEvolution`
- Its lock and strategy output still depend on legacy level state

## 11. Raw Search Notes

Repository hits in this scope:
- `useContentEngine`: 3 hits
- `usePublishingCenter`: 3 hits
- `useDashboardMission`: 3 hits
- `useMissionState`: 1 direct mission hook, plus the dashboard bridge chain
- `missionService`: mission authority files and the dashboard mission helper
- `useEvolutionProjection`: present in publishing and dashboard mission, not in `useContentEngine`
- `useUserEvolution`: still present in `useContentEngine`

## Bottom Line

Content Engine is the most mixed remaining surface:
- `ContentEngineDashboard` is database-backed
- `usePublishingCenter` is already on canonical projection
- `useDashboardMission` is on a hybrid mission/evolution path
- `useContentEngine` still hard-depends on legacy evolution

So the next real removal target is `useContentEngine`, but the content engine surface as a whole is not ready to be treated as a single-authority module yet.
