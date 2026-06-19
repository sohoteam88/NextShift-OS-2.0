# Journey Authority Source Inventory

Scope: current runtime sources that answer Journey Authority questions about progression, milestones, missions, and next actions.

| File Path | Source Name | Authority Role | Read Path | Write Path | Active Status | Migration Risk |
| --- | --- | --- | --- | --- | --- | --- |
| `src/modules/mission/constants/journey-map.ts` | `JOURNEY_MAP` + `getNextStage()` + `getProgressPercent()` | Progression, Milestone | `missionService`, `/api/v1/mission/state`, `/api/v1/mission/journey`, `/api/v1/team/journey-progress`, `useMissionState()`, `EvolutionAdapter` | none direct; read-only constants/helpers | Active | High |
| `src/modules/mission/services/mission-service.ts` | `missionService` | Progression, Milestone | `/api/v1/mission/state`, `/api/v1/mission/journey`, `/api/v1/mission/mode`, `/api/v1/mission/complete-check`, `useMissionState()`, `useActivation()`, `/journey`, `useDashboardMission()`, `EvolutionAdapter` | writes `prisma.userProgress` via `getProgress()`, `completeCheck()`, `setMode()`, `skipStage()` | Active | High |
| `src/modules/mission/utils/complete-mission.ts` | `notifyMissionProgress()` | Milestone, Progression | Video and other feature services that mark journey completion side effects | delegates writes to `missionService.completeCheck()` | Active | Medium |
| `src/modules/mission-engine/missionStages.ts` | `ALL_STAGES` + legacy stage helpers | Mission, Progression, Milestone | `missionEngineService`, legacy dashboard components, `MissionCard`, `JourneyProgress`, `MissionCoachHero`, `QuickLaunchGrid`, `AiRecommendationPanel` | none direct; read-only constants/helpers | Legacy | High |
| `src/modules/mission-engine/missionEngineService.ts` | `missionEngineService` | Mission, Progression, Milestone | `/api/mission/current`, `/api/mission/complete`, `/api/mission/mode`, `MissionCard`, legacy mission widgets | writes `prisma.userProgress`, mission records, achievement records via `completeCurrentMission()`, `switchMissionMode()`, `unlockNextMission()` | Legacy | High |
| `src/modules/mission-engine/services/mission-service.ts` | `getCurrentMission()` | Mission | `useDashboardMission()` -> `DashboardV4`, `ContentCommandCenter`, `LeadDashboard`, `CRMDashboard` | none | Active | High |
| `src/modules/journey/utils/getNextJourneyAction.ts` | `getNextJourneyAction()` | Next Action, Progression proxy | `/journey`, `useActivation()`, `useDashboardMission()` | none | Active | High |
| `src/modules/activation/services/activation-service.ts` | `DAY_MISSIONS` + `getActivationDay()` + `getCurrentDayMission()` + `getActivationScore()` + `getActivationLevel()` | Mission, Progression, Milestone proxy | `useActivation()`, `ActivationDashboard`, dashboard activation surfaces | none | Active | Medium |
| `src/modules/activation/hooks/useActivation.ts` | `useActivation()` | Mission, Progression, Next Action | `ActivationDashboard`, `DashboardV4` | none; derived from mission state + activation helpers | Active | High |
| `src/modules/dashboard/hooks/useDashboardMission.ts` | `useDashboardMission()` | Mission, Next Action, Progression proxy | `DashboardV4`, `ContentCommandCenter`, `ContentDashboard`, `LeadDashboard`, `CRMDashboard` | none; derived from mission state + journey action + current mission helper | Active | High |
| `src/modules/ai-coach/ai-coach-service.ts` | `getAICoachAdvice()` / `getNextBestAction()` | Mission advice, Next Action copy | `useDashboardMission()` AI coach payload, dashboard AI coach surfaces | none | Active | Medium |
| `src/app/api/v1/team/journey-progress/route.ts` | Team journey progress projection | Progression, Milestone | `TeamJourneyProgress` and team/admin reporting surfaces | none direct; derived from `userProgress` using `journey-map` helpers | Active | Medium |
| `src/modules/revenue-activation/services/revenue-journey-service.ts` | `REVENUE_MILESTONES` + revenue journey helpers | Milestone, Progression | `useRevenueJourney()`, `RevenueProgress` | none | Unknown | Medium |

## Mapping To `JourneyState`

| Source | `progression` | `milestones` | `mission` | `nextAction` | Should Join Journey Authority | Retirement Candidate |
| --- | --- | --- | --- | --- | --- | --- |
| `journey-map.ts` | Yes | Yes | No | Partial | Yes | No |
| `missionService` | Yes | Yes | Partial | No | Yes | No |
| `notifyMissionProgress()` | Partial | Yes | No | No | Adapter only | No |
| `missionStages.ts` | Yes | Yes | Yes | Partial | No | Yes |
| `missionEngineService` | Yes | Yes | Yes | Partial | No | Yes |
| `mission-engine/services/mission-service.ts` | No | No | Yes | Partial | Adapter only | Partial |
| `getNextJourneyAction()` | Partial | No | No | Yes | Yes | Partial |
| `activation-service.ts` | Yes | Partial | Yes | Partial | Adapter only | Partial |
| `useActivation()` | Yes | Partial | Yes | Yes | Adapter only | Partial |
| `useDashboardMission()` | Partial | No | Yes | Yes | Adapter only | Partial |
| `ai-coach-service.ts` | No | No | Partial | Partial | No | Partial |
| `team/journey-progress` route | Yes | Partial | No | No | Consumer projection only | No |
| `revenue-journey-service.ts` | Yes | Yes | No | Partial | Unresolved | Unresolved |

## Notes

- `mission` in this audit means “the current structured unit of work shown to the user,” not every business recommendation in the repo.
- `milestone proxy` is used where a source exposes discrete steps or success events that behave like journey milestones without being the canonical mission milestone set.
- `progression proxy` is used where a source infers sequence or maturity from a wrapper layer rather than owning canonical progression persistence.
