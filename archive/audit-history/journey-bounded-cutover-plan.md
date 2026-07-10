# Journey Bounded Cutover Plan

Status: P3-004 consumer cutover planning
Authority: Journey
Work type: planning only
Runtime changes: none

## Objective

Define the first bounded Journey consumer migration without changing runtime behavior in P3-004.

## Approved Candidate

Only approved target:

- `GET /api/v1/team/journey-progress`
- File: `src/app/api/v1/team/journey-progress/route.ts`

## Cutover Decision

Proceed to P3-005 with a bounded read-only route cutover plan.

This does not approve any Journey page, Dashboard, Activation, AI, RevenueProgress, Growth Loop, missionService, or missionEngineService migration.

## Explicitly Blocked

- Journey Page
- `getNextJourneyAction`
- DashboardV4
- `useDashboardMission`
- Activation
- AI Coach
- RevenueProgress
- Growth Loop
- `missionService`
- `missionEngineService`
- Mission write paths
- Legacy mission retirement

## Target Flow

Current:

```text
userProgress
  -> route
  -> response
```

Target:

```text
JourneyStateService
  -> JourneyState
  -> JourneyProgressViewModel
  -> route
  -> same response
```

## Current Response Contract

The route currently returns:

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

P3-005 must preserve this response shape.

## P3-005 Implementation Boundary

P3-005 may add:

- `src/modules/journey/view-models/JourneyProgressViewModelAdapter.ts`
- route-level wiring in `src/app/api/v1/team/journey-progress/route.ts`
- focused response compatibility tests if local route testing is practical
- a read-reduction report

P3-005 may import `JourneyStateService` only in:

- `src/app/api/v1/team/journey-progress/route.ts`
- `src/modules/journey/**`
- tests for the approved route or view model

P3-005 must not import `JourneyStateService` into:

- Journey page
- Dashboard
- Activation
- AI Coach
- RevenueProgress
- Growth Loop
- `missionService`
- `missionEngineService`
- mission write routes
- legacy mission routes

## ViewModel Rules

`JourneyProgressViewModelAdapter` must:

- accept `JourneyState`
- return the same row shape used by the current team journey progress route
- avoid next-action ownership
- avoid mission progress writes
- avoid dashboard logic
- avoid activation logic
- avoid AI recommendation logic
- keep fallback handling explicit

The adapter may map:

- `JourneyState.stage` to `currentStageId`
- `JourneyState.stage` to a user-facing `currentStageName`
- `JourneyState.milestones` to `progressPercent`

The adapter must not:

- compute tactical next action
- call `getNextJourneyAction`
- mutate `userProgress`
- initialize mission progress
- call `missionService.getState`
- call `missionService.getJourneyMap`
- call `missionEngineService`

## Route Rules

The route may continue to read team member identity and `lastActivityAt` from Prisma.

The route must use `JourneyStateService` for per-member journey progression data.

Allowed remaining direct Prisma reads:

- member id
- member name
- member last activity data needed for `daysSinceLastActivity`
- team membership filters and authorization

Disallowed direct route reads after P3-005:

- `getProgressPercent`
- `getStageById`
- direct route-level stage/progress derivation from `completedChecks`

## Compatibility Checks

P3-005 must verify:

- route still returns `data`
- every row still has `userId`
- every row still has `name`
- every row still has `progressPercent`
- every row still has `currentStageId`
- every row still has `currentStageName`
- every row still has `daysSinceLastActivity`
- every row still has `stalled`
- route remains read-only

## Required Verification

Run:

```bash
pnpm type-check
grep -RIn "JourneyStateService\|journeyStateService\|getJourneyState" src --exclude-dir=node_modules --exclude-dir=.next
```

Expected import boundary after P3-005:

- `src/modules/journey/**`
- `src/app/api/v1/team/journey-progress/route.ts`
- approved tests only

## Rollback Plan

If route compatibility fails:

1. Revert only `src/app/api/v1/team/journey-progress/route.ts`.
2. Keep unused view-model adapter only if it type-checks and has no runtime imports.
3. Restore current direct `userProgress` mapping.
4. Do not touch Journey page, Dashboard, Activation, AI, RevenueProgress, Growth Loop, missionService, or missionEngineService.

## Success Criteria

- Read-only route.
- No next-action ownership.
- No writes.
- No dashboard dependency.
- No activation dependency.
- No AI dependency.
- Response compatibility preserved.
- Import boundary preserved.

## Exit Gate

Eligible for:

- `P3-005_BOUNDED_JOURNEY_CUTOVER_IMPLEMENTATION`

Not eligible for:

- Journey page cutover
- Dashboard cutover
- Activation cutover
- AI Coach cutover
- RevenueProgress cutover
- Growth Loop cutover
- missionService migration
- missionEngineService retirement
