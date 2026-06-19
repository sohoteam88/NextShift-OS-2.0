# Authority Consumer Scorecard

Date: 2026-06-19

Scoring:

- PASS: Consumes expected authority and does not re-enter owned fields.
- WARN: Does not re-enter fields, but still derives or owns logic that belongs to a canonical authority.
- FAIL: Asks the user again for authority-owned fields or bypasses canonical authority in the primary workflow.

## Summary Score

| Module | Score | Reason |
| --- | --- | --- |
| Content Engine | PASS | Consumes BrandContext and Brand DNA content pillars. |
| Lead Magnet | PASS | Consumes BrandContext and only asks for lead magnet type. |
| Funnel Builder | FAIL | Canonical path passes, but legacy `/ai/funnel-builder` still asks for offer, pain, audience, transformation, and goal. |
| AI COO | WARN | Consumes Journey State, but still imports locally generated CEO Advisor business health and opportunities. |
| AI Workforce | FAIL | Runtime can consume COO assignments, but UI and execute route still prioritize manual goal input. |
| Analytics | WARN | Does not ask the user again, but locally calculates health, progress, next actions, growth, and scores. |
| Dashboard | WARN | Mostly consumer-only, but local mission and journey derivation remains in `useDashboardMission`. |

Overall result: WARN with two P0 failures.

## Authority Consumption Matrix

| Module | Interview Authority | Brand DNA | Business State | Journey State | Runtime Assignment | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Content Engine | Indirect through BrandContext | Yes | No | No | No | Correct for this module. |
| Lead Magnet | Indirect through BrandContext | Yes | No | No | No | Correct after refactor. |
| Funnel Builder | Indirect through BrandContext | Canonical yes, legacy no | No | No | No | Legacy surface is the blocker. |
| AI COO | No direct read | Indirect through CEO Advisor | Local calculation, not canonical | Yes | Produces assignments | Needs Business State projection. |
| AI Workforce | No | No | Indirect through COO | Indirect through COO | Yes, but not primary UI | Manual goal remains primary path. |
| Analytics | No | Partial via BrandContext in analytics center | Local calculation | No canonical read found | No | Should consume projections for state. |
| Dashboard | No direct read | No direct read | Indirect via hooks only | Partial/local derivation | No | Should be display-only. |

## Module Details

### Content Engine

Score: PASS

Evidence:

- `src/modules/content-engine/contentEngineService.ts`
- Uses `getBrandContext(userId)`.
- `getPillars()` reads `ctx.contentPillars` / `ctx.profile.contentPillars`.
- Generation inputs are tactical: platform, format, funnel stage, and optional pillar name.

Decision:

No remediation required for Authority First.

### Lead Magnet

Score: PASS

Evidence:

- `src/modules/lead-magnet/leadMagnetService.ts`
- `src/app/api/v1/lead-magnet/generate/route.ts`
- `src/modules/lead-magnet/components/LeadMagnetDashboard.tsx`

Decision:

No remediation required for Authority First.

### Funnel Builder

Score: FAIL

Passing evidence:

- `src/modules/funnel/services/funnel-builder-service.ts`
- `src/modules/funnel/components/FunnelBuilderDashboard.tsx`

Failing evidence:

- `src/app/(auth)/ai/funnel-builder/page.tsx`

Decision:

Blocker until legacy `/ai/funnel-builder` is retired, redirected, or converted to BrandContext-prefilled authority consumption.

### AI COO

Score: WARN

Passing evidence:

- `src/modules/ai-coo/adapters/COOPlanAssembler.ts`
- `journeyStateService.getJourneyState(userId)`
- `journeyState.nextAction.title`

Drift evidence:

- `src/modules/ai-coo/adapters/CEORecommendationAdapter.ts`
- `src/modules/business-intelligence/ceoAdvisorEngine.ts`

Decision:

AI COO should keep Journey State consumption and replace CEO Advisor local business logic with canonical Business State / Growth Loop projections.

### AI Workforce

Score: FAIL

Passing evidence:

- `src/modules/agent-runtime/adapters/RuntimeStateAssembler.ts`
- `cooPlanService.getCOOPlan(user.id)`
- `cooPlan.assignments.map(adaptCOOAssignmentRuntimeAssignment)`

Failing evidence:

- `src/modules/ai/components/WorkforceDashboard.tsx`
- `src/app/api/v1/ai-workforce/execute/route.ts`

Decision:

Primary execution should be assignment-based. Free-form goal execution should become an advanced override with provenance.

### Analytics

Score: WARN

Evidence:

- `src/modules/analytics/analyticsService.ts`
- `src/modules/analytics/analyticsEngines.ts`
- `src/modules/analytics/services/analytics-service.ts`

Decision:

Analytics can own raw metrics aggregation, but should not own business state, health, next action, journey progress, or growth-loop conclusions.

### Dashboard

Score: WARN

Evidence:

- `src/modules/dashboard/components/DashboardV4.tsx`
- `src/modules/dashboard/hooks/useDashboardMission.ts`

Decision:

Dashboard should become a pure projection consumer. Local CTA text and layout mapping is acceptable; local mission and journey progression derivation should be removed.

## Go / No-Go

No-go for full Authority First compliance until:

- Legacy `/ai/funnel-builder` no longer asks for Brand DNA-owned fields.
- AI Workforce can run from Runtime Assignment without asking for a manual goal.

Go for continued incremental migration:

- Content Engine
- Lead Magnet
- Canonical Funnel Builder
- Journey-backed AI COO plan assembly
