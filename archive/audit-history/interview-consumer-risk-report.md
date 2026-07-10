# Interview Authority Consumer Risk Report

Source task: `P1-003_INTERVIEW_CONSUMER_AUDIT`

This report classifies the runtime consumers listed in `audit/interview-consumer-inventory.md`. No code was migrated.

## Low Risk Consumers

Low risk means read-only display or hydration consumers that do not choose journey, choose business mode, generate recommendations, or write profile/business state.

| Consumer | Files | Early Cutover Candidate | Notes |
| --- | --- | --- | --- |
| Brand builder read-only pages | `src/app/(auth)/brand-builder/profile/page.tsx`, `src/app/(auth)/brand-builder/step/profile/page.tsx`, `src/app/(auth)/brand-builder/step/accounts/page.tsx`, `src/app/(auth)/brand-builder/step/guides/page.tsx`, `src/app/(auth)/brand-builder/step/strategy/page.tsx`, `src/app/(auth)/brand-builder/guides/page.tsx` | Yes | Good bounded candidates because they hydrate/display profile data and can receive mapped profile/audience fields. |
| Brand guide display components | `src/modules/brand-builder/components/PlatformGuideStep.tsx`, `src/modules/brand-builder/components/guides/FacebookGuide.tsx`, `src/modules/brand-builder/components/guides/InstagramGuide.tsx` | Yes | Prop-driven display/guidance consumers. |
| Content strategy display component | `src/modules/brand-builder/components/ContentStrategyStep.tsx` | Yes | Candidate only if parent source is migrated first. |
| Brand DNA health route | `src/app/api/v1/brand-dna/health/route.ts` | Yes | Read-only endpoint, but depends on blocked provider/service internals. |
| Funnel strategy display | `src/modules/funnel/components/ai/StrategyDisplay.tsx` | Yes | Pure display of already-derived strategy output. |
| Funnel create telemetry | `src/app/api/v1/funnel/funnels/route.ts` | No | Low risk, but reads `funnel_type` telemetry rather than InterviewAuthority source. |

## Medium Risk Consumers

Medium risk means generation/personalization consumers or BrandContext consumers that influence output but do not directly choose dashboard/journey state or write profile authority.

| Consumer Group | Files | Reason |
| --- | --- | --- |
| Username and bio generation | `src/app/api/v1/brand-builder/username/generate/route.ts`, `src/app/api/v1/brand-builder/username/regenerate/route.ts`, `src/app/api/v1/brand-builder/bio/generate/route.ts`, `src/app/api/v1/brand-builder/bio/regenerate/route.ts`, `src/modules/brand-builder/services/username-service.ts`, `src/modules/brand-builder/services/bio-service.ts` | AI output depends on profile/audience fields. |
| Brand builder generated content | `src/modules/brand-builder/services/content-calendar-service.ts`, `src/modules/brand-builder/services/content-insights-service.ts`, `src/modules/brand-builder/services/video-script-service.ts` | Uses BrandContext or deprecated BrandContext wrappers to generate content/video outputs. |
| Content engine | `src/modules/content-engine/contentEngineService.ts`, `src/modules/content-engine/contentGenerators.ts` | Generates pillars/content/calendar from audience and messaging. |
| Social setup | `src/modules/social-setup/socialSetupService.ts`, `src/modules/social-setup/socialPromptGenerator.ts` | Generates setup assets from BrandContext. |
| Funnel builder generators | `src/modules/funnel/services/funnel-builder-service.ts`, `src/modules/funnel/services/funnel-generators.ts` | Generates funnel package from audience/offer/context. |
| Lead magnet | `src/modules/lead-magnet/leadMagnetService.ts`, `src/modules/lead-magnet/leadMagnetGenerators.ts` | Generates conversion asset from audience/pain/offer. |
| Traffic engine | `src/modules/traffic-engine/trafficEngineService.ts`, `src/modules/traffic-engine/trafficGenerators.ts` | Generates campaign copy and audience targeting. |
| WhatsApp AI | `src/modules/whatsapp-ai/whatsappService.ts`, `src/modules/whatsapp-ai/whatsappEngines.ts` | Generates replies, qualification, and follow-up messages. |
| CRM and analytics context consumers | `src/modules/crm/crmCenterService.ts`, `src/modules/analytics/analyticsService.ts` | Personalize center/analytics using BrandContext. |
| Video and webinar generation | `src/modules/video/services/video-strategy-service.ts`, `src/modules/video/services/video-finalize-service.ts`, `src/modules/video-production/videoProductionService.ts`, `src/modules/video-production/videoGenerators.ts`, `src/modules/webinar-center/webinarService.ts`, `src/modules/webinar-center/webinarGenerators.ts` | Generate scripts/packages/pages from BrandContext. |
| Blueprint service | `src/modules/blueprints/blueprintService.ts` | Reads BrandContext and stores blueprint-related profile output. |

## High Risk Consumers

High risk means consumers that write authority data, mix fallbacks locally, select journey/business state, generate strategic recommendations, or act as blocked shared providers.

