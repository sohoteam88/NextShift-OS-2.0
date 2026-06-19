# Interview Authority Consumer Inventory

Source task: `P1-003_INTERVIEW_CONSUMER_AUDIT`

Scope: runtime consumers that read or indirectly consume `BrandInterview`, `BrandProfile`, `metadata.brand_profile`, onboarding metadata, business mode, audience, or business context. This is discovery only. No consumer was migrated.

Search targets covered: `BrandProfile`, `BrandInterview`, `brand_profile`, `metadata.brand_profile`, `extractedProfile`, `businessMode`, `business_mode`, `funnelMode`, `funnel_type`, `targetAudience`, `audience`, `idealCustomer`, `onboarding`, `BrandContext`, `useBrandContext`, `BrandContextProvider`, `getBrandContext`.

Excluded from this inventory: translation JSON, test files, markdown audit files, pure type aliases with no runtime read, and the new P1-002 `interview-authority` adapter/service implementation.

## Inventory

| File Path | Consumer Name | Consumer Type | Source Read | Data Consumed | Direct Or Indirect | Active Status | Migration Risk | Early Cutover Candidate | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `src/modules/brand-builder/services/brand-interview-service.ts` | `brandInterviewService.create` | Service | BrandInterview | Profile | Direct | Active | High | No | Creates interview rows and initializes `answers`; write path is explicitly out of scope. |
| `src/modules/brand-builder/services/brand-interview-service.ts` | `brandInterviewService.answer` | Service | BrandInterview | Profile / Audience | Direct | Active | High | No | Updates `answers` and interview status. |
| `src/modules/brand-builder/services/brand-interview-service.ts` | `brandInterviewService.sendDialogueMessage` | Service | BrandInterview | Profile / Audience / BusinessContext | Direct | Active | High | No | Reads and writes dialogue slots under `answers.__dialogue`. |
| `src/modules/brand-builder/services/brand-interview-service.ts` | `brandInterviewService.finishDialogue` | Service | BrandInterview | Profile / Audience / BusinessContext | Direct | Active | High | No | Marks interview as analyzing and calls extraction. |
| `src/modules/brand-builder/services/brand-interview-service.ts` | `brandInterviewService.extractBrandProfile` | Service / AI Surface | BrandInterview / extractedProfile | Profile / Audience / BusinessContext | Direct | Active | High | No | Reads `answers`, generates extracted profile, writes `extractedProfile`. |
| `src/modules/brand-builder/services/brand-interview-service.ts` | `brandInterviewService.confirmProfile` | Service | BrandInterview / BrandProfile / metadata.brand_profile | Profile / Audience / BusinessContext | Direct | Active | High | No | Writes `BrandInterview.extractedProfile`, legacy `metadata.brand_profile`, and `BrandProfile`. |
| `src/app/api/v1/brand-builder/interview/route.ts` | Brand interview create/latest API | Route | BrandInterview | Profile | Direct via service | Active | High | No | Runtime interview creation/lookup route. |
| `src/app/api/v1/brand-builder/interview/[id]/answer/route.ts` | Interview answer API | Route | BrandInterview | Profile / Audience | Direct via service | Active | High | No | Mutates interview answers. |
| `src/app/api/v1/brand-builder/interview/[id]/message/route.ts` | Dialogue message API | Route | BrandInterview | Profile / Audience / BusinessContext | Direct via service | Active | High | No | Mutates dialogue state. |
| `src/app/api/v1/brand-builder/interview/[id]/finish/route.ts` | Finish dialogue API | Route | BrandInterview | Profile / Audience / BusinessContext | Direct via service | Active | High | No | Triggers extraction flow. |
| `src/app/api/v1/brand-builder/interview/[id]/extract/route.ts` | Extract profile API | Route / AI Surface | BrandInterview / extractedProfile | Profile / Audience / BusinessContext | Direct via service | Active | High | No | AI extraction write path. |
| `src/app/api/v1/brand-builder/interview/[id]/confirm/route.ts` | Confirm profile API | Route | BrandInterview / BrandProfile / metadata.brand_profile | Profile / Audience / BusinessContext | Direct via service | Active | High | No | Canonical and legacy write path. |
| `src/modules/brand-discovery/hooks/useBrandDiscovery.ts` | `useBrandDiscovery` | Hook | BrandInterview / extractedProfile | Profile / Audience | Direct via API payload | Active | Medium | No | Client state tracks `extractedProfile`; not a server source reader but active interview consumer. |
| `src/modules/brand-builder/components/BrandProfileStep.tsx` | `BrandProfileStep` | Component | extractedProfile / metadata brand profile shape | Profile / Audience | Direct via props/API | Active | High | No | Edits and confirms profile fields including `target_audience` and `audience_pain_points`. |
| `src/modules/brand-builder/components/wizard/ProfilePageClient.tsx` | Profile wizard client | Component | extractedProfile / metadata brand profile shape | Profile / Audience | Indirect | Active | High | No | Hosts `BrandProfileStep`; participates in profile confirmation flow. |
| `src/modules/brand-builder/components/wizard/ProfileStepClient.tsx` | Profile step client | Component | extractedProfile / metadata brand profile shape | Profile / Audience | Indirect | Active | High | No | Hosts `BrandProfileStep`; participates in profile confirmation flow. |
| `src/app/(auth)/brand-builder/profile/page.tsx` | Brand builder profile page | Route | metadata.brand_profile | Profile / Audience | Direct | Active | Low | Yes | Read-only page bootstrap for profile UI. |
| `src/app/(auth)/brand-builder/step/profile/page.tsx` | Brand profile step page | Route | metadata.brand_profile | Profile / Audience | Direct | Active | Low | Yes | Reads legacy profile to hydrate step. |
| `src/app/(auth)/brand-builder/step/accounts/page.tsx` | Accounts step page | Route | metadata.brand_profile | Profile | Direct | Active | Low | Yes | Read-only legacy profile hydration. |
| `src/app/(auth)/brand-builder/step/guides/page.tsx` | Guides step page | Route | metadata.brand_profile | Profile | Direct | Active | Low | Yes | Read-only legacy profile hydration. |
| `src/app/(auth)/brand-builder/step/strategy/page.tsx` | Strategy step page | Route | metadata.brand_profile | Profile / Audience | Direct | Active | Low | Yes | Read-only legacy profile hydration. |
| `src/app/(auth)/brand-builder/guides/page.tsx` | Brand guides page | Route | metadata.brand_profile | Profile | Direct | Active | Low | Yes | Read-only profile display/input for guide components. |
| `src/app/(auth)/brand-builder/calendar/page.tsx` | Brand calendar page | Route | BrandProfile via Brand DNA / metadata.brand_profile | Profile / Audience | Direct / Indirect | Active | Medium | No | Mixes `brandDnaService.getBrandDNA` with legacy `metadata.brand_profile.contentStrategy`. |
| `src/modules/brand-builder/components/AccountSetupStep.tsx` | Account setup step | Component | brand_profile payload | Profile | Direct via props/API | Active | Medium | No | Sends `brand_profile` to username/bio APIs; not read-only. |
| `src/modules/brand-builder/components/ContentStrategyStep.tsx` | Content strategy step | Component | brand profile prop | Profile / Audience | Direct via props | Active | Low | Yes | Read-only-ish profile consumer; cutover possible if parent provides `InterviewAuthority`. |
| `src/modules/brand-builder/components/PlatformGuideStep.tsx` | Platform guide step | Component | brand profile prop | Profile | Direct via props | Active | Low | Yes | Presentation/guide consumer. |
| `src/modules/brand-builder/components/guides/FacebookGuide.tsx` | Facebook guide | Component | brand profile prop | Profile | Direct via props | Active | Low | Yes | Generates setup guidance from profile fields. |
| `src/modules/brand-builder/components/guides/InstagramGuide.tsx` | Instagram guide | Component | brand profile prop | Profile | Direct via props | Active | Low | Yes | Generates setup guidance from profile fields. |
| `src/app/api/v1/brand-builder/profile/route.ts` | Brand builder profile API | Route | metadata.brand_profile | Profile / Audience | Direct | Active | High | No | Reads and writes legacy `metadata.brand_profile`. Retirement candidate only, not for this task. |
| `src/app/api/v1/brand-builder/guide-progress/route.ts` | Guide progress API | Route | metadata.brand_profile | Profile | Direct | Active | High | No | Reads and mutates progress under legacy profile metadata. |
| `src/app/api/v1/brand-builder/username/generate/route.ts` | Username generate API | Route / AI Surface | metadata.brand_profile / request brand_profile | Profile / Audience | Direct | Active | Medium | No | Generates AI output from profile; not purely read-only. |
| `src/app/api/v1/brand-builder/username/regenerate/route.ts` | Username regenerate API | Route / AI Surface | metadata.brand_profile / request brand_profile | Profile / Audience | Direct | Active | Medium | No | Same as username generate with excluded list. |
| `src/app/api/v1/brand-builder/bio/generate/route.ts` | Bio generate API | Route / AI Surface | metadata.brand_profile / request brand_profile | Profile / Audience | Direct | Active | Medium | No | Generates bio copy from profile. |
| `src/app/api/v1/brand-builder/bio/regenerate/route.ts` | Bio regenerate API | Route / AI Surface | metadata.brand_profile / request brand_profile | Profile / Audience | Direct | Active | Medium | No | Same as bio generate with platform context. |
| `src/modules/brand-builder/services/username-service.ts` | Username service | Service / AI Surface | brand profile payload | Profile / Audience | Direct | Active | Medium | No | Builds prompt from `target_audience` and profile fields. |
| `src/modules/brand-builder/services/bio-service.ts` | Bio service | Service / AI Surface | brand profile payload | Profile / Audience | Direct | Active | Medium | No | Builds prompt from `target_audience` and profile fields. |
| `src/modules/brand-dna/services/BrandContextProvider.ts` | `getBrandContext` | Service | BrandProfile / metadata.brand_profile | Profile / Audience / BusinessContext | Direct | Active | High | No | Central blocked provider; reads table first and falls back to legacy metadata. |
| `src/modules/brand-dna/services/BrandContextProvider.ts` | `getBrandDNAHealth` | Service | BrandProfile / metadata.brand_profile | Profile / Audience / BusinessContext | Direct | Active | Medium | No | Health projection uses local BrandProfile/legacy mapping. |
| `src/app/api/v1/brand-dna/health/route.ts` | Brand DNA health API | Route | BrandProfile / metadata via provider | Profile / Audience / BusinessContext | Indirect | Active | Low | Yes | Read-only health endpoint; can be bounded candidate after provider decision. |
| `src/modules/brand-dna/services/brandDnaService.ts` | `getBrandDNA` | Service | BrandProfile / metadata.brand_profile | Profile / Audience / BusinessContext | Direct | Active | High | No | Canonical DNA service with legacy fallback. |
| `src/modules/brand-dna/services/brandDnaService.ts` | `saveBrandDNA` / `updateBrandDNA` / `publishBrandDNA` | Service | BrandProfile / metadata.brand_profile | Profile / Audience / BusinessContext | Direct | Active | High | No | Writes BrandProfile and backwards-compatible metadata. |
| `src/modules/brand-dna/services/brandDnaService.ts` | `regenerateBrandDNA` | Service / AI Surface | BrandInterview.extractedProfile / BrandProfile | Profile / Audience / BusinessContext | Direct | Active | High | No | Reads interview extraction and writes DNA/Profile. |
| `src/app/api/v1/brand-dna/regenerate/route.ts` | Brand DNA regenerate API | Route | BrandInterview.extractedProfile / BrandProfile | Profile / Audience / BusinessContext | Direct via service | Active | High | No | Regeneration write path. |
| `src/app/(auth)/brand-dna/page.tsx` | Brand DNA page | Route | BrandInterview | Profile / Audience | Direct | Active | Medium | No | Reads latest `BrandInterview` to support DNA page state. |
| `src/modules/brand-intelligence/projections/brand-health-projection.ts` | Brand health projection | Service / Projection | BrandProfile / metadata.brand_profile | Profile / Audience / BusinessContext | Direct | Active | High | No | Duplicates BrandProfile-to-DNA fallback logic locally; blocked until projection migration decision. |
| `src/modules/brand-intelligence/services/brand-regeneration-service.ts` | Brand regeneration service | Service | BrandInterview / BrandProfile | Profile / Audience / BusinessContext | Direct | Active | High | No | Finds latest extracted/confirmed interview and delegates Brand DNA regeneration. |
| `src/modules/member/services/onboarding-service.ts` | `getState` / `getOverview` | Service | onboarding metadata | Profile / Audience | Direct | Active | High | No | Reads `metadata.onboarding`, `metadata.goals`, `metadata.brand_positioning`. |
| `src/modules/member/services/onboarding-service.ts` | `saveProfile` / `saveGoals` / `saveBrandPositioning` | Service | onboarding metadata | Profile / Audience | Direct | Active | High | No | Writes onboarding metadata; no cutover in this task. |
| `src/modules/member/services/onboarding-service.ts` | `generateBrandPositioning` / `generateFirstContentOptions` | Service / AI Surface | onboarding metadata | Profile / Audience | Direct | Active | High | No | Uses onboarding goals/brand positioning to generate AI output. |
| `src/app/api/v1/member/onboarding/route.ts` | Member onboarding state API | Route | onboarding metadata | Profile / Audience | Direct via service | Active | High | No | Reads/writes onboarding state. |
| `src/app/api/v1/member/onboarding/profile/route.ts` | Onboarding profile API | Route | onboarding metadata | Profile | Direct via service | Active | High | No | Onboarding write path. |
| `src/app/api/v1/member/onboarding/goals/route.ts` | Onboarding goals API | Route | onboarding metadata | Audience | Direct via service | Active | High | No | Writes target audience and goals. |
| `src/app/api/v1/member/onboarding/brand/route.ts` | Onboarding brand API | Route / AI Surface | onboarding metadata | Profile / Audience | Direct via service | Active | High | No | Generates and writes brand positioning. |
| `src/app/api/v1/member/onboarding/first-content/route.ts` | First content onboarding API | Route / AI Surface | onboarding metadata | Profile / Audience | Direct via service | Active | High | No | Generates/saves first content options. |
| `src/app/api/v1/member/onboarding/first-funnel/route.ts` | First funnel onboarding API | Route | onboarding metadata | BusinessContext / Audience | Direct via service | Active | High | No | Creates first funnel from onboarding state. |
| `src/app/(auth)/layout.tsx` | Auth app layout | Route/Layout | onboarding metadata | Profile | Indirect via service | Active | Low | No | Reads onboarding completion for shell/redirect context; not InterviewAuthority cutover target. |
| `src/app/(auth)/onboarding/page.tsx` | Onboarding router page | Route | onboarding metadata | Profile | Indirect via service | Active | High | No | Controls onboarding routing. |
| `src/app/(auth)/onboarding/complete/page.tsx` | Onboarding complete page | Route | onboarding metadata | Profile | Indirect via service | Active | High | No | Controls completion redirect. |
| `src/app/(auth)/onboarding/profile/page.tsx` | Onboarding profile page | Route/Component | onboarding metadata | Profile | Indirect via API | Active | High | No | User-facing metadata write path. |
| `src/app/(auth)/onboarding/goals/page.tsx` | Onboarding goals page | Route/Component | onboarding metadata | Audience | Indirect via API | Active | High | No | User-facing target audience write path. |
| `src/app/(auth)/onboarding/first-content/page.tsx` | First content onboarding page | Route/Component | onboarding metadata | Profile / Audience | Indirect via API | Active | High | No | AI output and onboarding progression. |
| `src/app/(auth)/onboarding/first-funnel/page.tsx` | First funnel onboarding page | Route/Component | onboarding metadata | BusinessContext / Audience | Indirect via API | Active | High | No | Funnel creation/completion flow. |
| `src/modules/dashboard/hooks/useDashboardMission.ts` | `useDashboardMission` | Hook / Dashboard | mission progress brand flags | Profile / BusinessContext | Indirect | Active | High | No | Blocked. Determines dashboard next action from `brand_interview`/`brand_dna` progress. |
| `src/modules/journey/utils/getNextJourneyAction.ts` | `getNextJourneyAction` | Journey Utility | mission progress brand flags | Profile / BusinessContext | Indirect | Active | High | No | Blocked. Selects journey route/stage. |
| `src/modules/mission-engine/services/mission-service.ts` | `getCurrentMission` | Service | brandInterview / brandDNA flags | Profile / BusinessContext | Indirect | Active | High | No | Blocked. Determines mission stage and tasks. |
| `src/modules/activation/hooks/useActivation.ts` | `useActivation` | Hook | mission progress brand flags | Profile / BusinessContext | Indirect | Active | High | No | Journey/activation progress surface. |
| `src/app/(auth)/journey/page.tsx` | Journey page | Route | mission progress brand flags | Profile / BusinessContext | Indirect | Active | High | No | Journey surface uses brand interview completion state. |
| `src/modules/evolution/adapters/evolution-adapter.ts` | Evolution adapter | Adapter / Projection | mission progress brand flags | Profile / BusinessContext | Indirect | Active | High | No | Blocked projection consumer; derives level from `brand_interview`. |
| `src/modules/evolution/core/derive-level.ts` | Level derivation | Projection | brandInterview flag | Profile / BusinessContext | Indirect | Active | High | No | Blocked projection core; next milestone can be `brand_interview`. |
| `src/modules/evolution/hooks/use-evolution-projection.ts` | `useEvolutionProjection` | Hook / Projection | mission progress brand flags | Profile / BusinessContext | Indirect | Active | High | No | Blocked dashboard dependency. |
| `src/modules/business-intelligence/ceoAdvisorEngine.ts` | CEO advisor engine | AI Surface / Service | BrandContext | Profile / Audience / BusinessContext | Indirect | Active | High | No | Blocked AI COO-style recommendation surface; generates actions from brand health. |
| `src/modules/ai/agents/content-director.ts` | Content director agent | AI Surface | BrandContext | Profile / Audience | Indirect | Active | High | No | Dynamic import of `getBrandContext`; generates recommendations/actions. |
| `src/modules/content-engine/contentEngineService.ts` | Content engine service | Service / AI Surface | BrandContext | Profile / Audience | Indirect | Active | Medium | No | Generates pillars/content/calendar from BrandContext. |
| `src/modules/content-engine/contentEngineService.ts` | `savePillars` | Service | BrandProfile | Profile / BusinessContext | Direct | Active | High | No | Writes `BrandProfile.contentPillars`; not a cutover candidate. |
| `src/modules/content-engine/contentGenerators.ts` | Content generators | Service / Generator | BrandContext | Profile / Audience | Indirect | Active | Medium | No | Runtime generators consume `ctx.audience`, messaging, offer, pillars. |
| `src/modules/brand-builder/services/content-calendar-service.ts` | Brand builder content calendar service | Service / AI Surface | BrandContext | Profile / Audience | Indirect | Active | Medium | No | Generates calendar from `getBrandContext`. |
| `src/modules/brand-builder/services/content-insights-service.ts` | Content insights service | Service / AI Surface | BrandContext | Profile / Audience | Indirect | Active | Medium | No | Deprecated local `getBrandProfile` wrapper around `getBrandContext`. |
| `src/modules/brand-builder/services/video-script-service.ts` | Video script service | Service / AI Surface | BrandContext | Profile / Audience | Indirect | Active | Medium | No | Deprecated local `getBrandProfile` wrapper around `getBrandContext`. |
| `src/modules/social-setup/socialSetupService.ts` | Social setup service | Service | BrandContext | Profile / Audience | Indirect | Active | Medium | No | Generates social setup assets. |
| `src/modules/social-setup/socialPromptGenerator.ts` | Social prompt generator | Generator | BrandContext | Profile / Audience | Indirect | Active | Medium | No | Uses audience and positioning in output. |
| `src/modules/funnel/services/funnel-context-provider.ts` | Funnel context provider | Service | BrandContext / metadata funnel contexts / funnel type | Audience / BusinessContext / BusinessMode-like funnel type | Indirect / Direct metadata | Active | High | No | Blocked business-state-adjacent provider; merges brand DNA with funnel type defaults/custom metadata. |
| `src/modules/funnel/services/funnel-builder-service.ts` | Funnel builder service | Service | BrandContext | Audience / BusinessContext | Indirect | Active | Medium | No | Generates funnel package from BrandContext. |
| `src/modules/funnel/services/funnel-strategy-service.ts` | Funnel strategy service | Service / AI Surface | BrandContext / funnel_type | Audience / BusinessContext | Indirect | Active | High | No | AI strategy chooses `funnel_type`; business routing risk. |
| `src/modules/funnel/services/funnel-generators.ts` | Funnel generators | Generator | BrandContext | Audience / BusinessContext | Indirect | Active | Medium | No | Builds pages/email/ads from audience/offer. |
| `src/modules/funnel/components/ai/StrategyDisplay.tsx` | Strategy display | Component | funnel_type output | BusinessContext | Direct via props | Active | Low | Yes | Read-only display of strategy output; bounded candidate after strategy source stabilizes. |
| `src/app/api/v1/funnel/funnels/route.ts` | Funnel create API telemetry | Route | funnel_type | BusinessContext | Direct | Active | Low | No | Tracks `funnel_type`; not InterviewAuthority source but business context signal. |
| `src/modules/lead-magnet/leadMagnetService.ts` | Lead magnet service | Service | BrandContext | Audience / BusinessContext | Indirect | Active | Medium | No | Generates lead magnet from brand audience + user pain input. |
| `src/modules/lead-magnet/leadMagnetGenerators.ts` | Lead magnet generators | Generator | BrandContext | Audience / BusinessContext | Indirect | Active | Medium | No | Uses `ctx.audience`, offer, CTA. |
| `src/modules/traffic-engine/trafficEngineService.ts` | Traffic engine service | Service | BrandContext | Audience / BusinessContext | Indirect | Active | Medium | No | Generates traffic package. |
| `src/modules/traffic-engine/trafficGenerators.ts` | Traffic generators | Generator | BrandContext | Audience / BusinessContext | Indirect | Active | Medium | No | Uses audience/pain/offer for campaigns. |
| `src/modules/whatsapp-ai/whatsappService.ts` | WhatsApp AI service | Service / AI Surface | BrandContext | Audience / BusinessContext | Indirect | Active | Medium | No | Creates replies, qualifications, follow-ups from brand context. |
| `src/modules/whatsapp-ai/whatsappEngines.ts` | WhatsApp engines | Generator | BrandContext | Audience / BusinessContext | Indirect | Active | Medium | No | Uses audience and pain points in replies/follow-up. |
| `src/modules/crm/crmCenterService.ts` | CRM center service | Service | BrandContext | Profile / Audience | Indirect | Active | Medium | No | Reads context to shape CRM center data. |
| `src/modules/analytics/analyticsService.ts` | Analytics service | Service | BrandContext / onboardingCompleted | Profile / Audience | Indirect | Active | Medium | No | Combines BrandContext with analytics state. |
| `src/modules/video/services/video-strategy-service.ts` | Video strategy service | Service / AI Surface | BrandContext | Profile / Audience | Indirect | Active | Medium | No | Deprecated local `getBrandProfile` wrapper maps BrandContext to legacy shape. |
| `src/modules/video/services/video-finalize-service.ts` | Video finalize service | Service | BrandContext | Profile / Audience | Indirect | Active | Medium | No | Deprecated wrapper maps BrandContext to legacy shape. |
| `src/modules/video-production/videoProductionService.ts` | Video production service | Service | BrandContext | Profile / Audience | Indirect | Active | Medium | No | Generates video package from brand context. |
| `src/modules/video-production/videoGenerators.ts` | Video production generators | Generator | BrandContext | Profile / Audience | Indirect | Active | Medium | No | Uses audience and positioning in script/creative output. |
| `src/modules/webinar-center/webinarService.ts` | Webinar service | Service | BrandContext | Audience / BusinessContext | Indirect | Active | Medium | No | Generates webinar package. |
| `src/modules/webinar-center/webinarGenerators.ts` | Webinar generators | Generator | BrandContext | Audience / BusinessContext | Indirect | Active | Medium | No | Uses audience, pain points, offer, messaging. |
| `src/modules/blueprints/blueprintService.ts` | Blueprint service | Service | BrandContext / BrandProfile | Profile / Audience | Indirect | Active | Medium | No | Reads BrandContext and stores blueprint-related profile data. |
| `src/modules/admin/services/beta-command-service.ts` | Beta workspace summary | Service / Admin Surface | BrandProfile | Profile | Direct | Active | Low | No | Tenant-level admin summary reads `BrandProfile.confidenceScore`/`publishedAt`; not user InterviewAuthority cutover scope. |

