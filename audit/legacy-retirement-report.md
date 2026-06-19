# Legacy Retirement Report

Status: A1 Dead Code Audit
Scope: audit only; no deletion, import change, route change, or runtime change
Date: 2026-06-18

## 1. Dead Code Candidates

### `src/modules/content-engine/components/ContentDashboard.tsx`

- Reason: Superseded by `ContentEngineDashboard` and `ContentCommandCenter`. Static import search found only the component export itself.
- Current imports: none found in `src`; `/content-engine` imports `ContentEngineDashboard` and `ContentCommandCenter`.
- Runtime risk: low. No route, API, or dashboard shell imports this component.
- Delete risk: low.
- Rollback note: restore the file from git history and re-run `pnpm type-check`.

### `src/modules/crm-engine/components/CRMDashboard.tsx`

- Reason: Parallel CRM dashboard implementation is not wired. `/crm-center` imports `src/modules/crm/components/CRMDashboard.tsx`, not this file.
- Current imports: none found in `src`.
- Runtime risk: low. No route, dashboard, or CRM page imports the `crm-engine` dashboard.
- Delete risk: low.
- Rollback note: restore the file from git history if a hidden consumer is discovered.

### `src/modules/dashboard/components/AICoachCard.tsx`

- Reason: Standalone old AI coach card is no longer imported by `DashboardV4` or any route. The active recommendation API is still used elsewhere, but this display component is orphaned.
- Current imports: none found in `src`.
- Runtime risk: low. Deleting the component would not remove `/api/v1/ai/coach/recommend`.
- Delete risk: low.
- Rollback note: restore the component and re-run dashboard smoke checks.

### `src/modules/dashboard/components/AiRecommendationPanel.tsx`

- Reason: Old rule-based dashboard recommendation panel. `ts-prune` marks the export unused and static import search found no consumers.
- Current imports: none found in `src`.
- Runtime risk: low. It imports mission stages internally, but no runtime surface imports the panel.
- Delete risk: low to medium, because this is dashboard-adjacent and should be coordinated with Dashboard V3 inventory.
- Rollback note: restore the file and re-run `/dashboard` verification.

### `src/modules/agent-runtime/adapters/RuntimeExecutionAdapter.ts`

- Reason: `adaptRuntimeExecution` is exported but not imported by the current `RuntimeStateService` or `/api/v1/ai-workforce` path.
- Current imports: none found in `src`.
- Runtime risk: low, if removed as a bounded cleanup after confirming no planned execution endpoint depends on it.
- Delete risk: medium, because it is part of the V7 Agent Runtime adapter set and may be a planned boundary.
- Rollback note: restore the adapter before adding explicit execution-state projection.

### Unused exports inside `src/modules/agent-runtime/adapters/RuntimeAssignmentAdapter.ts`

- Reason: `adaptDirectAgentRuntimeAssignment` and `adaptExplicitGoalRuntimeAssignment` are unused exports. `adaptDefaultStageRuntimeAssignment` is active through `RuntimeStateAssembler`.
- Current imports: active import only for `adaptDefaultStageRuntimeAssignment`.
- Runtime risk: low for unused exports only; do not delete the file.
- Delete risk: medium, because the file contains an active adapter.
- Rollback note: restore the removed exports if direct assignment or explicit-goal runtime endpoints are introduced.

### Unused exports inside `src/modules/agent-runtime/adapters/RuntimeResultAdapter.ts`

- Reason: `adaptMultiAgentReport` is unused. `adaptAgentExecutionReport` is active through `RuntimeStateAssembler`.
- Current imports: active import only for `adaptAgentExecutionReport`.
- Runtime risk: low for unused export only; do not delete the file.
- Delete risk: medium, because the file contains an active result adapter.
- Rollback note: restore the removed export when multi-agent result projection is wired.

### Unused export inside `src/modules/agent-runtime/adapters/RuntimeLifecycleAdapter.ts`

- Reason: `adaptLifecycleFromAgentReport` is unused. `adaptRuntimeLifecycle` is used in-module by the adapter.
- Current imports: none found for `adaptLifecycleFromAgentReport`.
- Runtime risk: low for unused export only.
- Delete risk: medium, because lifecycle projection is part of the agent-runtime contract family.
- Rollback note: restore the export if lifecycle projection is connected to runtime memory.

## 2. Legacy Authority Candidates

### BrandProfile legacy reads and `metadata.brand_profile`

Active legacy paths:

