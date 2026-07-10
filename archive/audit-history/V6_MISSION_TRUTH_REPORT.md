# V6 Mission Truth Report

Audit only. No code was modified.

## 1) Mission Sources

| File | Function | Purpose | Inputs | Outputs | Used By |
|---|---|---|---|---|---|
| `src/modules/mission/services/mission-service.ts` | `missionService.getProgress`, `getState`, `completeCheck` | Canonical persisted mission state in `public.userProgress` | `completedChecks`, `currentStageId`, `mode`, `tenantId`, `userId` | `currentStage`, `nextStage`, `progressPercent`, `completedChecks`, `mode`, `isJourneyComplete` | `useMissionState`, `useDashboardMission`, `useActivation`, `useGrowthRoadmap`, `JourneyPage` |
| `src/modules/mission/hooks/use-mission.ts` | `useMissionState`, `useJourneyMap`, `useCompleteCheck`, `useSetMode`, `useAchievements` | Client bridge to mission API | `/api/v1/mission/state`, `/api/v1/mission/journey`, `/api/v1/mission/complete-check`, `/api/v1/mission/mode` | React Query mission data | Dashboard, journey, activation, roadmap, sidebar |
| `src/modules/journey/utils/getNextJourneyAction.ts` | `getNextJourneyAction` | Next-step resolver for the 7-step journey copy | Boolean completion flags | `title`, `description`, `ctaLabel`, `route`, `progressStep`, `stageName`, `outcomes`, `estimatedMinutes` | `src/app/(auth)/journey/page.tsx`, `useDashboardMission`, `useActivation` |
| `src/modules/dashboard/hooks/useDashboardMission.ts` | `useDashboardMission` | Dashboard mission aggregation layer | Mission state, quick stats | `nextAction`, `userLevel`, `mission`, `progress`, `aiCoachMessage` | `DashboardV4`, `LeadDashboard`, `CRMDashboard` |
| `src/modules/mission-engine/missionEngineService.ts` | `getCurrentMission`, `getMissionProgress`, `completeCurrentMission`, `switchMissionMode` | Legacy/parallel mission engine with its own stage model | `userProgress`, `missionStages`, `userId`, `tenantId` | `CurrentMission`, `MissionProgress`, `CompleteMissionResult` | `useMissionCurrent`, `MissionCard`, `MissionCoachHero`, `TodaysActionCard`, `AiRecommendationPanel` |
| `src/modules/mission-engine/components/MissionCard.tsx` | `useMissionCurrent`, `useCompleteMission`, `useSwitchMissionMode` | UI wrapper around legacy mission engine | `/api/mission/current`, `/api/mission/complete`, `/api/mission/mode` | current mission data and mutations | Legacy dashboard mission surfaces |
| `src/modules/ai-coach/ai-coach-service.ts` | `getAICoachAdvice`, `getNextBestAction` | Mission-keyed coaching text | `missionId`, completed tasks | advice text and next-best-action string | `useDashboardMission`, legacy mission coach views |
| `src/modules/activation/services/activation-service.ts` | `getActivationDay`, `getCurrentDayMission`, `isActivationComplete`, `getActivationLevel` | 7-day activation program | completed event list | current activation day, mission, activation tier | `useActivation`, `ActivationDashboard` |
| `src/modules/growth-roadmap/services/roadmap-service.ts` | `getGrowthRoadmapState`, `getRoadmapStepStatus` | 15-step roadmap projection | mission checks, counts, `getUserLevel` | roadmap steps, current step, next step, progress | `useGrowthRoadmap`, `RoadmapProgressSummary` |
| `src/modules/user-evolution/services/user-level-service.ts` | `getUserLevel` | Derives `Explorer / Builder / Operator / Leader` | brand/content/lead/customer/team/CRM/follow-up signals | `level`, `completedMilestones`, `unlockedModules`, `nextMilestone` | `useUserEvolution`, unlock hooks, roadmap, dashboard mission |

## 2) Mission Authorities

