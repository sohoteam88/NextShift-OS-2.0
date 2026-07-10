# AUTH-003 Business State First COO

Date: 2026-06-19

## Objective

Make Business State the primary business intelligence authority for AI COO.

Expected chain:

Business State -> Journey State -> AI COO -> Runtime

## Previous Drift

AI COO consumed Journey State, but strategic business recommendations still came from `ceoAdvisorEngine.generateCEOReport()`.

That meant AI COO had two business authorities:

- Business State
- CEO Advisor local calculations

## Changes

- Added `src/modules/ai-coo/adapters/BusinessStateProjectionAdapter.ts`.
  - Source: `businessStateService.getBusinessState(userId)`.
  - Exposes health, readiness, bottlenecks, opportunities, and businessStage.
  - Maps Business State bottlenecks/opportunities into COO recommendations.

- Updated `src/modules/ai-coo/adapters/CEORecommendationAdapter.ts`.
  - Primary path now uses Business State.
  - `ceoAdvisorEngine.generateCEOReport()` is fallback only.
  - Recommendation metadata now uses:
    - `source: business_state`
    - `source: fallback_ceo_advisor`

- Updated `src/modules/ai-coo/contracts/COORecommendation.ts`.
  - Added `recommendationSource`.
  - Supported values:
    - `business_state`
    - `journey_state`
    - `growth_loop`
    - `fallback`

- Updated `src/modules/ai-coo/adapters/COOPlanAssembler.ts`.
  - Journey recommendation now carries `recommendationSource: journey_state`.
  - Business State recommendations are passed to AssignmentAdapter for runtime assignment generation.

- Updated `src/modules/ai-coo/adapters/AssignmentAdapter.ts`.
  - Business opportunity assignments now prefer Business State recommendations.
  - CEO Advisor report is used only when Business State recommendation data is unavailable.

- Added COO telemetry:
  - `src/modules/ai-coo/telemetry/coo-telemetry.ts`
  - Event: `coo.recommendation_generated`
  - Properties:
    - `recommendationSource`
    - `businessStage`
    - `readiness`
    - `bottleneckCount`

- Updated observability catalog:
  - `src/lib/observability/event-catalog.ts`

- Added test coverage:
  - `src/__tests__/services/ai-coo-business-state-first.test.ts`

## Verification Results

- `pnpm exec vitest run src/__tests__/services/ai-coo-business-state-first.test.ts`
  - Passed.
- `pnpm type-check`
  - Passed.
- `grep -RIn "generateCEOReport" src/modules/ai-coo`
  - Only the fallback call in `CEORecommendationAdapter.ts` remains.

## Result

AI COO now consumes canonical Business State before CEO Advisor. CEO Advisor remains available only as a fallback when Business State is unavailable.
