# AUTH-005 Dashboard As Projection Layer

## Scope

Converted the member Dashboard surface from local mission/journey inference into a projection consumer.

## Changes

- Added `DashboardProjectionAdapter` as the Dashboard authority boundary.
- Added `/api/v1/dashboard/projection` to serve the Dashboard projection for the authenticated user.
- Replaced `useDashboardMission()` internals with projection fetch logic.
- Kept a projection-derived `mission` compatibility shape for older content/lead/crm consumers.
- Rebuilt `DashboardV4` so it renders:
  - Business State readiness.
  - Journey State current mission, next action, and progress.
  - AI COO top recommendation.
  - Growth Loop growth score.
  - Projection version metadata.
- Added `dashboard.projection_consumed` telemetry with:
  - `businessStateVersion`
  - `journeyVersion`
  - `cooPlanVersion`
  - `growthLoopVersion`

## Removed Dashboard Drift

The Dashboard no longer imports or calls:

- `getCurrentMission`
- `getNextJourneyAction`
- `resolveJourneyCompletion`
- `getAICoachAdvice`
- `useEvolutionProjection`
- `useMissionState`

Business decisions now come from Business State, Journey State, AI COO, Growth Loop, and Analytics projection inputs.

## Boundary Note

The active `/dashboard` route renders `DashboardV4`, which now consumes `DashboardProjectionAdapter` through `useDashboardMission()`.

Some legacy Dashboard component files still exist in `src/modules/dashboard/components/` and reference older mission-engine APIs, but they are not imported by the active Dashboard route. They should be retired or migrated in a separate dead-code cleanup if the project wants the entire directory to be legacy-free.

## Verification

Commands:

```bash
grep -RIn "getNextJourneyAction\|getCurrentMission" src/modules/dashboard
pnpm exec vitest run src/__tests__/services/dashboard-projection-adapter.test.ts src/lib/observability/__tests__/event-envelope.test.ts
pnpm type-check
git diff --check
```

Expected grep result: no Dashboard consumer usage outside the projection boundary.
