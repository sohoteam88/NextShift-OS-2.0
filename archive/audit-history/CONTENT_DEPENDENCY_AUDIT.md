# Content Dependency Audit

Scope: `src/modules/content-engine`, `src/modules/content-publishing`, `src/modules/lead-engine`, `src/modules/content-performance`.

This is discovery only. No migration and no deletion were performed.

## 1. Content Engine Analysis

### Surface

`ContentCommandCenter` and `ContentEngineDashboard`

### Dependency chain

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
`useUserEvolution()`
↓
`getUserLevel()` / `unlock-service`

`ContentEngineDashboard`
↓
local content-engine API
↓
database-backed content state

### Why it depends on evolution

- `usePublishingCenter()` still uses `useUserEvolution()` to determine whether the content engine is locked.
- `ContentCommandCenter` uses `useDashboardMission()` for task progress and CTA context.
- The actual content data in `ContentEngineDashboard` is not evolution-driven; it comes from the content-engine API and database state.

### Hidden consumers

- CTA visibility in `ContentCommandCenter`
- publishing queue visibility
- smart schedule visibility
- the `generate recommended content` action in `ContentCommandCenter`

### Migration complexity

`MEDIUM`

Reason: the surface is split between mission state, content permissions, and database-backed content output.

### Removal readiness

`PARTIAL`

Reason: the UI can move to projection, but the content engine still depends on bridge-based lock state and dashboard mission state.

## 2. Publishing Center Analysis

### Surface

`usePublishingCenter()`

### Dependency chain

`usePublishingCenter()`
↓
`useUserEvolution()`
↓
`getUserLevel()` / `unlock-service`

### Why it depends on evolution

- `isLocked` is derived from content-engine unlock state.
- `showSmartSchedule` is derived from evolution level (`operator` or `leader`).
- Queue state itself is not evolution-driven; it is internal publishing-service state.

### Hidden consumers

- publishing permissions
- smart schedule visibility
- queue action availability inside content-engine UI

### Migration complexity

`LOW`

Reason: this hook only needs permission/feature flags, not mission history or content-generation output.

### Removal readiness

`NO`

Reason: it still directly consumes `useUserEvolution()`.

## 3. Lead Engine Analysis

### Surface

`LeadDashboard` and `useLeadEngine()`

### Dependency chain

`LeadDashboard`
↓
`useLeadEngine()`
↓
`useUserEvolution()`
↓
`getUserLevel()` / `unlock-service`

### Why it depends on evolution

- lock state is tied to `lead-magnet`
- `showScoring` is gated by evolution level
- `showAnalytics` is only exposed at `leader`

### Hidden consumers

- lead unlocks
- scoring visibility
- analytics visibility

### Migration complexity

`LOW`

Reason: the hook is small and only uses evolution for capability gating.

### Removal readiness

`NO`

Reason: it still directly consumes `useUserEvolution()`.

## 4. Content Performance Analysis

### Surface

`useContentPerformance()`

### Dependency chain

`useContentPerformance()`
↓
`useUserEvolution()`
↓
`getUserLevel()` / `unlock-service`

### Current status

`DEAD`

Evidence:
- the hook exists
- no current consumer was found in `src/modules` or `src/app`
- no barrel export was found in `src/modules/content-performance`

### Hidden consumers

None found.

### Migration complexity

`LOW`

Reason: it is currently isolated.

### Removal readiness

`YES`

Reason: there are no current call sites in the repo.

## 5. Evolution Dependency Inventory

| Symbol | Classification | Notes |
|---|---|---|
| `useUserEvolution` | DIRECT | Four active content hooks still consume it. |
| `getUserLevel` | INDIRECT | Only reached through `useUserEvolution` and the canonical projection bridge. |
| `unlock-service` | INDIRECT | Same as `getUserLevel`; still part of the bridge path. |
| `missionService` | INDIRECT | Reached through `useDashboardMission()` / `useMissionState()`, not directly from content hooks. |
| `useMissionState` | INDIRECT | Shared mission authority used by dashboard mission and the bridge stack. |
| `useEvolutionProjection` | NOT USED | No direct hits inside content-engine, content-publishing, lead-engine, or content-performance. |

## 6. Projection Readiness

| Surface | Status | Why |
|---|---|---|
| Content Engine | PARTIAL | UI is split: mission CTA is bridge-based, content output is database-backed, and publishing permissions still depend on `useUserEvolution`. |
| Publishing Center | NO | Still directly reads `useUserEvolution`. |
| Lead Engine | NO | Still directly reads `useUserEvolution`. |
| Content Performance | NO / DEAD | No consumers, and the hook itself still depends on `useUserEvolution`. |

## 7. Migration Difficulty Matrix

| Module | Difficulty | Reason |
|---|---|---|
| Content Engine | MEDIUM | Mixed dependency graph: mission state, publishing permissions, and content API output. |
| Publishing Center | LOW | Only permission gating is evolution-dependent. |
| Lead Engine | LOW | Small hook, limited gating logic. |
| Content Performance | LOW | Orphaned hook; migration is not needed if it is deleted. |

## 8. Authority Analysis

Content permissions are controlled by a mixed chain:

`evolution level`
↓
`useUserEvolution()`
↓
`getUserLevel()` / `unlock-service`
↓
`isModuleUnlocked()` / `lockReason`

Mission-driven CTA state is controlled by:

`mission state`
↓
`useMissionState()`
↓
`missionService`
↓
`useDashboardMission()`
↓
`ContentCommandCenter`

Content output itself is controlled by:

`database state`
↓
`content-engine API`
↓
`ContentEngineDashboard`

So the content surfaces are not governed by one authority. They are split across evolution level, mission state, and database state.

## 9. Bridge Dependency

Can `useUserEvolution` be removed after migrating these four modules?

`NO`

Why:
- `useContentEngine`, `usePublishingCenter`, and `useLeadEngine` still actively depend on it.
- `useContentPerformance` is dead, but deleting it alone does not remove the other three dependencies.
- `getUserLevel` and `unlock-service` are still part of the canonical projection bridge, so removing `useUserEvolution` prematurely would break the compatibility path.

## 10. Safe Removal Candidates

| Item | Status | Notes |
|---|---|---|
| `useContentPerformance()` | SAFE TO REMOVE | No current consumers. |
| `ContentPerformance` module hook | SAFE TO REMOVE | Same as above. |

## 11. Active Content Consumers

| Consumer | Status | Evidence |
|---|---|---|
| `useContentEngine()` | ACTIVE | `src/modules/content-engine/hooks/useContentEngine.ts` |
| `usePublishingCenter()` | ACTIVE | `src/modules/content-publishing/hooks/usePublishingCenter.ts` |
| `useLeadEngine()` | ACTIVE | `src/modules/lead-engine/hooks/useLeadEngine.ts` |
| `useContentPerformance()` | DEAD | No usage found |

## 12. Raw Search Counts

- `useUserEvolution(`: 5 file hits
- `getUserLevel(`: 4 file hits
- `unlock-service`: 3 file hits
- `useMissionState(`: 8 file hits
- `missionService`: 7 file hits
- `useEvolutionProjection(`: 0 hits in the four content modules

## Bottom Line

The content stack still has one live legacy bridge and one dead hook:

- Live bridge: `useContentEngine`, `usePublishingCenter`, `useLeadEngine`
- Dead hook: `useContentPerformance`

So the content modules are not ready for full `useUserEvolution` removal yet, but the orphaned performance hook can be removed independently.