### A. Canonical persisted mission state
- **Purpose:** store progression.
- **Inputs:** completion checks and stage updates.
- **Outputs:** current stage, next stage, progress, completion, mode.
- **Dependencies:** `public.userProgress`.
- **Routes:** `/api/v1/mission/state`, `/api/v1/mission/journey`, `/api/v1/mission/complete-check`, `/api/v1/mission/mode`.
- **Components/hooks:** `useMissionState`, `useDashboardMission`, `useActivation`, `useGrowthRoadmap`, `JourneyPage`.

### B. Journey next-action resolver
- **Purpose:** decide the next CTA from 7 journey checkpoints.
- **Inputs:** boolean completion flags.
- **Outputs:** title, route, outcomes, ETA, progress step.
- **Dependencies:** `useMissionState()` output.
- **Routes:** `/journey`, dashboard today's mission card.
- **Components/hooks:** `getNextJourneyAction`, `JourneyPage`, `DashboardV4`, `useActivation`.

### C. Legacy mission engine
- **Purpose:** stage-driven mission engine with its own stage model and API.
- **Inputs:** `userProgress`, `missionStages`, stage completion requests.
- **Outputs:** current mission, progress, next stage, achievements.
- **Dependencies:** `public.userProgress`, `missionStages.ts`, `achievement-service`.
- **Routes:** `/api/mission/current`, `/api/mission/complete`, `/api/mission/mode`.
- **Components/hooks:** `useMissionCurrent`, `MissionCard`, `MissionCoachHero`, `TodaysActionCard`, `AiRecommendationPanel`, `useDashboardMission`.

### D. Activation engine
- **Purpose:** 7-day onboarding / activation layer.
- **Inputs:** journey completion state.
- **Outputs:** day mission, score, activation tier.
- **Dependencies:** `useMissionState`.
- **Routes:** `DashboardV4` via `ActivationDashboard`.

### E. Growth roadmap engine
- **Purpose:** 15-step roadmap overlay.
- **Inputs:** mission state + business counts + user level.
- **Outputs:** current roadmap step, next step, visible steps.
- **Dependencies:** `useMissionState`, `useUserEvolution`, quick stats.
- **Routes:** dashboard roadmap summary.

### F. AI coach engine
- **Purpose:** generate mission-specific coaching copy.
- **Inputs:** `missionId` from legacy mission engine.
- **Outputs:** advice text.
- **Dependencies:** `getCurrentMission()` from legacy mission engine.

## 3) Mission Dependency Graph

```text
public.userProgress
  ├─> missionService.getState()
  │     └─> useMissionState()
  │           ├─> getNextJourneyAction()
  │           │     ├─> JourneyPage
  │           │     ├─> DashboardV4 (Today's Mission)
  │           │     └─> useActivation()
  │           ├─> getUserLevel()
  │           │     ├─> useUserEvolution()
  │           │     ├─> useGrowthRoadmap()
  │           │     └─> unlock-service
  │           └─> useDashboardMission()
  │                 └─> DashboardV4 / CRM / Sales / Lead surfaces
  │
  └─> missionEngineService.getCurrentMission()
        └─> useMissionCurrent()
              ├─> MissionCard
              ├─> MissionCoachHero
              ├─> TodaysActionCard
              └─> AiRecommendationPanel
```

## 4) Dashboard Mission Logic

### Route
- `/dashboard`

### Component
- `src/app/(auth)/dashboard/page.tsx` selects `DashboardV4` for `member`, `LeaderDashboard` for `leader`, `OperatorDashboard` for `operator`.

### Hook
- `src/modules/dashboard/hooks/useDashboardMission.ts`

### Service chain
- `useMissionState()` -> `getNextJourneyAction()` -> `getUserLevel()` -> `getCurrentMission()` -> `getAICoachAdvice()`.

### Database fields
- New mission state: `public.userProgress.completedChecks`, `currentStageId`, `mode`
- Quick stats: `/api/v1/team/summary`

### What it determines
- “Today’s Mission” is `nextAction`.
- “Current Mission” / AI Coach text comes from legacy `missionEngineService.getCurrentMission()`.

### Evidence
- `DashboardV4` uses `nextAction` for the CTA and `mission` / `aiCoachMessage` for the mission card.
- `useDashboardMission()` explicitly mixes new mission state and legacy mission engine state.

## 5) Journey Mission Logic

### Route
- `/journey`

### Component
- `src/app/(auth)/journey/page.tsx` -> `BeginnerJourneyView`

