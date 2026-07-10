# Business State Consumer Inventory

Status: P2-003 consumer audit
Authority: Business State
Scope: current runtime consumers of stage, readiness, bottlenecks, and opportunities.
Runtime changes: none.

## Inventory

| File Path | Consumer Name | Consumer Type | Reads Stage | Reads Readiness | Reads Bottlenecks | Reads Opportunities | Current Source | Direct / Indirect | Migration Risk | Early Cutover Candidate | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `src/modules/dashboard/hooks/useDashboardMission.ts` | `useDashboardMission()` | Hook | Yes | Yes | No | Yes | `useMissionState`, `getNextJourneyAction`, `getCurrentMission`, `useEvolutionProjection` | Direct | High | No | Chooses next action and current mission from mission progress thresholds and mission-engine state. Blocked. |
| `src/modules/dashboard/components/DashboardV4.tsx` | `DashboardV4` | Dashboard | Yes | Yes | No | Yes | `useDashboardMission`, `useActivation` | Indirect | High | No | Primary dashboard behavior depends on mission, progress, activation, and next action. Blocked. |
| `src/modules/activation/hooks/useActivation.ts` | `useActivation()` | Hook | Yes | Yes | No | Yes | `useMissionState`, `getNextJourneyAction`, `activation-service` | Direct | High | No | Chooses activation day, score, level, and day mission from progress thresholds. Blocked. |
| `src/modules/activation/components/ActivationDashboard.tsx` | `ActivationDashboard` | Dashboard | Yes | Yes | No | Yes | `useActivation` | Indirect | High | No | Dashboard-like workflow surface for activation state and task. Blocked. |
| `src/app/(auth)/journey/page.tsx` | Journey page | Route | Yes | Yes | No | Yes | `useMissionState`, `getNextJourneyAction` | Direct | High | No | Infers stage/next action from completed checks plus percentage cutoffs. Blocked. |
| `src/modules/journey/utils/getNextJourneyAction.ts` | `getNextJourneyAction()` | Service | Yes | No | No | Yes | local boolean and threshold logic | Direct | High | No | Owns current journey stage and next action selection. Blocked with Journey. |
| `src/app/api/v1/mission/state/route.ts` | Mission state route | Route | Yes | Yes | No | Yes | `missionService.getState` | Direct | High | No | Route-backed mission state emits current/next stage, percent progress, and completed checks. |
| `src/app/api/v1/mission/journey/route.ts` | Mission journey route | Route | Yes | No | No | Yes | `missionService.getJourneyMap` | Direct | Medium | No | Provides stage ordering and route opportunities. Not an early cutover target. |
| `src/app/api/v1/mission/complete-check/route.ts` | Mission completion route | Route | Yes | Yes | No | Yes | `missionService.completeCheck` | Direct | Medium | No | Write path for mission completion; excluded from consumer cutover. |
| `src/app/api/v1/mission/mode/route.ts` | Mission mode route | Route | Yes | No | No | No | `missionService.setMode` | Direct | Medium | No | Write path for mode-dependent mission state; excluded. |
| `src/modules/evolution/adapters/evolution-adapter.ts` | `EvolutionAdapter` | Service | Yes | Yes | No | Yes | `missionService.getState`, `missionService.getJourneyMap` | Direct | Medium | No | Projection adapter consumes mission facts for another authority. Not a Business State consumer cutover candidate. |
| `src/app/api/v1/funnel-os/route.ts` | Funnel OS route | Route | Yes | Yes | Yes | Yes | `funnelProgressService`, `funnelHealthService`, Prisma counts | Direct | High | No | Aggregates funnel progress, activity health, bottleneck-like health, and next action. |
| `src/modules/funnel/hooks/use-funnel-os.ts` | `useFunnelOS()` | Hook | Yes | Yes | Yes | Yes | `/api/v1/funnel-os` | Indirect | Medium | No | Reads aggregate route payload; should wait until route contract is planned. |
| `src/modules/funnel/components/os/FunnelOperatingCard.tsx` | `FunnelOperatingCard` | Component | Yes | Yes | Yes | Yes | `useFunnelOS()` | Indirect | High | No | User-facing Funnel OS card displays progress, health, and action. |
| `src/components/funnel-operating-system/FunnelOperatingCard.tsx` | Legacy `FunnelOperatingCard` | Component | Yes | Yes | No | Yes | parent-provided funnel operating payload | Indirect | Medium | No | Legacy display surface; avoid cutover before funnel route plan. |
| `src/components/funnel-operating-system/FunnelOperatingCenter.tsx` | Legacy `FunnelOperatingCenter` | Component | Yes | Yes | No | Yes | funnel operating fetch chain | Indirect | Medium | No | Wrapper for legacy operating card. |
| `src/app/api/v1/funnel/funnels/[id]/health/route.ts` | Funnel health route | Route | No | Yes | Yes | Yes | `funnelHealthService.calculate` | Direct | Low | Yes | Read-only health route; bounded non-dashboard candidate if output compatibility is preserved. |
| `src/modules/funnel/components/FunnelBuilderDashboard.tsx` | `FunnelBuilderDashboard` | Dashboard | No | Yes | Yes | Yes | `funnelHealthService.evaluatePackage`, package advisor | Direct | Medium | No | Dashboard-like builder surface; not first cutover. |
| `src/modules/funnel/services/funnel-builder-service.ts` | Funnel builder service | Service | No | Yes | Yes | Yes | `funnelHealthService.evaluatePackage`, `getPackageAdvisor` | Direct | Medium | No | Service writes package advisor fields; not read-only. |
| `src/app/api/v1/social-setup/route.ts` | Social setup route | Route | No | Yes | Yes | No | `socialSetupService.getReadiness` | Direct | Low | Yes | Bounded readiness route; read path is a good candidate. PUT remains excluded. |
| `src/app/api/v1/social-setup/generate/route.ts` | Social setup generate route | Route | No | Yes | Yes | Yes | `socialSetupService.generateSetup`, `getReadiness` | Direct | Medium | No | Generate flow includes write/generation behavior; not an early read-only cutover. |
| `src/modules/social-setup/components/SocialSetupWizard.tsx` | `SocialSetupWizard` | Dashboard | No | Yes | Yes | Yes | `/api/v1/social-setup`, `/api/v1/social-setup/generate` | Indirect | High | No | Workflow UI depends on readiness, missing items, generated setup, and tips. |
| `src/app/api/v1/traffic-engine/route.ts` | Traffic engine route | Route | No | Yes | Yes | Yes | `trafficEngineService.get` | Direct | Low | Yes | Read-only persisted traffic readiness route; bounded non-dashboard candidate. |
| `src/app/api/v1/traffic-engine/generate/route.ts` | Traffic generate route | Route | No | Yes | Yes | Yes | `trafficEngineService.generate`, `notifyMissionProgress` | Direct | Medium | No | Generation and mission progress write side effect; excluded from early cutover. |
| `src/modules/traffic-engine/components/TrafficDashboard.tsx` | `TrafficDashboard` | Dashboard | No | Yes | Yes | Yes | `/api/v1/traffic-engine`, `/api/v1/traffic-engine/generate` | Indirect | High | No | Dashboard/workflow surface displays readiness, missing items, and recommendations. |
| `src/modules/ai/agents/traffic-strategist.ts` | Traffic Strategist agent | AI | No | Yes | No | Yes | `trafficEngineService.get` | Direct | Medium | No | Agent context consumer; wait for AI migration wave. |
| `src/app/api/v1/business-intel/route.ts` | Business Intel route | Route | No | Yes | Yes | Yes | `ceoAdvisorEngine.generateCEOReport` | Direct | High | No | CEO Advisor creates health, bottlenecks, opportunities, risks, and actions. AI/Advisor blocked. |
| `src/modules/business-intelligence/components/CEOAdvisorDashboard.tsx` | `CEOAdvisorDashboard` | Dashboard | No | Yes | Yes | Yes | `/api/v1/business-intel` | Indirect | High | No | Primary Business Intel UI; overlaps heavily with Business State but remains blocked. |
| `src/modules/business-intelligence/ceoAdvisorEngine.ts` | `ceoAdvisorEngine` | AI | No | Yes | Yes | Yes | Prisma counts, local scoring logic | Direct | High | No | Creates readiness and recommendations; may contribute advisory signals but cannot own factual readiness. |
| `src/modules/ai/agents/ceo-advisor.ts` | CEO Advisor agent | AI | No | Yes | Yes | Yes | CEO advisor payload | Indirect | Medium | No | AI consumer of advisor state; blocked under AI wave. |
| `src/modules/ai/agents/brand-strategist.ts` | Brand Strategist agent | AI | No | Yes | No | Yes | brand health / advisor context | Indirect | Medium | No | Uses health-like confidence context; blocked under AI wave. |
| `src/modules/content-engine/components/ContentCommandCenter.tsx` | `ContentCommandCenter` | Dashboard | Yes | No | No | Yes | `useDashboardMission` | Indirect | Medium | No | Indirect mission/opportunity consumer; wait for dashboard hook cutover. |
| `src/modules/content-engine/components/ContentDashboard.tsx` | `ContentDashboard` | Dashboard | Yes | No | No | Yes | `useDashboardMission` | Indirect | Medium | No | Legacy-ish content dashboard consumer of dashboard mission. |
| `src/modules/lead-engine/components/LeadDashboard.tsx` | `LeadDashboard` | Dashboard | Yes | No | No | Yes | `useDashboardMission` | Indirect | Medium | No | Indirect mission/opportunity consumer; blocked by dashboard hook. |
| `src/modules/crm-engine/components/CRMDashboard.tsx` | `CRMDashboard` | Dashboard | Yes | No | No | Yes | `useDashboardMission` | Indirect | Medium | No | Indirect mission/opportunity consumer; blocked by dashboard hook. |
| `src/app/api/mission/current/route.ts` | Legacy mission current route | Route | Yes | Yes | No | Yes | `missionEngineService.getCurrentMission`, `getMissionProgress` | Direct | High | No | Legacy runtime-accessible mission route; retirement/cutover requires separate approval. |
| `src/app/api/mission/complete/route.ts` | Legacy mission complete route | Route | Yes | Yes | No | Yes | `missionEngineService.completeTask`, `getCurrentMission` | Direct | High | No | Legacy mission write path; excluded. |
| `src/app/api/mission/mode/route.ts` | Legacy mission mode route | Route | Yes | No | No | No | `missionEngineService.setMode` | Direct | Medium | No | Legacy mission mode write path; excluded. |
| `src/modules/mission-engine/components/MissionCard.tsx` | Legacy `MissionCard` | Component | Yes | Yes | No | Yes | legacy `/api/mission/current` chain | Indirect | Medium | No | Legacy UI chain; not a bounded Business State candidate. |
| `src/app/(auth)/team/growth/page.tsx` | Team growth page | Dashboard | Yes | Yes | No | Yes | current dashboard/team/growth logic | Indirect | High | No | Growth/team surface remains blocked by Growth Loop governance. |

## Search Coverage

Search targets covered: `missionService`, `funnelProgressService`, `funnelHealthService`, `trafficEngineService`, `socialSetupValidator`, `socialSetupService.getReadiness`, `ceoAdvisorEngine`, `readiness`, `bottleneck`, `opportunity`, `getNextJourneyAction`, `useDashboardMission`, `ActivationDashboard`, `DashboardV4`, `FunnelOperatingCard`, Business Intel, Social Setup, Traffic Engine.

## Observations

- Dashboard and Journey consumers currently choose stage and next action themselves through mission progress thresholds.
- Funnel, Social, Traffic, and CEO Advisor each maintain separate readiness/bottleneck/opportunity semantics.
- `BusinessStateService` has no runtime consumer imports outside `src/modules/business-state/**`, so no consumer migration has occurred.
- Early candidates exist only where the consumer is read-only, module-scoped, and non-dashboard.
