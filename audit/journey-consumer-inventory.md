# Journey Consumer Inventory

Status: P3-003 consumer audit
Authority: Journey
Runtime changes: none

## Inventory

| File Path | Consumer Name | Consumer Type | Reads Progression | Reads Milestones | Reads Missions | Reads Next Action | Reads Revenue Progress | Current Source | Direct / Indirect | Writes Progress | Chooses Local Winner | Migration Risk | Early Cutover Candidate | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `src/app/(auth)/journey/page.tsx` | Journey page | Journey | Yes | No | No | Yes | No | `useMissionState`, `getNextJourneyAction`, local percentage thresholds | Direct | No | Yes | High | No | Computes next action from `completedChecks` and `progressPercent`; blocked for early cutover. |
| `src/modules/journey/components/BeginnerJourneyView.tsx` | Beginner Journey view | Journey | Yes | No | No | Yes | No | Parent-provided `JourneyNextAction` from legacy utility | Indirect | No | No | Medium | No | Read-only display, but fed by high-risk Journey page selector. |
| `src/modules/journey/utils/getNextJourneyAction.ts` | `getNextJourneyAction()` | Journey | Yes | No | No | Yes | No | Local stage array and boolean inputs | Direct | No | Yes | High | No | Canonical tactical selector candidate later; implementation is explicitly blocked. |
| `src/modules/mission/hooks/use-mission.ts` | `useMissionState()` | Mission | Yes | Yes | No | No | No | `/api/v1/mission/state` | Indirect | No | No | Medium | No | Read hook, but backing route can initialize `userProgress`. |
| `src/modules/mission/hooks/use-mission.ts` | `useJourneyMap()` | Mission | Yes | Yes | No | No | No | `/api/v1/mission/journey` | Indirect | No | No | Medium | No | Read hook, but backing route can initialize `userProgress`. |
| `src/modules/mission/hooks/use-mission.ts` | `useCompleteCheck()` | Mission | Yes | Yes | No | No | No | `/api/v1/mission/complete-check` | Direct | Yes | No | High | No | Mission write path; explicitly blocked. |
| `src/modules/mission/hooks/use-mission.ts` | `useSetMode()` | Mission | Yes | No | No | No | No | `/api/v1/mission/mode` | Direct | Yes | No | High | No | Mission mode write path; explicitly blocked. |
| `src/app/api/v1/mission/state/route.ts` | Mission state route | Mission | Yes | Yes | No | No | No | `missionService.getState` | Direct | Yes | No | High | No | `missionService.getState()` calls `getProgress()`, which creates `userProgress` when missing. |
| `src/app/api/v1/mission/journey/route.ts` | Mission journey route | Mission | Yes | Yes | No | No | No | `missionService.getJourneyMap` | Direct | Yes | No | High | No | `getJourneyMap()` calls `getProgress()`, which may initialize progress. |
| `src/app/api/v1/mission/complete-check/route.ts` | Mission complete-check route | Mission | Yes | Yes | No | No | No | `missionService.completeCheck` | Direct | Yes | No | High | No | Writes completed checks and can unlock achievements. |
| `src/app/api/v1/mission/mode/route.ts` | Mission mode route | Mission | Yes | No | No | No | No | `missionService.setMode` | Direct | Yes | No | High | No | Writes mode and `lastActivityAt`. |
| `src/app/api/mission/current/route.ts` | Legacy mission current route | Mission | Yes | Yes | Yes | No | No | `missionEngineService.getCurrentMission`, `getMissionProgress`, `getAchievements` | Direct | Yes | Yes | High | No | Legacy chain can create progress through mission engine. Retirement blocked. |
| `src/app/api/mission/complete/route.ts` | Legacy mission complete route | Mission | Yes | Yes | Yes | No | No | `missionEngineService.completeCurrentMission` | Direct | Yes | Yes | High | No | Legacy mission write path. |
| `src/app/api/mission/mode/route.ts` | Legacy mission mode route | Mission | Yes | No | No | No | No | `missionEngineService.switchMissionMode` | Direct | Yes | No | High | No | Legacy mode write path. |
| `src/modules/mission-engine/components/MissionCard.tsx` | Legacy MissionCard | Mission | Yes | Yes | Yes | No | No | `/api/mission/current`, `/api/mission/complete`, `/api/mission/mode` | Indirect | Yes | Yes | High | No | UI includes complete and mode mutation hooks. |
| `src/modules/mission-engine/missionEngineService.ts` | Legacy mission engine service | Mission | Yes | Yes | Yes | No | No | `userProgress`, `missionStages` | Direct | Yes | Yes | High | No | Owns legacy progress creation, completion, mode switching, achievements. |
| `src/modules/mission-engine/missionStages.ts` | Mission stage definitions | Mission | Yes | Yes | Yes | No | No | Static stage map | Direct | No | No | Medium | No | Definition source for legacy mission chain. Not a consumer cutover target. |
| `src/modules/dashboard/hooks/useDashboardMission.ts` | `useDashboardMission()` | Dashboard | Yes | No | Yes | Yes | No | `useMissionState`, `getNextJourneyAction`, `getCurrentMission`, `useEvolutionProjection` | Direct | No | Yes | High | No | Dashboard-local winner selector for current mission, next action, and progress. Blocked. |
| `src/modules/dashboard/components/DashboardV4.tsx` | `DashboardV4` | Dashboard | Yes | No | Yes | Yes | Yes | `useDashboardMission`, `useActivation`, `useEvolutionProjection`, `RevenueProgress` | Indirect | No | Yes | High | No | Primary dashboard behavior; blocked. |
| `src/modules/dashboard/components/TodaysActionCard.tsx` | Today's action card | Dashboard | No | No | Yes | Yes | No | Dashboard mission payload | Indirect | No | No | High | No | Dashboard mission surface; blocked with Dashboard. |
| `src/modules/dashboard/components/AICoachCard.tsx` | AI Coach card | Dashboard / AI | No | No | Yes | Yes | No | Dashboard mission / AI coach text | Indirect | No | Yes | High | No | Dashboard AI guidance; blocked. |
| `src/modules/dashboard/components/QuickLaunchGrid.tsx` | Quick launch grid | Dashboard | Yes | Yes | No | No | No | `/api/v1/mission/state`, `missionStages` unlock checks | Direct | No | Yes | High | No | Locally gates tools using completed checks. |
| `src/modules/content-engine/components/ContentCommandCenter.tsx` | Content command center | Dashboard | No | No | Yes | Yes | No | `useDashboardMission` | Indirect | No | No | Medium | No | Inherits dashboard mission output; not bounded. |
| `src/modules/content-engine/components/ContentDashboard.tsx` | Content dashboard | Dashboard | No | No | Yes | Yes | No | `useDashboardMission` | Indirect | No | No | Medium | No | Legacy content mission display. |
| `src/modules/lead-engine/components/LeadDashboard.tsx` | Lead dashboard | Dashboard | No | No | Yes | Yes | No | `useDashboardMission` | Indirect | No | No | Medium | No | Inherits dashboard mission output. |
| `src/modules/crm-engine/components/CRMDashboard.tsx` | CRM dashboard | Dashboard | No | No | Yes | Yes | No | `useDashboardMission` | Indirect | No | No | Medium | No | Inherits dashboard mission output. |
| `src/modules/activation/hooks/useActivation.ts` | `useActivation()` | Activation | Yes | No | Yes | Yes | No | `useMissionState`, `getNextJourneyAction`, `activation-service` | Direct | No | Yes | High | No | Reinterprets Journey progression into activation day/score/mission. |
| `src/modules/activation/components/ActivationDashboard.tsx` | ActivationDashboard | Activation | Yes | No | Yes | Yes | No | `useActivation` | Indirect | No | Yes | High | No | Activation workflow surface; blocked. |
| `src/modules/activation/services/activation-service.ts` | Activation service constants | Activation | Yes | No | Yes | No | No | Local day mission map | Direct | No | Yes | High | No | Defines activation day missions separate from Journey authority. |
| `src/modules/revenue-activation/hooks/useRevenueJourney.ts` | `useRevenueJourney()` | Revenue | Yes | No | No | No | Yes | `useMissionState`, `revenue-journey-service`, completed checks | Direct | No | Yes | High | No | Computes revenue score, next milestone, completion locally. |
| `src/modules/revenue-activation/components/RevenueProgress.tsx` | RevenueProgress | Revenue | No | No | No | No | Yes | `useRevenueJourney`, `REVENUE_MILESTONES` | Indirect | No | No | Medium | No | Display-only component but currently embedded in DashboardV4, so blocked for early cutover. |
| `src/modules/revenue-activation/services/revenue-journey-service.ts` | Revenue journey service | Revenue | No | No | No | No | Yes | `REVENUE_MILESTONES`, local score functions | Direct | No | Yes | High | No | Owns revenue milestone calculation today; Journey adapter treats it as input. |
| `src/app/api/v1/ai/coach/recommend/route.ts` | AI coach recommendation route | AI | No | No | No | Yes | No | Prisma metrics and local recommendation chain | Direct | No | Yes | High | No | Generates independent tactical-like recommendations; blocked. |
| `src/modules/ai-coach/ai-coach-service.ts` | AI coach service | AI | No | No | Yes | Yes | No | Local advice by mission id | Direct | No | Yes | High | No | Generates mission-aware advice and next best action text. |
| `src/modules/dashboard/components/AICoachCard.tsx` | AI coach dashboard card | AI / Dashboard | No | No | Yes | Yes | No | Dashboard mission / AI coach message | Indirect | No | Yes | High | No | AI dashboard guidance; blocked. |
| `src/modules/evolution/adapters/evolution-adapter.ts` | Evolution adapter | Growth | Yes | Yes | Yes | No | No | `missionService.getState`, `missionService.getJourneyMap`, `deriveLevel` | Direct | Yes | Yes | High | No | Calls mission read APIs that can initialize progress; duplicates progression into evolution snapshot. |
| `src/modules/evolution/hooks/use-evolution-projection.ts` | `useEvolutionProjection()` | Growth | Yes | Yes | No | No | No | `useMissionState`, local `deriveLevel`, projection fallback | Direct | No | Yes | High | No | Duplicates journey progression into level/unlock projection; blocked. |
| `src/modules/growth-roadmap/services/roadmap-service.ts` | Growth roadmap service | Growth | Yes | Yes | No | Yes | No | Growth roadmap state and recommendations | Direct | No | Yes | High | No | Growth Loop is explicitly blocked. |
| `src/app/api/v1/team/journey-progress/route.ts` | Team journey progress route | Journey / Team | Yes | No | No | No | No | Direct Prisma `userProgress`, `getProgressPercent`, `getStageById` | Direct | No | No | Low | Yes | Read-only bounded route; no next-action, no writes, no dashboard import. |
| `src/components/layouts/Sidebar.tsx` | Sidebar member nav state | Mission | Yes | No | No | No | No | `useMissionState`, `useSetMode`, `useEvolutionProjection` | Indirect | Yes | Yes | High | No | Reads member mission state and can switch mode. |
| `src/modules/mission/components/ModeToggle.tsx` | ModeToggle | Mission | Yes | No | No | No | No | `useSetMode` | Direct | Yes | No | High | No | Mission mode write path. |
| `src/app/(auth)/brand-discovery/page.tsx` | Brand discovery mission completion | Mission | No | No | No | No | No | `useCompleteCheck` | Direct | Yes | No | High | No | Auto-completes `brand_discovery_completed`; write path. |
| `src/app/(auth)/settings/page.tsx` | Settings member status | Mission | Yes | No | No | No | No | `useMissionState` | Indirect | No | No | Low | No | Read-only incidental consumer, but not a useful bounded Journey cutover target. |
| `src/modules/member/services/approval-service.ts` | Member approval progress seed | Mission | Yes | No | No | No | No | `prisma.userProgress.upsert` | Direct | Yes | No | High | No | Seeds progress on approval; write path. |

## Notes

- `nextAction` entries outside Journey, such as funnel, lead-magnet, WhatsApp, and analytics next actions, were not classified as Journey authority unless they consume or duplicate Journey progression.
- `JourneyStateService` has no runtime consumers outside its own service file at this audit point.
