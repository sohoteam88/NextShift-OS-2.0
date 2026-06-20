# COO-001 Business State Engine PRD

Version: V8
Status: P0 Critical
Owner: AI COO System

## Mission

Determine the user's actual business state before AI COO mission decisions run.

Business State is based on capability completion, not activity volume. The lowest incomplete capability wins.

## State Order

1. BRAND_FOUNDATION
2. BRAND_POSITIONING
3. CONTENT_SYSTEM
4. LEAD_MAGNET
5. FUNNEL
6. LEAD_GENERATION
7. SALES
8. TEAM_BUILDING

## Output Contract

The engine resolves:

- currentState
- completedStates
- missingRequirements
- nextState
- readinessScore
- explainability

Readiness score is internal and must not be shown on the dashboard UI.

## Integration Rule

Mission Engine consumes resolved Business State before exposing stage and bottleneck to AI COO/dashboard projections.

Dashboard does not calculate state. It only receives resolved state fields from Business State Engine.

## Error Handling

No data returns BRAND_FOUNDATION with a reason that the business profile is incomplete. The system never returns unknown, null, or undefined as the primary state.