| Consumer Group | Files | Reason |
| --- | --- | --- |
| Brand interview runtime | `src/modules/brand-builder/services/brand-interview-service.ts`, all `src/app/api/v1/brand-builder/interview/**/route.ts` routes | Reads/writes `BrandInterview.answers`, `extractedProfile`, `metadata.brand_profile`, and `BrandProfile`. Core write path. |
| Profile confirmation/editing UI | `src/modules/brand-builder/components/BrandProfileStep.tsx`, `src/modules/brand-builder/components/wizard/ProfilePageClient.tsx`, `src/modules/brand-builder/components/wizard/ProfileStepClient.tsx` | User edits and confirms profile/audience fields. |
| Legacy brand profile APIs | `src/app/api/v1/brand-builder/profile/route.ts`, `src/app/api/v1/brand-builder/guide-progress/route.ts` | Directly read/write legacy `metadata.brand_profile`. |
| Brand DNA service | `src/modules/brand-dna/services/brandDnaService.ts`, `src/app/api/v1/brand-dna/regenerate/route.ts`, `src/app/(auth)/brand-dna/page.tsx` | Reads BrandProfile/metadata and `BrandInterview.extractedProfile`; writes BrandProfile and legacy metadata. |
| Brand intelligence projections/regeneration | `src/modules/brand-intelligence/projections/brand-health-projection.ts`, `src/modules/brand-intelligence/services/brand-regeneration-service.ts` | Duplicates direct BrandProfile/legacy fallback mapping and reads latest completed interview for regeneration. |
| Content pillar write path | `src/modules/content-engine/contentEngineService.ts` | `savePillars` writes `BrandProfile.contentPillars`, while other methods read BrandContext for generation. |
| Onboarding authority sources | `src/modules/member/services/onboarding-service.ts`, `src/app/api/v1/member/onboarding/**/*.ts`, `src/app/(auth)/onboarding/**/*.tsx` | Reads/writes onboarding goals, target audience, brand positioning, and first content/funnel state. |
| Dashboard mission | `src/modules/dashboard/hooks/useDashboardMission.ts` | Chooses dashboard next action from brand mission flags. Explicitly blocked. |
| Journey resolver | `src/modules/journey/utils/getNextJourneyAction.ts`, `src/app/(auth)/journey/page.tsx` | Chooses journey stage/routes based on brand interview/DNA state. |
| Mission engine | `src/modules/mission-engine/services/mission-service.ts` | Chooses mission stage/tasks from brand interview/DNA state. |
| Activation flow | `src/modules/activation/hooks/useActivation.ts` | Converts journey state to activation day/progress. |
| Evolution projection | `src/modules/evolution/adapters/evolution-adapter.ts`, `src/modules/evolution/core/derive-level.ts`, `src/modules/evolution/hooks/use-evolution-projection.ts` | Derives level/milestones from `brand_interview` and progress. |
| CEO advisor / AI COO surface | `src/modules/business-intelligence/ceoAdvisorEngine.ts`, `src/modules/ai/agents/content-director.ts` | Generates strategic recommendations/actions from BrandContext and business state. |
| Funnel context/strategy | `src/modules/funnel/services/funnel-context-provider.ts`, `src/modules/funnel/services/funnel-strategy-service.ts` | Merges BrandContext with funnel type/defaults/custom metadata and chooses `funnel_type`. |
| BrandContextProvider | `src/modules/brand-dna/services/BrandContextProvider.ts` | Central blocked provider; direct BrandProfile plus legacy metadata fallback read. |

## Blocked Consumers

These must not be cut over in P1-003 and should remain blocked until a later architecture-approved migration:

- Dashboard mission and dashboard next action consumers:
  - `src/modules/dashboard/hooks/useDashboardMission.ts`
  - `src/modules/journey/utils/getNextJourneyAction.ts`
  - `src/modules/mission-engine/services/mission-service.ts`
- Evolution/business progression projections:
  - `src/modules/evolution/adapters/evolution-adapter.ts`
  - `src/modules/evolution/core/derive-level.ts`
  - `src/modules/evolution/hooks/use-evolution-projection.ts`
  - `src/modules/activation/hooks/useActivation.ts`
- Shared provider and mixed fallback authority:
  - `src/modules/brand-dna/services/BrandContextProvider.ts`
  - `src/modules/brand-dna/services/brandDnaService.ts`
  - `src/modules/brand-intelligence/projections/brand-health-projection.ts`
  - `src/modules/brand-intelligence/services/brand-regeneration-service.ts`
- Business state / funnel strategy:
  - `src/modules/funnel/services/funnel-context-provider.ts`
  - `src/modules/funnel/services/funnel-strategy-service.ts`
- AI COO/recommendation surfaces:
  - `src/modules/business-intelligence/ceoAdvisorEngine.ts`
  - `src/modules/ai/agents/content-director.ts`

## Early Cutover Candidates

Bounded early candidates exist, but they should be limited to read-only profile/audience display surfaces:

- `src/app/(auth)/brand-builder/profile/page.tsx`
- `src/app/(auth)/brand-builder/step/profile/page.tsx`
- `src/app/(auth)/brand-builder/step/accounts/page.tsx`
- `src/app/(auth)/brand-builder/step/guides/page.tsx`
- `src/app/(auth)/brand-builder/step/strategy/page.tsx`
- `src/app/(auth)/brand-builder/guides/page.tsx`
- `src/modules/brand-builder/components/PlatformGuideStep.tsx`
- `src/modules/brand-builder/components/guides/FacebookGuide.tsx`
- `src/modules/brand-builder/components/guides/InstagramGuide.tsx`
- `src/modules/brand-builder/components/ContentStrategyStep.tsx`
- `src/app/api/v1/brand-dna/health/route.ts`
- `src/modules/funnel/components/ai/StrategyDisplay.tsx`

Recommended P1-004 boundary: start with Brand Builder read-only page hydration and guide display components only. Do not cut over shared providers, generation services, onboarding writes, dashboard, journey, evolution, business state, or AI recommendation surfaces.
