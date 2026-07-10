# Authority First Inventory

Date: 2026-06-19

Source request: `/Users/stevenmacmini/Desktop/AUTHORITY_FIRST_AUDIT.md/AUTHORITY_FIRST_AUDIT.md.md`

## Rule

Authority First, User Input Second.

A module should consume the existing canonical authority before asking the user to re-enter audience, goals, positioning, stage, priorities, offer, pain, or transformation.

## Canonical Authorities

| Authority | Owns |
| --- | --- |
| Interview Authority | Profile, audience, goals, experience, business context |
| Brand DNA | Positioning, offer, message, promise, content direction |
| Business State | Stage, readiness, bottlenecks, opportunities |
| Journey State | Current stage, current mission, next action |

## Module Inventory

| Module | Expected Authority | Current Consumer Path | Manual Re-entry Found | Result |
| --- | --- | --- | --- | --- |
| Content Engine | Brand DNA -> Content Engine | `src/modules/content-engine/contentEngineService.ts` calls `getBrandContext(userId)`, derives pillars/posts/calendar from BrandContext and persisted content pillars. | No manual audience, positioning, content pillar, or goal re-entry in the generation API. | PASS |
| Lead Magnet | Interview Authority -> Brand DNA -> Lead Magnet -> Landing Page | `src/modules/lead-magnet/leadMagnetService.ts` calls `getBrandContext(userId)`, generates resource and landing page from canonical brand context. `src/app/api/v1/lead-magnet/generate/route.ts` accepts only lead magnet type. | No audience/pain/positioning manual fields after the recent refactor. | PASS |
| Funnel Builder | Brand DNA -> Funnel Builder | Canonical path `src/modules/funnel/services/funnel-builder-service.ts` calls `getBrandContext(userId)` and `generateFullFunnel(ctx, funnelType)`. UI `src/modules/funnel/components/FunnelBuilderDashboard.tsx` only selects funnel type. | Legacy route `src/app/(auth)/ai/funnel-builder/page.tsx` still asks business type, product/service, target audience, pain point, desired result, and funnel goal. | FAIL |
| AI COO | Journey State + Business State -> AI COO | New path `src/modules/ai-coo/adapters/COOPlanAssembler.ts` consumes `journeyStateService.getJourneyState(userId)` and uses Journey next action as strategic focus. | No direct user re-entry for goals/stage/priority in the COO plan path. | WARN |
| AI Workforce | AI COO Assignment -> Runtime Assignment | Runtime state path `src/modules/agent-runtime/adapters/RuntimeStateAssembler.ts` consumes `cooPlanService.getCOOPlan(user.id)` and maps COO assignments to runtime assignments. | UI `src/modules/ai/components/WorkforceDashboard.tsx` still exposes a free-form goal input and calls `/api/v1/ai-workforce/execute` with `{ goal, multi: true }`. | FAIL |
| Analytics | Journey State + Business State + Growth Loop -> Analytics | Team/member analytics aggregate events, leads, content, funnels, AI usage, and actions in `src/modules/analytics/services/analytics-service.ts`. | No user re-entry, but analytics locally recalculates score, conversion, stage distribution, member score, health, insights, and next actions instead of consuming canonical Business State/Growth Loop projections. | WARN |
| Dashboard | Authority Consumer only | `src/modules/dashboard/components/DashboardV4.tsx` consumes `useDashboardMission`, `useEvolutionProjection`, `useGrowthRoadmap`, and `useActivation`. | No major re-entry. `useDashboardMission` still resolves journey completion and current mission locally via mission/evolution adapters. | WARN |

## Detailed Notes

### Content Engine

Evidence:

- `src/modules/content-engine/contentEngineService.ts`
- `getBrandContext(userId)` is the primary context source.
- `getPillars()` uses `ctx.contentPillars` / `ctx.profile.contentPillars` before falling back to generated defaults.
- `generateCalendar()` and `generatePlatformPost()` consume BrandContext and platform/type parameters.

Assessment: Authority-first behavior is in place. The module does not ask the user again for audience, goals, positioning, or content pillars.

### Lead Magnet

Evidence:

- `src/modules/lead-magnet/leadMagnetService.ts`
- `src/app/api/v1/lead-magnet/generate/route.ts`
- `src/modules/lead-magnet/components/LeadMagnetDashboard.tsx`

Assessment: The lead magnet generation path now uses BrandContext and only asks for lead magnet type. This matches the expected authority chain.

### Funnel Builder

Evidence:

- Canonical: `src/modules/funnel/services/funnel-builder-service.ts`
- Canonical UI: `src/modules/funnel/components/FunnelBuilderDashboard.tsx`
- Drift: `src/app/(auth)/ai/funnel-builder/page.tsx`

Assessment: The canonical funnel builder is authority-first, but the legacy AI funnel builder route violates the rule by asking for data Brand DNA already owns.

### AI COO

Evidence:

- `src/modules/ai-coo/adapters/COOPlanAssembler.ts`
- `src/modules/ai-coo/adapters/CEORecommendationAdapter.ts`
- `src/modules/business-intelligence/ceoAdvisorEngine.ts`

Assessment: COOPlanAssembler consumes Journey State correctly. However, CEO recommendations still flow through `ceoAdvisorEngine.generateCEOReport`, which computes business health, bottlenecks, opportunities, actions, forecast, and risks locally. This is authority drift from the Business State contract.

### AI Workforce

Evidence:

- Runtime authority path: `src/modules/agent-runtime/adapters/RuntimeStateAssembler.ts`
- Runtime view model: `src/modules/agent-runtime/view-models/WorkforceViewModelAdapter.ts`
- Manual goal path: `src/modules/ai/components/WorkforceDashboard.tsx`
- Execute route: `src/app/api/v1/ai-workforce/execute/route.ts`

Assessment: Runtime state consumes COO assignments, but the primary UI still centers a manual goal input. The execute route prioritizes manual `body.goal && body.multi` over runtime assignment execution.

### Analytics

Evidence:

- `src/modules/analytics/analyticsService.ts`
- `src/modules/analytics/analyticsEngines.ts`
- `src/modules/analytics/services/analytics-service.ts`
- `src/app/api/v1/analytics-center/route.ts`

Assessment: Analytics does not ask the user for authority data, but it locally recalculates health score, insights, next actions, anomalies, benchmark, member score, stage distribution, and growth trends. This should become a projection consumer rather than a parallel authority.

### Dashboard

Evidence:

- `src/modules/dashboard/components/DashboardV4.tsx`
- `src/modules/dashboard/hooks/useDashboardMission.ts`

Assessment: Dashboard is mostly a consumer. Residual risk is local mission and journey completion derivation in `useDashboardMission`, which should be fully replaced by Journey State / Business State / Growth Loop projections when available.
