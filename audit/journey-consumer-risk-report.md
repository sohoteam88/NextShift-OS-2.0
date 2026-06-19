# Journey Consumer Risk Report

Status: P3-003 consumer audit
Authority: Journey
Runtime changes: none

## Risk Model

Low risk consumers are read-only, bounded, non-dashboard, non-AI, non-activation, non-write-path consumers that do not choose next action.

Medium risk consumers display Journey or revenue progress and depend on current response shapes, but do not write progress or choose a local winner.

High risk consumers choose next action, write mission progress, drive dashboard behavior, reinterpret activation, generate AI recommendations, depend on the legacy mission chain, or mix Journey with other authorities locally.

## High Risk Consumers

### Journey page and next-action resolver

Files:

- `src/app/(auth)/journey/page.tsx`
- `src/modules/journey/utils/getNextJourneyAction.ts`

Risk: High

Reason:

- Journey page computes completed flags from `completedChecks` and `progressPercent`.
- `getNextJourneyAction()` owns local tactical next-action selection today.
- P3-003 explicitly blocks changing the resolver or migrating the page.

### Dashboard chain

Files:

- `src/modules/dashboard/hooks/useDashboardMission.ts`
- `src/modules/dashboard/components/DashboardV4.tsx`
- `src/modules/dashboard/components/TodaysActionCard.tsx`
- `src/modules/dashboard/components/AICoachCard.tsx`
- `src/modules/dashboard/components/QuickLaunchGrid.tsx`

Risk: High

Reason:

- Dashboard chooses current mission, next action, progress display, AI coach text, and activation fallback behavior.
- `useDashboardMission()` mixes mission state, evolution projection, `getNextJourneyAction()`, mission-engine `getCurrentMission()`, and team stats.
- `QuickLaunchGrid` gates tools using completed checks and mission stage definitions.

### Mission write/init chain

Files:

- `src/modules/mission/services/mission-service.ts`
- `src/app/api/v1/mission/state/route.ts`
- `src/app/api/v1/mission/journey/route.ts`
- `src/app/api/v1/mission/complete-check/route.ts`
- `src/app/api/v1/mission/mode/route.ts`
- `src/modules/mission/hooks/use-mission.ts`
- `src/modules/mission/components/ModeToggle.tsx`
- `src/app/(auth)/brand-discovery/page.tsx`

Risk: High

Reason:

- `missionService.getProgress()` creates `userProgress` when missing.
- Read routes `/api/v1/mission/state` and `/api/v1/mission/journey` call `getProgress()` and are therefore not pure read-only candidates.
- Completion and mode routes write progress.

### Legacy mission engine chain

Files:

- `src/modules/mission-engine/missionEngineService.ts`
- `src/app/api/mission/current/route.ts`
- `src/app/api/mission/complete/route.ts`
- `src/app/api/mission/mode/route.ts`
- `src/modules/mission-engine/components/MissionCard.tsx`
- `src/modules/mission-engine/missionStages.ts`

Risk: High

Reason:

- Legacy chain owns current mission, mode switching, completion, achievements, and progress creation.
- Retirement is explicitly blocked in P3-003.

### Activation chain

Files:

- `src/modules/activation/hooks/useActivation.ts`
- `src/modules/activation/components/ActivationDashboard.tsx`
- `src/modules/activation/services/activation-service.ts`

Risk: High

Reason:

- Activation reinterprets Journey progression into activation day, score, level, and day mission.
- It uses `getNextJourneyAction()` and local day mission constants.
- Activation migration is explicitly blocked.

### Revenue Journey chain

Files:

- `src/modules/revenue-activation/hooks/useRevenueJourney.ts`
- `src/modules/revenue-activation/components/RevenueProgress.tsx`
- `src/modules/revenue-activation/services/revenue-journey-service.ts`

Risk: High for hook/service, Medium for display component

Reason:

- Hook and service compute revenue score, next milestone, completion, and progress percent locally.
- `RevenueProgress` is mostly display-only, but is embedded in `DashboardV4`, so it is blocked for early cutover.

### AI tactical recommendation chain

Files:

- `src/app/api/v1/ai/coach/recommend/route.ts`
- `src/modules/ai-coach/ai-coach-service.ts`
- dashboard AI coach card

Risk: High

Reason:

- AI coach route generates independent tactical-like recommendations from CRM/content/funnel metrics.
- AI coach service generates mission-aware next-best-action text.
- AI migration is explicitly blocked.

### Growth / Evolution chain

Files:

- `src/modules/evolution/adapters/evolution-adapter.ts`
- `src/modules/evolution/hooks/use-evolution-projection.ts`
- `src/modules/growth-roadmap/services/roadmap-service.ts`

Risk: High

Reason:

- Evolution adapter uses `missionService.getState()` and `getJourneyMap()`, which can initialize progress.
- Evolution hook duplicates Journey progression into level/unlock projection.
- Growth Loop and evolution projection are blocked.

## Medium Risk Consumers

| Consumer | Reason |
| --- | --- |
| `BeginnerJourneyView` | Display-only view, but fed by Journey page local next-action resolver. |
| Content / Lead / CRM dashboards using `useDashboardMission` | Indirect mission/next-action displays; inherited dashboard dependency blocks early cutover. |
| `RevenueProgress` component | Display-only, but embedded in `DashboardV4`; cannot be cut over independently yet. |
| `missionStages.ts` definitions | Static source map, not a runtime consumer, but legacy mission chain depends on it. |

## Low Risk Consumers

| Consumer | Reason |
| --- | --- |
| `src/app/api/v1/team/journey-progress/route.ts` | Direct Prisma read of member `userProgress`; computes stage label and progress only; no writes; no next action; no dashboard import. |
| `src/app/(auth)/settings/page.tsx` | Incidental read-only `useMissionState` consumer, but not useful as a first bounded cutover target. |

## Blocked Consumers

These must remain blocked:

- `DashboardV4`
- `useDashboardMission`
- `getNextJourneyAction` implementation
- `missionService` write/init paths
- `missionEngineService` retirement
- `ActivationDashboard`
- AI Coach
- CEO Advisor
- Growth Loop
- Evolution projection
- RevenueProgress while it remains embedded in DashboardV4

## Early Cutover Candidates

Approved candidate for P3-004 planning:

1. `src/app/api/v1/team/journey-progress/route.ts`

Candidate rules:

- Read-only route.
- Directly bounded to team member journey progress display.
- Does not choose next action.
- Does not write `userProgress`.
- Does not depend on dashboard, AI, activation, or legacy mission write path.

Rejected possible candidates:

- `/api/v1/mission/state`: rejected because `missionService.getState()` can initialize progress.
- `/api/v1/mission/journey`: rejected because `missionService.getJourneyMap()` can initialize progress.
- Journey page: rejected because it chooses next action locally.
- RevenueProgress: rejected because it is embedded in Dashboard and the hook owns revenue milestone calculation.
- MissionCard: rejected because it includes legacy write paths.

## Risk Conclusion

The repo is not ready for broad Journey cutover. It is ready for a narrow bounded plan targeting only the team journey progress read route.
