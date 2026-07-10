# Journey Consumer Summary

Status: P3-003 consumer audit
Authority: Journey
Runtime changes: none

## Final Gate

READY FOR BOUNDED CUTOVER

This only approves planning for a narrow read-only route candidate. It does not approve Journey page, Dashboard, Activation, AI, RevenueProgress, Growth Loop, missionService, missionEngineService, write paths, or legacy retirement.

## Bounded Candidate

Eligible for P3-004 bounded cutover planning:

- `src/app/api/v1/team/journey-progress/route.ts`

Why:

- It is a read-only route.
- It reads member `userProgress` directly.
- It computes progress percent and current stage label only.
- It does not choose next action.
- It does not write mission progress.
- It is not Dashboard, AI, Activation, or Growth Loop.

## Not Eligible

- Journey page
- `getNextJourneyAction`
- `useDashboardMission`
- `DashboardV4`
- Activation
- Mission write/init routes
- Legacy mission engine
- RevenueProgress while embedded in Dashboard
- AI Coach
- Growth Loop
- Evolution projection

## Current Runtime Winners

| Surface | Current winner |
| --- | --- |
| Journey page | `useMissionState` plus local `getNextJourneyAction` mapping |
| Dashboard | `useDashboardMission` mixed selector |
| Activation | `useActivation` mixed selector |
| Revenue progress | `useRevenueJourney` plus `revenue-journey-service` |
| Mission state | `missionService` |
| Legacy mission UI | `missionEngineService` |
| Evolution | `missionService` plus `deriveLevel` |
| AI Coach recommendation route | Local Prisma metric recommendation chain |

## Key Findings

- Journey next action is duplicated in Journey page, Dashboard, and Activation through repeated completed-check / percentage-threshold mapping.
- `/api/v1/mission/state` and `/api/v1/mission/journey` look like read routes, but they call `missionService.getProgress()` and can initialize `userProgress`, so they are not safe bounded candidates.
- Revenue Progress is conceptually Journey-owned, but current hook/service own milestone calculation locally and the display is embedded in Dashboard.
- Evolution projection duplicates Journey progression into level/unlock state and remains blocked.
- `JourneyStateService` has no runtime consumers outside its own service file, so P3-002 has not caused a consumer migration.

## Verification

Boundary check:

```bash
grep -RIn "JourneyStateService\|journeyStateService\|getJourneyState" src --exclude-dir=node_modules --exclude-dir=.next
```

Result:

- Only `src/modules/journey/services/JourneyStateService.ts` references `JourneyStateService` / `journeyStateService` / `getJourneyState`.

## Exit Gate

Eligible for:

- `P3-004_BOUNDED_JOURNEY_CUTOVER_PLAN`

Not eligible for:

- Dashboard cutover
- Journey page cutover
- Activation cutover
- AI Coach cutover
- Growth Loop cutover
- Mission write path migration
- `missionEngineService` retirement