- `src/app/api/v1/brand-builder/profile/route.ts` reads and writes `metadata.brand_profile`.
- `src/app/api/v1/brand-builder/guide-progress/route.ts` reads and writes fields under `metadata.brand_profile`.
- `src/app/api/v1/brand-builder/bio/generate/route.ts`, `bio/regenerate/route.ts`, `username/generate/route.ts`, and `username/regenerate/route.ts` read `metadata.brand_profile` fallback data.
- `src/app/(auth)/brand-builder/calendar/page.tsx` reads `metadata.brand_profile`.
- `src/modules/interview-authority/adapters/InterviewAuthorityAssembler.ts`, `BrandInterviewAdapter.ts`, `LegacyProfileAdapter.ts`, and `InterviewAuthorityService.ts` still treat `metadata.brand_profile` as compatibility input.
- `src/modules/brand-dna/services/BrandContextProvider.ts` and `brandDnaService.ts` keep legacy profile fallback/write behavior.
- `src/modules/brand-intelligence/projections/brand-health-projection.ts` still reads `metadata.brand_profile` as fallback.
- `src/modules/brand-builder/adapters/InterviewAuthorityBrandProfileViewModel.ts` maps legacy metadata into the newer view model.

Conclusion: not retireable. This is still a compatibility and write-path surface, not dead code.

### `missionEngineService`

Active legacy paths:

- `src/app/api/mission/current/route.ts`
- `src/app/api/mission/complete/route.ts`
- `src/app/api/mission/mode/route.ts`
- `src/__tests__/mission-engine/mission-engine.test.ts`

Conclusion: not retireable until the unversioned `/api/mission/*` surface is redirected, deprecated, or removed through a separate bounded migration.

### Old journey selectors

Active paths:

- `src/modules/journey/utils/getNextJourneyAction.ts`
- `src/app/(auth)/journey/page.tsx`
- `src/modules/activation/hooks/useActivation.ts`
- `src/modules/journey/adapters/JourneyNextActionAdapter.ts`
- `src/modules/dashboard/hooks/useDashboardMission.ts`

Conclusion: not retireable. `getNextJourneyAction` remains a compatibility selector behind active route, activation, journey, and dashboard paths.

### Old recommendation chains

Candidate dead displays:

- `src/modules/dashboard/components/AICoachCard.tsx`
- `src/modules/dashboard/components/AiRecommendationPanel.tsx`

Still-active recommendation authorities:

- `src/app/api/v1/ai/coach/recommend/route.ts`
- `src/modules/business-intelligence/ceoAdvisorEngine.ts`
- `src/modules/ai-coo/adapters/CEORecommendationAdapter.ts`
- `src/modules/ai-coo/adapters/COOPlanAssembler.ts`
- `src/modules/brand-intelligence/projections/brand-advisor-projection.ts`
- `src/modules/growth-loop/adapters/*SignalAdapter.ts`

Conclusion: only the orphaned dashboard display components are cleanup candidates. The recommendation services are active.

### Agent runtime legacy reads

Active paths:

- `src/app/api/v1/ai-workforce/route.ts` consumes `runtimeStateService` and `toWorkforceViewModel`.
- `src/modules/agent-runtime/services/RuntimeStateService.ts` consumes `RuntimeStateAssembler`.
- `src/modules/agent-runtime/adapters/RuntimeStateAssembler.ts` still reads `agentManager` and `agentMemoryService`.
- `src/app/api/v1/ai-workforce/execute/route.ts` still uses legacy `agentManager` and `agentMemoryService` directly.

Conclusion: not retireable. Some helper exports are unused, but the legacy bridge is still active.

### Analytics legacy reads

Active paths:

- `src/app/api/v1/analytics/member/route.ts` consumes both `GrowthLoopStateService` and legacy `analyticsService`.
- `src/app/api/v1/analytics/leader/route.ts` and `operator/route.ts` consume `src/modules/analytics/services/analytics-service.ts`.
- `src/app/api/v1/analytics-center/route.ts` consumes `src/modules/analytics/analyticsService.ts`.
- Analytics isolation tests still import `analyticsService`.

Conclusion: not retireable. Analytics is partially migrated, but legacy services remain active.

## 3. Duplicate Logic Candidates

### Display duplication

- `src/modules/content-engine/components/ContentDashboard.tsx` duplicates the content-engine UI surface now represented by `ContentEngineDashboard` and `ContentCommandCenter`.
- `src/modules/crm-engine/components/CRMDashboard.tsx` duplicates the active CRM dashboard at `src/modules/crm/components/CRMDashboard.tsx`.
- `src/modules/dashboard/components/AICoachCard.tsx` duplicates recommendation display responsibilities now covered by `DashboardV4`, AI coach APIs, and AI COO surfaces.
- `src/modules/dashboard/components/AiRecommendationPanel.tsx` duplicates dashboard recommendation display logic without active consumers.

### Authority duplication

