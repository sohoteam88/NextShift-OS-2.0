# Journey Read Reduction Report

Status: P3-005 bounded cutover implementation
Authority: Journey

## Scope

Only this read-only route was cut over:

- `GET /api/v1/team/journey-progress`

## Before

| Route | Direct progression source |
| --- | --- |
| `GET /api/v1/team/journey-progress` | Direct Prisma `userProgress.currentStageId`, `userProgress.completedChecks`, `getProgressPercent`, `getStageById` |

Direct route-level stage/progress reads before: 2 fields plus 2 local derivation helpers.

## After

| Route | Journey read | View model adapter |
| --- | --- | --- |
| `GET /api/v1/team/journey-progress` | `journeyStateService.getJourneyState(member.id)` | `toJourneyProgressViewModel` |

Direct route-level stage/progress reads after: 0.
JourneyState route-level reads after: 1 per returned member.

## Preserved Route Responsibilities

The route still owns:

- authorization
- team member filtering
- member id/name lookup
- member `lastActivityAt` lookup for `daysSinceLastActivity`

The route no longer owns:

- progress percent derivation from `completedChecks`
- current stage lookup through `getStageById`
- direct route-level completed-check interpretation

## Preserved Boundaries

- Journey page was not modified.
- Dashboard was not modified.
- Activation was not modified.
- AI Coach was not modified.
- RevenueProgress was not modified.
- Growth Loop was not modified.
- `missionService` was not modified.
- `missionEngineService` was not modified.
- Write paths were not modified.

## Response Compatibility

The route still returns:

```ts
{
  data: Array<{
    userId: string;
    name: string;
    progressPercent: number;
    currentStageId: string | null;
    currentStageName: string;
    daysSinceLastActivity: number | null;
    stalled: boolean;
  }>;
}
```
