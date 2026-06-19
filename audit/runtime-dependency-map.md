# Runtime Dependency Map

Status: A1 Dead Code Audit companion map
Scope: dependency evidence only; no runtime changes
Date: 2026-06-18

## Summary

The post-V7 codebase has isolated dead UI candidates, but the main legacy authority chains are still reachable. The safest interpretation is:

- UI dead code exists and can be cleaned in a bounded task.
- Legacy BrandProfile, Mission Engine, Journey selector, Analytics, and Agent Runtime fallback chains are still live.
- Dashboard still composes multiple authorities through `useDashboardMission`.

## Brand Profile And Interview Authority

### Runtime chain

```text
Brand Builder UI
  -> /api/v1/brand-builder/profile
  -> user.metadata.brand_profile read/write
  -> Brand DNA / Interview Authority / Brand Intelligence fallback adapters
```

### Active readers and writers

- `src/app/api/v1/brand-builder/profile/route.ts`
  - Reads `meta.brand_profile`.
  - Writes merged `brand_profile` back into `metadata`.
- `src/app/api/v1/brand-builder/guide-progress/route.ts`
  - Reads and patches profile state inside `metadata.brand_profile`.
- `src/app/api/v1/brand-builder/bio/generate/route.ts`
- `src/app/api/v1/brand-builder/bio/regenerate/route.ts`
- `src/app/api/v1/brand-builder/username/generate/route.ts`
- `src/app/api/v1/brand-builder/username/regenerate/route.ts`
  - Use `metadata.brand_profile` as generation fallback.
- `src/modules/interview-authority/adapters/InterviewAuthorityAssembler.ts`
- `src/modules/interview-authority/adapters/BrandInterviewAdapter.ts`
- `src/modules/interview-authority/adapters/LegacyProfileAdapter.ts`
- `src/modules/brand-builder/adapters/InterviewAuthorityBrandProfileViewModel.ts`
  - Map legacy metadata into V7-style authority/view-model records.
- `src/modules/brand-dna/services/BrandContextProvider.ts`
- `src/modules/brand-dna/services/brandDnaService.ts`
- `src/modules/brand-intelligence/projections/brand-health-projection.ts`
  - Keep compatibility fallback for older users.

### Retirement state

Not safe. This chain has write-path usage and fallback responsibility.

## Mission And Journey

### Runtime chain

```text
/api/mission/*
  -> missionEngineService
  -> missionStages

/api/v1/mission/* and Journey adapters
  -> mission-service / Journey adapters
  -> Dashboard and Journey screens

DashboardV4 / Content / Lead / CRM-engine surfaces
  -> useDashboardMission
  -> getNextJourneyAction + mission-service
```

### Active dependencies

- `src/app/api/mission/current/route.ts`
- `src/app/api/mission/complete/route.ts`
- `src/app/api/mission/mode/route.ts`
  - Active unversioned mission API users of `missionEngineService`.
- `src/modules/journey/adapters/JourneyMissionAdapter.ts`
  - Uses `mission-engine/services/mission-service`.
- `src/modules/journey/adapters/JourneyNextActionAdapter.ts`
  - Uses `getNextJourneyAction`.
- `src/app/(auth)/journey/page.tsx`
- `src/modules/activation/hooks/useActivation.ts`
- `src/modules/dashboard/hooks/useDashboardMission.ts`
  - Active consumers of `getNextJourneyAction`.
- `src/modules/dashboard/components/DashboardV4.tsx`
- `src/modules/content-engine/components/ContentCommandCenter.tsx`
- `src/modules/lead-engine/components/LeadDashboard.tsx`
- `src/modules/crm-engine/components/CRMDashboard.tsx`
- `src/modules/content-engine/components/ContentDashboard.tsx`
  - Consumers of `useDashboardMission`; the last two are dead-code candidates themselves.

### Retirement state

Not safe. The old selector and mission services remain runtime dependencies.

## Content Engine

### Runtime chain

```text
/content-engine
  -> ContentEngineDashboard
  -> ContentCommandCenter

/api/v1/content-engine/*
  -> contentEngineService
  -> contentGenerators
```

### Active dependencies

- `src/app/(auth)/content-engine/page.tsx`
  - Imports `ContentEngineDashboard` and `ContentCommandCenter`.
- `src/app/api/v1/content-engine/route.ts`
- `src/app/api/v1/content-engine/generate/route.ts`
- `src/app/api/v1/content-engine/calendar/route.ts`
  - Import `contentEngineService`.
- `src/modules/ai/agents/content-director.ts`
  - Dynamically imports `contentEngineService`.

### Orphaned content UI

- `src/modules/content-engine/components/ContentDashboard.tsx`
  - No consumers found.
  - Safe cleanup candidate.

### Retirement state

Content engine service is active. Only `ContentDashboard.tsx` is a cleanup candidate.

## CRM Surfaces

### Runtime chain

```text
/crm-center
  -> src/modules/crm/components/CRMDashboard.tsx
```

### Active dependency