## Legacy Metadata Retirement Candidates

These direct reads/writes are retirement candidates only. They must not be retired in P1-003.

- `src/app/(auth)/brand-builder/profile/page.tsx`
- `src/app/(auth)/brand-builder/step/profile/page.tsx`
- `src/app/(auth)/brand-builder/step/accounts/page.tsx`
- `src/app/(auth)/brand-builder/step/guides/page.tsx`
- `src/app/(auth)/brand-builder/step/strategy/page.tsx`
- `src/app/(auth)/brand-builder/guides/page.tsx`
- `src/app/(auth)/brand-builder/calendar/page.tsx`
- `src/app/api/v1/brand-builder/profile/route.ts`
- `src/app/api/v1/brand-builder/guide-progress/route.ts`
- `src/app/api/v1/brand-builder/username/generate/route.ts`
- `src/app/api/v1/brand-builder/username/regenerate/route.ts`
- `src/app/api/v1/brand-builder/bio/generate/route.ts`
- `src/app/api/v1/brand-builder/bio/regenerate/route.ts`
- `src/modules/brand-builder/services/brand-interview-service.ts`
- `src/modules/brand-dna/services/BrandContextProvider.ts`
- `src/modules/brand-dna/services/brandDnaService.ts`
- `src/modules/brand-intelligence/projections/brand-health-projection.ts`
- `src/modules/brand-intelligence/services/brand-regeneration-service.ts`
- `src/modules/content-engine/contentEngineService.ts`
