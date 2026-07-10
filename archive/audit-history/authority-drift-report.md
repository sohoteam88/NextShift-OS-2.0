# Authority Drift Report

Date: 2026-06-19

## Executive Summary

The system is partially compliant with the Authority First rule.

Strong paths:

- Content Engine consumes Brand DNA.
- Lead Magnet consumes Interview Authority / Brand DNA through BrandContext.
- Canonical Funnel Builder consumes Brand DNA.
- New AI COO plan assembly consumes Journey State.
- Agent Runtime can consume COO assignments.

Drift paths:

- Legacy AI Funnel Builder still asks users for authority-owned business inputs.
- AI Workforce still centers manual goal input instead of runtime assignments.
- AI COO still imports locally generated business intelligence recommendations.
- Analytics locally recalculates business health, growth, progress, and next actions.
- Dashboard is mostly consumer-only but still has local journey/mission derivation.

## P0 Drift

### P0-1: Legacy AI Funnel Builder Re-enters Brand DNA Fields

Status: FAIL

Files:

- `src/app/(auth)/ai/funnel-builder/page.tsx`
- `src/modules/funnel/services/funnel-builder-service.ts`
- `src/modules/funnel/components/FunnelBuilderDashboard.tsx`

Problem:

The canonical Funnel Builder path is authority-first, but `/ai/funnel-builder` still asks for:

- Business type
- Product/service
- Target audience
- Customer pain point
- Desired result
- Funnel goal

These fields overlap directly with Brand DNA ownership: positioning, offer, audience, message, pain, promise, and transformation.

Impact:

- Users can enter conflicting funnel data after Brand DNA is already completed.
- Funnel output can diverge from canonical brand positioning.
- The product has two Funnel Builder authorities: canonical `modules/funnel` and legacy `/ai/funnel-builder`.

Required remediation:

1. Retire or redirect `/ai/funnel-builder` to the canonical Funnel Builder.
2. If the route must remain, prefill from BrandContext and hide manual authority fields behind an explicit "override" mode.
3. Prevent writes from legacy route unless it records Brand DNA provenance.

### P0-2: AI Workforce Manual Goal Bypasses Runtime Assignments

Status: FAIL

Files:

- `src/modules/ai/components/WorkforceDashboard.tsx`
- `src/app/api/v1/ai-workforce/execute/route.ts`
- `src/modules/agent-runtime/adapters/RuntimeStateAssembler.ts`

Problem:

RuntimeStateAssembler correctly consumes COO plan assignments:

- `cooPlanService.getCOOPlan(user.id)`
- `cooPlan.assignments.map(adaptCOOAssignmentRuntimeAssignment)`

But the user-facing Workforce dashboard still starts with a manual goal input:

- Default goal: `我想要更多客户`
- Execution call: `exec.mutate({ goal, multi: true })`

The execute route gives this manual goal priority:

- `if (body.goal && body.multi) orchestrateForGoal(...)`

Impact:

- AI Workforce can ignore COO assignment authority.
- Users are asked to repeat goal/priority context already owned by Journey State and AI COO.
- Runtime execution provenance becomes ambiguous: user-entered goal vs canonical assignment.

Required remediation:

1. Make pending Runtime Assignments the primary execution surface.
2. Change manual goal to an advanced override with provenance.
3. Update `/api/v1/ai-workforce/execute` to accept `assignmentId` and resolve the objective from RuntimeState before accepting free-form goals.

## P1 Drift

### P1-1: AI COO Imports Locally Generated Business State

Status: WARN

Files:

- `src/modules/ai-coo/adapters/COOPlanAssembler.ts`
- `src/modules/ai-coo/adapters/CEORecommendationAdapter.ts`
- `src/modules/business-intelligence/ceoAdvisorEngine.ts`

Problem:

`COOPlanAssembler` consumes Journey State correctly, but also calls:

- `adaptCEORecommendations(user.id, user.tenantId)`
- `ceoAdvisorEngine.generateCEOReport(userId, tenantId)`

