# AUTH-004 Projection Driven Analytics

Date: 2026-06-19

## Objective

Make Analytics a projection consumer. Analytics owns facts only; canonical authorities own business conclusions.

Expected chain:

Business State -> Journey State -> Growth Loop -> Analytics

## Output Classification

Facts owned by Analytics:

- Lead count
- Conversion count
- Content count
- Revenue
- Funnel views/conversions
- AI usage events
- Activity/session-style event aggregates
- Content platform breakdown

Conclusions moved to projections:

- Readiness: Business State
- Progress: Journey State
- Growth: Growth Loop
- Next action: Journey State
- Member score: Growth Loop
- Health/insights/benchmark: projection-derived compatibility fields

## Changes

- Added `src/modules/analytics/adapters/AnalyticsProjectionAdapter.ts`.
  - Consumes `businessStateService.getBusinessState(userId)`.
  - Consumes `journeyStateService.getJourneyState(userId)`.
  - Consumes `growthLoopStateService.getGrowthLoopState(userId)`.
  - Exposes readiness, progress, growth, and nextAction.
  - Maps projections into legacy `AnalyticsCenter` compatibility fields.

- Updated `src/modules/analytics/analyticsService.ts`.
  - Removed local health score, insights, next actions, and benchmark calculations.
  - Keeps KPI/count/funnel/content facts.
  - Applies projection output to Analytics Center response.

- Updated `src/modules/analytics/analyticsEngines.ts`.
  - Removed local business conclusion functions.
  - Retained anomaly detection only.

- Updated `src/modules/analytics/services/analytics-service.ts`.
  - Member score now comes from Growth Loop `overallScore`.
  - Analytics no longer owns member scoring formula.

- Updated `src/modules/analytics/components/IntelligenceDashboard.tsx`.
  - Displays `Facts`.
  - Displays `Readiness · Business State`.
  - Displays `Progress · Journey State`.
  - Displays `Growth · Growth Loop`.

- Updated `src/modules/analytics/businessTypes.ts`.
  - Renamed legacy `nextActions` response field to `actions`, leaving `nextAction` terminology only in the projection adapter.

- Updated `src/modules/ai/agents/ceo-advisor.ts`.
  - Reads `AnalyticsCenter.actions` after the analytics response cleanup.

- Added analytics telemetry:
  - `src/modules/analytics/telemetry/analytics-telemetry.ts`
  - Event: `analytics.projection_consumed`
  - Properties:
    - `businessStateVersion`
    - `journeyVersion`
    - `growthLoopVersion`

- Updated observability catalog:
  - `src/lib/observability/event-catalog.ts`

- Added test coverage:
  - `src/__tests__/services/analytics-projection-adapter.test.ts`

## Verification Results

- `grep -RIn "healthScore\|growthScore\|nextAction" src/modules/analytics`
  - Only `src/modules/analytics/adapters/AnalyticsProjectionAdapter.ts` remains.
- `grep -RIn "calculateHealthScore\|generateInsights\|generateNextActions\|getBenchmark" src/modules/analytics src/app src/__tests__`
  - No output.
- `pnpm exec vitest run src/__tests__/services/analytics-projection-adapter.test.ts src/lib/observability/__tests__/event-envelope.test.ts`
  - Passed.
- `pnpm type-check`
  - Passed.

## Result

Analytics now owns facts and consumes canonical projections for business conclusions. Business State owns readiness, Journey State owns progress and next action, and Growth Loop owns growth/member score.