- `src/app/(auth)/crm-center/page.tsx` imports `src/modules/crm/components/CRMDashboard.tsx`.

### Orphaned CRM UI

- `src/modules/crm-engine/components/CRMDashboard.tsx`
  - No route or module imports found.
  - Safe cleanup candidate.

### Retirement state

Active CRM module remains. `crm-engine` dashboard component is a cleanup candidate.

## Dashboard Recommendation Displays

### Active authorities

- `src/app/api/v1/ai/coach/recommend/route.ts`
- `src/modules/business-intelligence/ceoAdvisorEngine.ts`
- `src/modules/ai-coo/adapters/CEORecommendationAdapter.ts`
- `src/modules/ai-coo/adapters/COOPlanAssembler.ts`
- `src/modules/brand-intelligence/projections/brand-advisor-projection.ts`
- `src/modules/growth-loop/adapters/*SignalAdapter.ts`

### Orphaned display components

- `src/modules/dashboard/components/AICoachCard.tsx`
- `src/modules/dashboard/components/AiRecommendationPanel.tsx`

### Retirement state

Recommendation authorities are active. The two old dashboard display components are safe cleanup candidates.

## Business State

### Runtime chain

```text
/api/v1/traffic-engine
/api/v1/social-setup
/api/v1/funnel/funnels/[id]/health
JourneyStateAssembler
  -> BusinessStateService
  -> BusinessStateAssembler
  -> adapters for mission, funnel, social, traffic, CEO advisor
```

### Active dependencies

- `src/app/api/v1/traffic-engine/route.ts`
- `src/app/api/v1/social-setup/route.ts`
- `src/app/api/v1/funnel/funnels/[id]/health/route.ts`
- `src/modules/journey/adapters/JourneyStateAssembler.ts`
- `src/modules/business-state/services/BusinessStateService.ts`

### Retirement state

Not safe. This is active V7 authority infrastructure, not dead code.

## Growth Loop And Analytics

### Runtime chain

```text
/api/v1/analytics/member
  -> GrowthLoopStateService
  -> GrowthLoopAssembler
  -> MemberAnalyticsViewModelAdapter
  -> legacy analyticsService fallback/composition

/api/v1/analytics/leader
/api/v1/analytics/operator
  -> analytics/services/analytics-service

/api/v1/analytics-center
  -> analytics/analyticsService
```

### Active dependencies

- `src/app/api/v1/analytics/member/route.ts`
- `src/modules/growth-loop/services/GrowthLoopStateService.ts`
- `src/modules/growth-loop/adapters/GrowthLoopAssembler.ts`
- `src/modules/growth-loop/view-models/MemberAnalyticsViewModelAdapter.ts`
- `src/app/api/v1/analytics/leader/route.ts`
- `src/app/api/v1/analytics/operator/route.ts`
- `src/app/api/v1/analytics-center/route.ts`

### Retirement state

Not safe. Growth Loop is active, and analytics legacy services remain active API dependencies.

## Agent Runtime

### Runtime chain

```text
/api/v1/ai-workforce
  -> RuntimeStateService
  -> RuntimeStateAssembler
  -> agentManager + agentMemoryService
  -> WorkforceViewModelAdapter

/api/v1/ai-workforce/execute
  -> agentManager + agentMemoryService
```

### Active dependencies

- `src/app/api/v1/ai-workforce/route.ts`
- `src/modules/agent-runtime/services/RuntimeStateService.ts`
- `src/modules/agent-runtime/adapters/RuntimeStateAssembler.ts`
- `src/modules/agent-runtime/view-models/WorkforceViewModelAdapter.ts`
- `src/app/api/v1/ai-workforce/execute/route.ts`
- `src/modules/ai/services/agent-manager.ts`
- `src/modules/ai/services/agent-memory.ts`

### Unused adapter exports

- `adaptDirectAgentRuntimeAssignment`
- `adaptExplicitGoalRuntimeAssignment`
- `adaptRuntimeExecution`
- `adaptLifecycleFromAgentReport`
- `adaptMultiAgentReport`

### Retirement state

Do not retire the runtime bridge. Only unused helper exports should be considered for bounded cleanup.

## Safe Cleanup Boundary

The bounded cleanup task should be limited to:

- Orphaned UI components with no imports:
  - `src/modules/content-engine/components/ContentDashboard.tsx`
  - `src/modules/crm-engine/components/CRMDashboard.tsx`
  - `src/modules/dashboard/components/AICoachCard.tsx`
  - `src/modules/dashboard/components/AiRecommendationPanel.tsx`
- Unused adapter exports, not full files:
  - `RuntimeAssignmentAdapter.ts` unused exports only
  - `RuntimeExecutionAdapter.ts` if no planned execution projection exists
  - `RuntimeLifecycleAdapter.ts` unused export only
  - `RuntimeResultAdapter.ts` unused export only

Everything else in this map is still connected to runtime routes, dashboard hooks, compatibility fallbacks, or write paths.

## Final Decision

NOT READY FOR CLEANUP