`ceoAdvisorEngine` locally calculates:

- Business health
- Bottlenecks
- Growth opportunities
- Next best actions
- Forecast
- Risks
- Agent recommendations

These are Business State / Growth Loop concerns.

Impact:

- AI COO may have two sources of truth: Journey State and locally derived CEO Advisor state.
- Business bottlenecks and opportunities can drift from canonical Business State.
- Recommendations can contradict Journey State or Growth Loop projections.

Required remediation:

1. Introduce a Business State projection adapter for health, bottlenecks, readiness, opportunities, and priority.
2. Make `CEORecommendationAdapter` consume Business State rather than `ceoAdvisorEngine` raw calculations.
3. Keep `ceoAdvisorEngine` only as a temporary fallback with explicit fallback metadata.

### P1-2: Analytics Recalculates Progress and Growth Locally

Status: WARN

Files:

- `src/modules/analytics/analyticsService.ts`
- `src/modules/analytics/analyticsEngines.ts`
- `src/modules/analytics/services/analytics-service.ts`

Problem:

Analytics locally derives:

- Health score
- Insights
- Next actions
- Anomalies
- Benchmark
- Conversion funnel
- Stage distribution
- Team/member score
- Growth trend

The expected chain is Journey State + Business State + Growth Loop -> Analytics.

Impact:

- Analytics can become a silent business authority.
- Dashboard/AI COO/Analytics can display different stage, health, readiness, and progress.
- Growth score and next action can drift from the Journey State mission.

Required remediation:

1. Split Analytics into metrics aggregation and authority projection consumption.
2. Keep raw facts in Analytics: counts, trends, events, attribution.
3. Source health/readiness/progress/next action from Business State, Journey State, and Growth Loop projections.

## P2 Drift

### P2-1: Dashboard Still Performs Local Mission/Journey Derivation

Status: WARN

Files:

- `src/modules/dashboard/components/DashboardV4.tsx`
- `src/modules/dashboard/hooks/useDashboardMission.ts`

Problem:

Dashboard consumes several hooks, but `useDashboardMission` still resolves:

- Journey completion
- Next journey action
- Current mission
- AI coach advice

These should be projection-consumer results, not dashboard-owned derivations.

Impact:

- Lower risk than P0/P1 because Dashboard does not ask the user again.
- Still creates a local interpretation layer that can drift from Journey State.

Required remediation:

1. Replace local `getNextJourneyAction`, `getCurrentMission`, and `getAICoachAdvice` composition with canonical Journey State / Mission projection output.
2. Keep Dashboard responsible for display and navigation only.

## Pass Paths

### Content Engine

Status: PASS

Files:

- `src/modules/content-engine/contentEngineService.ts`

Reason:

Content Engine consumes `getBrandContext(userId)` and uses BrandContext content pillars before generated defaults. It does not ask the user to re-enter audience, positioning, content pillars, or goals.

### Lead Magnet

Status: PASS

Files:

- `src/modules/lead-magnet/leadMagnetService.ts`
- `src/app/api/v1/lead-magnet/generate/route.ts`
- `src/modules/lead-magnet/components/LeadMagnetDashboard.tsx`

Reason:

Lead Magnet now consumes BrandContext and only asks for resource type. It creates the resource and landing page from the canonical authority chain.

### Canonical Funnel Builder

Status: PASS

Files:

- `src/modules/funnel/services/funnel-builder-service.ts`
- `src/modules/funnel/components/FunnelBuilderDashboard.tsx`

Reason:

The canonical funnel path consumes BrandContext and only asks for funnel type. The fail is isolated to the legacy `/ai/funnel-builder` surface.

## Recommended Execution Order

1. P0-1: Retire or redirect legacy `/ai/funnel-builder`.
2. P0-2: Make Runtime Assignments the primary AI Workforce execution entry.
3. P1-1: Move AI COO business-health inputs to Business State projection.
4. P1-2: Convert Analytics to metrics-only plus projection consumption.
5. P2-1: Replace Dashboard mission derivation with canonical projection output.