### Hook
- `useMissionState()`

### Service
- `getNextJourneyAction()`

### Database fields
- `public.userProgress.completedChecks`

### What it determines
- `Current Step` and `Next Step` come from the 7-step boolean resolver.

### Evidence
- The page builds `journeyAction` from completion flags and passes it straight into `BeginnerJourneyView`.

## 6) Activation Mission Logic

### Route
- Dashboard activation block via `DashboardV4`

### Component
- `src/modules/activation/components/ActivationDashboard.tsx`

### Hook
- `useActivation()`

### Service
- `activation-service.ts`

### Database fields
- Indirectly `public.userProgress.completedChecks` through `useMissionState()`

### What it determines
- `Day Mission`, activation day, score, and activation tier.

### Evidence
- `useActivation()` reuses `getNextJourneyAction()` and converts it into a 7-day activation view.

## 7) Roadmap Mission Logic

### Route
- Dashboard roadmap block

### Component
- `src/modules/growth-roadmap/components/RoadmapProgressSummary.tsx`

### Hook
- `useGrowthRoadmap()`

### Service
- `growth-roadmap-service.ts`

### Database fields
- `public.userProgress.completedChecks`
- quick stats from `/api/v1/team/summary`

### What it determines
- `Current Roadmap Step`, `Next Step`, and visible roadmap section.

### Evidence
- Roadmap logic derives from `getUserLevel()` plus roadmap step boundaries, not from the same 7-step journey resolver.

## 8) AI Coach Logic

### Route
- Dashboard AI coach panel and legacy mission coach surfaces

### Components
- `DashboardV4`, `MissionCoachHero`, `MissionCard`, `AiRecommendationPanel`

### Hook / Service chain
- Dashboard: `useDashboardMission()` -> `getCurrentMission()` -> `getAICoachAdvice()`
- Legacy surfaces: `useMissionCurrent()` -> `missionEngineService.getCurrentMission()`

### Database fields
- New dashboard path: `public.userProgress.completedChecks`
- Legacy path: `public.userProgress.completedChecks`, `currentStageId`

### What it determines
- `Recommended Action` and coaching text.

### Evidence
- `AiRecommendationPanel` is rule-based over `completedChecks`.
- `MissionCoachHero` and `MissionCard` are tied to the legacy `/api/mission/current`.

## 9) Conflict Analysis

### Can two systems suggest different actions?
**Yes.**

### Why
- `Journey` uses a 7-step boolean resolver.
- `Activation` reuses the same resolver but maps it into a 7-day program.
- `Growth Roadmap` uses `getUserLevel()` and its own 15-step roadmap boundary logic.
- `AI Coach` can be driven by legacy mission-engine stage IDs or rule-based recommendation logic.
- `DashboardV4` mixes new mission state with legacy mission-engine mission IDs in one screen.

### Concrete conflict path
1. `JourneyPage` computes `journeyAction` from `useMissionState() + getNextJourneyAction()`.
2. `DashboardV4` shows `nextAction` from the same resolver, but its AI Coach card uses `mission.title` from `missionEngineService.getCurrentMission()`.
3. `RoadmapProgressSummary` renders from `getGrowthRoadmapState()` and can expose later steps once `getUserLevel()` advances.
4. `AiRecommendationPanel` uses `useMissionCurrent()` from `/api/mission/current`, a separate mission engine.

### Example user scenario
- A user can be far enough in `public.userProgress` for `getNextJourneyAction()` to suggest the next journey step.
- The dashboard AI Coach can still show a different mission label because it is using legacy `missionEngineService.getCurrentMission()`.
- The roadmap can already show `Operator` or `Leader` steps if `getUserLevel()` has crossed those thresholds.

## 10) Production Truth

| What it controls | Database table / field | Service | Hook | Call chain |
|---|---|---|---|---|
| Current Mission | `public.userProgress.completedChecks`, `currentStageId`, `mode` | `missionService.getState()` | `useMissionState()` | `/api/v1/mission/state` -> dashboard/journey/activation/roadmap |
| Next Step / Next Action | same as above | `getNextJourneyAction()` | `useDashboardMission()`, `JourneyPage`, `useActivation()` | mission state -> journey resolver -> UI |
| Roadmap Step | same + quick stats + `getUserLevel()` | `getGrowthRoadmapState()` | `useGrowthRoadmap()` | mission state -> user level -> roadmap |
| Recommended Action | legacy `public.userProgress.completedChecks`, `currentStageId` | `missionEngineService.getCurrentMission()` + `getAICoachAdvice()` | `useDashboardMission()`, `useMissionCurrent()` | `/api/mission/current` -> AI coach surfaces |