- `metadata.brand_profile` duplicates newer Interview Authority and Brand Intelligence projections, but it remains a compatibility/write path.
- `missionEngineService` duplicates newer mission/journey services, but unversioned mission APIs still consume it.
- `getNextJourneyAction` duplicates newer Journey adapters, but the adapter and multiple consumers still depend on it.
- `useDashboardMission` duplicates journey/mission composition logic at the dashboard layer and is consumed by dashboard, content, lead, and CRM-engine surfaces.
- Analytics has duplicate authority between Growth Loop projection and legacy analytics services, but active routes still compose both.
- Agent Runtime has duplicate authority between V7 runtime adapters and legacy `agentManager`/`agentMemoryService`, but active routes still read the legacy services.

## 4. Safe Cleanup Candidates

These candidates satisfy the A1 safety gate based on static search: 0 runtime imports, 0 route imports, 0 dashboard imports, and 0 write-path usage.

- `src/modules/content-engine/components/ContentDashboard.tsx`
- `src/modules/crm-engine/components/CRMDashboard.tsx`
- `src/modules/dashboard/components/AICoachCard.tsx`
- `src/modules/dashboard/components/AiRecommendationPanel.tsx`

Export-level cleanup candidates that should not delete their containing files:

- `adaptDirectAgentRuntimeAssignment` in `src/modules/agent-runtime/adapters/RuntimeAssignmentAdapter.ts`
- `adaptExplicitGoalRuntimeAssignment` in `src/modules/agent-runtime/adapters/RuntimeAssignmentAdapter.ts`
- `adaptRuntimeExecution` in `src/modules/agent-runtime/adapters/RuntimeExecutionAdapter.ts`
- `adaptLifecycleFromAgentReport` in `src/modules/agent-runtime/adapters/RuntimeLifecycleAdapter.ts`
- `adaptMultiAgentReport` in `src/modules/agent-runtime/adapters/RuntimeResultAdapter.ts`

## 5. Not Safe Yet

- `src/app/api/mission/*`: active unversioned route handlers.
- `src/modules/mission-engine/missionEngineService.ts`: active route dependency.
- `src/modules/mission-engine/services/mission-service.ts`: active through Journey and Dashboard adapters.
- `src/modules/mission-engine/missionStages.ts`: active across dashboard components and tests.
- `src/modules/journey/utils/getNextJourneyAction.ts`: active selector behind Journey, Activation, Journey adapter, and Dashboard.
- `src/modules/dashboard/hooks/useDashboardMission.ts`: active through DashboardV4, ContentCommandCenter, LeadDashboard, ContentDashboard, and CRMDashboard candidates.
- `src/modules/interview-authority/adapters/LegacyProfileAdapter.ts`: active compatibility fallback for legacy brand metadata.
- `src/modules/interview-authority/adapters/BrandInterviewAdapter.ts`: active fallback from brand interview data to legacy metadata.
- `src/modules/brand-dna/services/BrandContextProvider.ts`: active legacy brand profile fallback.
- `src/modules/brand-dna/services/brandDnaService.ts`: active legacy metadata fallback and write path.
- `src/app/api/v1/brand-builder/profile/route.ts`: active `metadata.brand_profile` read/write API.
- `src/app/api/v1/brand-builder/guide-progress/route.ts`: active legacy profile update path.
- `src/modules/agent-runtime/services/RuntimeStateService.ts`: active `/api/v1/ai-workforce` dependency.
- `src/modules/agent-runtime/adapters/RuntimeStateAssembler.ts`: active bridge over legacy agent manager and memory.
- `src/modules/growth-loop/services/GrowthLoopStateService.ts`: active member analytics dependency.
- `src/modules/business-state/services/BusinessStateService.ts`: active traffic, social setup, funnel health, and journey dependency.
- `src/modules/analytics/services/analytics-service.ts`: active member, leader, and operator analytics dependency.
- `src/modules/analytics/analyticsService.ts`: active analytics-center dependency.

## Verification

- `pnpm type-check`: passed.
- `npx ts-prune`: passed after network-enabled retry; output includes many Next.js App Router false positives and the relevant unused exports/components listed above.
- `grep -RIn "metadata.brand_profile\|missionEngineService\|getNextJourneyAction\|useDashboardMission" src`: completed; active references are reflected in this report.
- `git diff --check -- audit/legacy-retirement-report.md audit/runtime-dependency-map.md`: pending after file creation.

## Final Decision

NOT READY FOR CLEANUP

Reason: small bounded cleanup candidates exist, but the broader legacy authority surfaces are still active through route handlers, dashboard hooks, compatibility fallbacks, analytics, and agent runtime bridge paths. Proceed only with a narrow cleanup task for the explicitly safe candidates.
