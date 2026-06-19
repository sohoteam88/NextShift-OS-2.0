# Interview Authority Consumer Inventory

Scope: discovery only. This inventory records current runtime consumers that read or depend on interview-derived truth, legacy profile metadata, canonical `BrandProfile`, or unresolved business-mode sources.

## Consumer Inventory

| File Path | Consumer Name | Consumer Type | Reads From | Data Consumed | Direct Or Indirect | Active Status | Migration Risk | Target Projection |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `src/modules/brand-builder/components/wizard/InterviewStepClient.tsx` | `InterviewStepClient` | Component | `/api/v1/brand-builder/interview`, `answers.__dialogue`, extracted profile result, `/api/v1/brand-builder/profile` | Profile, Audience, BusinessContext, extraction output | Indirect | Active | High | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/brand-discovery/hooks/useBrandDiscovery.ts` | `useBrandDiscovery()` | Hook | `/api/v1/brand-builder/interview`, `interview.answers.__dialogue`, `interview.status`, `interview.extractedProfile` | Profile, Audience, extraction output | Indirect | Active | High | `InterviewProfileSnapshot`, `AudienceSnapshot` |
| `src/modules/brand-builder/components/TextInterview.tsx` | `TextInterview` | Component | `/api/v1/brand-builder/interview/[id]/answer`, `/extract` | Profile, extraction output | Indirect | Active | Medium | `InterviewProfileSnapshot` |
| `src/modules/brand-builder/components/VoiceInterview.tsx` | `VoiceInterview` | Component | `/api/v1/brand-builder/interview/[id]/extract` | Profile, Audience, extraction output | Indirect | Active | Medium | `InterviewProfileSnapshot`, `AudienceSnapshot` |
| `src/modules/brand-builder/components/BrandProfileStep.tsx` | `BrandProfileStep` | Component | `initialProfile`, `/api/v1/brand-builder/interview/[id]/confirm`, `/api/v1/brand-builder/profile`, `/extract` | Profile, Audience, BusinessContext | Indirect | Active | High | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/app/api/v1/brand-builder/interview/route.ts` | Interview session API | Route | `BrandInterview` via `brandInterviewService` | Profile | Indirect | Active | Medium | `InterviewProfileSnapshot` |
| `src/app/api/v1/brand-builder/interview/[id]/answer/route.ts` | Interview answer API | Route | `BrandInterview.answers` via `brandInterviewService` | Profile | Indirect | Active | Medium | `InterviewProfileSnapshot` |
| `src/app/api/v1/brand-builder/interview/[id]/message/route.ts` | Interview message API | Route | `BrandInterview.answers.__dialogue` via `brandInterviewService` | Profile, Audience | Indirect | Active | Medium | `InterviewProfileSnapshot`, `AudienceSnapshot` |
| `src/app/api/v1/brand-builder/interview/[id]/extract/route.ts` | Interview extract API | Route | `BrandInterview.answers`, `BrandInterview.extractedProfile` via `brandInterviewService` | Profile, Audience, BusinessContext, extraction output | Indirect | Active | High | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/app/api/v1/brand-builder/interview/[id]/confirm/route.ts` | Interview confirm API | Route | edited extracted profile via `brandInterviewService.confirmProfile()` | Profile, Audience, BusinessContext | Indirect | Active | High | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/app/api/v1/brand-builder/profile/route.ts` | Legacy profile API | Route | `User.metadata.brand_profile` | Profile, Audience, BusinessContext, Strategy | Direct | Active | High | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/app/api/v1/brand-builder/guide-progress/route.ts` | Guide progress API | Route | `User.metadata.brand_profile.setup_progress` | BusinessContext, Strategy | Direct | Active | High | `BusinessContextSnapshot` |
| `src/app/api/v1/brand-builder/bio/generate/route.ts` | Bio generate API | Route | request `brand_profile` or fallback `metadata.brand_profile` | Profile, Audience, BusinessContext | Direct | Active | High | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/app/api/v1/brand-builder/bio/regenerate/route.ts` | Bio regenerate API | Route | request `brand_profile` or fallback `metadata.brand_profile` | Profile, Audience, BusinessContext | Direct | Active | High | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/app/api/v1/brand-builder/username/generate/route.ts` | Username generate API | Route | request `brand_profile` or fallback `metadata.brand_profile` | Profile, Audience, BusinessContext | Direct | Active | High | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/app/api/v1/brand-builder/username/regenerate/route.ts` | Username regenerate API | Route | request `brand_profile` or fallback `metadata.brand_profile` | Profile, Audience, BusinessContext | Direct | Active | High | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/app/(auth)/brand-builder/step/profile/page.tsx` | `ProfileStepPage` | Page | `User.metadata.brand_profile` | Profile, Audience | Direct | Active | High | `InterviewProfileSnapshot`, `AudienceSnapshot` |
| `src/app/(auth)/brand-builder/profile/page.tsx` | `BrandProfilePage` | Page | `User.metadata.brand_profile` | Profile, Audience | Direct | Active | High | `InterviewProfileSnapshot`, `AudienceSnapshot` |
| `src/app/(auth)/brand-builder/step/accounts/page.tsx` | `AccountsStepPage` | Page | `User.metadata.brand_profile` | Profile, Audience, BusinessContext | Direct | Active | High | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/app/(auth)/brand-builder/step/guides/page.tsx` | `GuidesStepPage` | Page | `User.metadata.brand_profile` | Profile, BusinessContext, Strategy | Direct | Active | High | `BusinessContextSnapshot` |
| `src/app/(auth)/brand-builder/step/strategy/page.tsx` | `StrategyStepPage` | Page | `User.metadata.brand_profile` | BusinessContext, Strategy | Direct | Active | High | `BusinessContextSnapshot` |
| `src/app/(auth)/brand-builder/guides/page.tsx` | `BrandBuilderGuidesPage` | Page | `User.metadata.brand_profile` | Profile, BusinessContext, Strategy | Direct | Active | High | `BusinessContextSnapshot` |
| `src/app/(auth)/brand-builder/calendar/page.tsx` | `ContentCalendarPage` | Page | `User.metadata.brand_profile` + `brandDnaService.getBrandDNA()` | BusinessContext, Strategy | Direct + Indirect | Active | High | `BusinessContextSnapshot` |
| `src/modules/brand-dna/services/brandDnaService.ts` | `brandDnaService.getBrandDNA()` | Service | `BrandProfile`, fallback `metadata.brand_profile`, `BrandInterview.extractedProfile` for regeneration | Profile, Audience, BusinessContext, Strategy, extraction output | Direct | Active | High | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/app/api/v1/brand-dna/route.ts` | Brand DNA API | Route | `brandDnaService.getBrandDNA()` | Profile, Audience, BusinessContext, Strategy | Indirect | Active | Medium | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/brand-dna/services/BrandContextProvider.ts` | `getBrandContext()` | Service | `BrandProfile`, fallback `metadata.brand_profile` | Audience, BusinessContext, Strategy | Direct | Active | Medium | `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/brand-intelligence/projections/brand-health-projection.ts` | `getBrandHealthSnapshot()` | Projection | `BrandProfile`, fallback `metadata.brand_profile` | Audience, BusinessContext, Strategy | Direct | Active | Medium | `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/brand-intelligence/projections/brand-advisor-projection.ts` | `getBrandAdvisorSnapshot()` | Projection | `getBrandHealthSnapshot()` | Audience, BusinessContext, Strategy | Indirect | Active | Medium | `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/brand-intelligence/projections/brand-version-history-projection.ts` | Version history projection | Projection | `brandDnaService.getBrandDNA()` | Profile, Audience, BusinessContext, Strategy | Indirect | Active | Medium | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/member/services/onboarding-service.ts` | `onboardingService` | Service | `metadata.goals.target_audience`, `metadata.target_audience`, `metadata.brand_positioning` | Audience, BusinessContext, Strategy | Direct | Active | High | `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/app/api/v1/member/onboarding/goals/route.ts` | Onboarding goals API | Route | `onboardingService.saveGoals()` / `readGoals()` | Audience, BusinessContext | Indirect | Active | High | `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/content-engine/contentEngineService.ts` | `contentEngineService` | Service | `getBrandContext()` | Audience, BusinessContext, Strategy | Indirect | Active | Medium | `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/brand-builder/services/content-calendar-service.ts` | `contentCalendarService` | Service | `getBrandContext()` | Audience, BusinessContext, Strategy | Indirect | Active | Medium | `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/brand-builder/services/content-insights-service.ts` | `contentInsightsService` | Service | `getBrandContext()` | Audience, BusinessContext | Indirect | Active | Medium | `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/brand-builder/services/video-script-service.ts` | `videoScriptService` | Service | `getBrandContext()` | Audience, BusinessContext, Strategy | Indirect | Active | Medium | `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/social-setup/socialSetupService.ts` | `socialSetupService` | Service | `getBrandContext()` | Profile, Audience, BusinessContext, Strategy | Indirect | Active | Medium | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/lead-magnet/leadMagnetService.ts` | `leadMagnetService` | Service | `getBrandContext()` | Audience, BusinessContext, Strategy | Indirect | Active | Medium | `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/webinar-center/webinarService.ts` | `webinarService` | Service | `getBrandContext()` | Audience, BusinessContext, Strategy | Indirect | Active | Medium | `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/traffic-engine/trafficEngineService.ts` | `trafficEngineService` | Service | `getBrandContext()` | Audience, BusinessContext, Strategy | Indirect | Active | Medium | `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/crm/crmCenterService.ts` | `crmCenterService` | Service | `getBrandContext()` | Audience, BusinessContext | Indirect | Active | Medium | `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/business-intelligence/ceoAdvisorEngine.ts` | `ceoAdvisorEngine` | Service | `getBrandContext()` | Audience, BusinessContext, Strategy | Indirect | Active | Medium | `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/ai/agents/content-director.ts` | `content-director` agent | Service | `getBrandContext()` | Audience, BusinessContext, Strategy | Indirect | Active | Medium | `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/ai/agents/brand-strategist.ts` | `brand-strategist` agent | Service | `brandDnaService.getBrandDNA()` | Profile, Audience, BusinessContext, Strategy | Indirect | Active | Medium | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/blueprints/blueprintService.ts` | `blueprintService` | Service | `getBrandContext()` | Audience, BusinessContext, Strategy | Indirect | Active | Medium | `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/funnel/services/funnel-builder-service.ts` | `funnelBuilderService` | Service | `getBrandContext()` | Audience, BusinessContext, Strategy | Indirect | Active | Medium | `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/funnel/services/funnel-context-provider.ts` | `getFunnelContext()` | Service | `getBrandContext()`, `metadata.funnel_contexts`, hard-coded funnel defaults | BusinessMode, Audience, BusinessContext, Strategy | Direct + Indirect | Active | High | `BusinessModeSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/app/api/v1/funnel-context/route.ts` | Funnel context API | Route | `getAllFunnelContexts()` | BusinessMode, Audience, BusinessContext | Indirect | Active | High | `BusinessModeSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/components/funnel-operating-system/useFunnelPreference.ts` | `useFunnelPreference()` | Hook | `localStorage['nextshift.currentFunnel']` | BusinessMode | Direct | Active | High | `BusinessModeSnapshot` |
| `src/components/funnel-operating-system/FunnelOperatingCenter.tsx` | `FunnelOperatingCenter` | Component | `useFunnelPreference()`, `useFunnelOperatingData(funnelType)` | BusinessMode | Indirect | Active | High | `BusinessModeSnapshot` |
| `src/components/funnel-operating-system/FunnelSelector.tsx` | `FunnelSelector` | Component | `useFunnelPreference()` | BusinessMode | Indirect | Active | Medium | `BusinessModeSnapshot` |
| `src/components/funnel-operating-system/useFunnelOperatingData.ts` | `useFunnelOperatingData()` | Hook | `/api/v1/funnel-os?type=${funnelType}` | BusinessMode | Indirect | Active | High | `BusinessModeSnapshot` |
| `src/app/api/v1/funnel-os/route.ts` | Funnel OS API | Route | query param `type`, default `retail` | BusinessMode | Direct | Active | High | `BusinessModeSnapshot` |
| `src/modules/video/services/video-finalize-service.ts` | `videoFinalizeService` | Service | `getBrandContext()` via deprecated legacy mapper | Profile, Audience, BusinessContext | Indirect | Active | Medium | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/video/services/video-strategy-service.ts` | `videoStrategyService` | Service | `getBrandContext()` via deprecated legacy mapper | Profile, Audience, BusinessContext, Strategy | Indirect | Active | Medium | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/analytics/analyticsService.ts` | `analyticsService` | Service | `getBrandContext()` | Audience, BusinessContext | Indirect | Active | Medium | `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/whatsapp-ai/whatsappService.ts` | `whatsappService` | Service | `getBrandContext()` | Audience, BusinessContext, Strategy | Indirect | Active | Medium | `AudienceSnapshot`, `BusinessContextSnapshot` |

## Legacy Metadata Consumers

These consumers directly read `User.metadata.brand_profile` or accept `brand_profile` payloads as runtime input:

- `src/app/api/v1/brand-builder/profile/route.ts`
- `src/app/api/v1/brand-builder/guide-progress/route.ts`
- `src/app/api/v1/brand-builder/bio/generate/route.ts`
- `src/app/api/v1/brand-builder/bio/regenerate/route.ts`
- `src/app/api/v1/brand-builder/username/generate/route.ts`
- `src/app/api/v1/brand-builder/username/regenerate/route.ts`
- `src/app/(auth)/brand-builder/step/profile/page.tsx`
- `src/app/(auth)/brand-builder/profile/page.tsx`
- `src/app/(auth)/brand-builder/step/accounts/page.tsx`
- `src/app/(auth)/brand-builder/step/guides/page.tsx`
- `src/app/(auth)/brand-builder/step/strategy/page.tsx`
- `src/app/(auth)/brand-builder/guides/page.tsx`
- `src/app/(auth)/brand-builder/calendar/page.tsx`
- `src/modules/brand-intelligence/projections/brand-health-projection.ts`
- `src/modules/brand-dna/services/BrandContextProvider.ts`
- `src/modules/brand-dna/services/brandDnaService.ts`

## Business Mode Consumers

Current business-mode consumers found in runtime:

- `src/components/funnel-operating-system/useFunnelPreference.ts`
- `src/components/funnel-operating-system/FunnelOperatingCenter.tsx`
- `src/components/funnel-operating-system/FunnelSelector.tsx`
- `src/components/funnel-operating-system/useFunnelOperatingData.ts`
- `src/app/api/v1/funnel-os/route.ts`
- `src/modules/funnel/services/funnel-context-provider.ts`
- `src/app/api/v1/funnel-context/route.ts`

These do not currently read from interview-owned truth.