### Production conclusion
- The persisted truth is `public.userProgress`.
- The displayed truth is not one system; it is a composite of new mission service, journey resolver, roadmap service, activation service, and legacy mission engine.

## 11) Mission Consistency Audit

| Surface | Result | Reason |
|---|---|---|
| Dashboard | **PARTIAL** | `nextAction` comes from `getNextJourneyAction()`, but AI Coach / current mission come from legacy `missionEngineService` |
| Journey | **PASS** | Uses `useMissionState()` + `getNextJourneyAction()` consistently |
| Activation | **PARTIAL** | Uses mission state, but repackages it into a separate 7-day activation model |
| Roadmap | **PARTIAL** | Uses mission state, but adds `getUserLevel()` and separate roadmap boundaries |
| AI Coach | **FAIL** | There are at least two coach models: legacy mission-engine coach and dashboard coach logic; they do not share one single projection |

## 12) Single Source Of Truth Recommendation

| System | Recommendation | Reason |
|---|---|---|
| `public.userProgress` | **KEEP** | This is the only persisted progression record inspected here |
| `missionService` | **KEEP** | Should be the one canonical mission reader/writer |
| `getNextJourneyAction()` | **MERGE** | Keep as a pure projection from canonical mission state |
| `getUserLevel()` / unlock-service | **MERGE** | Keep as derived projection, not a separate authority |
| `activation-service` | **MERGE** | View layer over canonical mission progress |
| `growth-roadmap-service` | **MERGE** | View layer over canonical mission progress |
| `missionEngineService` / `/api/mission/*` | **REMOVE** or fully migrate | Legacy parallel mission authority currently duplicates the truth |
| `AiRecommendationPanel` / legacy mission coach components | **MERGE** | They should read the same canonical projection, not a separate engine |

### Final recommendation
Use this architecture:

```text
public.userProgress
↓
missionService
↓
missionProjection
↓
Dashboard
Journey
Activation
Roadmap
AI Coach
```

## 13) Future Architecture Recommendation

### Current architecture
- Multiple readers:
  - `missionService`
  - `missionEngineService`
  - `getNextJourneyAction`
  - `getUserLevel`
  - `activation-service`
  - `growth-roadmap-service`
  - `ai-coach-service`
- Multiple UI surfaces derive “next action” independently.

### Target architecture
- One canonical progress record: `public.userProgress`
- One mission service: `missionService`
- One derived projection layer: `missionProjection`
- All UI surfaces consume the same projection:
  - Dashboard
  - Journey
  - Activation
  - Roadmap
  - AI Coach

## Final Answers

### Question 1
**E. Multiple conflicting systems**

Evidence:
- `DashboardV4` mixes `getNextJourneyAction()` with legacy `missionEngineService.getCurrentMission()`.
- `JourneyPage` uses `getNextJourneyAction()` only.
- `ActivationDashboard` repackages the same journey state into a 7-day activation layer.
- `GrowthRoadmap` uses `getUserLevel()` and its own step map.
- `AI Coach` has both legacy and dashboard-based logic.

### Question 2
**Yes.**

Real examples:
- Dashboard’s “Today’s Mission” comes from `getNextJourneyAction()`, while its AI Coach card comes from `missionEngineService.getCurrentMission()`.
- Roadmap uses `getGrowthRoadmapState()` and can show a later step than the journey resolver.
- Legacy coach components (`MissionCoachHero`, `AiRecommendationPanel`) read `/api/mission/current` and can disagree with the dashboard’s new mission view.

### Question 3
**`public.userProgress` should become the Single Source Of Truth.**

| File | Function | Database table | Reason |
|---|---|---|---|
| `src/modules/mission/services/mission-service.ts` | `missionService.getState`, `completeCheck` | `public.userProgress` | It is the only persisted progression record and already powers the new mission state |
