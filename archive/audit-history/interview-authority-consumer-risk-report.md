# Interview Authority Consumer Risk Report

Scope: discovery only. This report isolates the current high-risk runtime consumers of interview-derived truth.

## Risk Rules Applied

### High Risk

Used when the consumer:

- reads legacy metadata directly
- merges multiple authority sources locally
- writes based on consumed authority data
- reads unresolved business-mode sources
- is a route or service with multiple downstream consumers

### Medium Risk

Used when the consumer:

- reads via a service with fallback logic
- depends on inferred profile or context
- is active but more isolated

### Low Risk

No significant low-risk cluster was found in this audit. Most active consumers either depend on legacy fallback, sit on a shared service boundary, or use unresolved business-mode sources.

## 1. High-Risk Consumers

| Consumer | Why High Risk | Current Read Pattern | Target Projection |
| --- | --- | --- | --- |
| `src/app/api/v1/brand-builder/profile/route.ts` | direct legacy metadata read/write API, shared by multiple UI surfaces | `metadata.brand_profile` only | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/app/api/v1/brand-builder/guide-progress/route.ts` | direct metadata read/write plus mission side effects | `metadata.brand_profile.setup_progress` | `BusinessContextSnapshot` |
| `src/app/api/v1/brand-builder/bio/generate/route.ts` | direct metadata fallback route used by downstream UI | request `brand_profile` or `metadata.brand_profile` | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/app/api/v1/brand-builder/bio/regenerate/route.ts` | same as above with regeneration path | request `brand_profile` or `metadata.brand_profile` | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/app/api/v1/brand-builder/username/generate/route.ts` | direct metadata fallback route | request `brand_profile` or `metadata.brand_profile` | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/app/api/v1/brand-builder/username/regenerate/route.ts` | same as above | request `brand_profile` or `metadata.brand_profile` | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/app/(auth)/brand-builder/calendar/page.tsx` | local merge of canonical and legacy authority | `metadata.brand_profile` + `brandDnaService.getBrandDNA()` | `BusinessContextSnapshot` |
| `src/modules/brand-dna/services/brandDnaService.ts` | high fan-out canonical bridge with metadata fallback and mirror writes | `BrandProfile` primary, `metadata.brand_profile` fallback, `BrandInterview.extractedProfile` regen input | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/brand-dna/services/BrandContextProvider.ts` | high fan-out downstream context provider with metadata fallback | `BrandProfile` primary, `metadata.brand_profile` fallback | `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/member/services/onboarding-service.ts` | competing audience and positioning truth source outside interview chain | `metadata.goals`, `metadata.target_audience`, `metadata.brand_positioning` | `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/components/funnel-operating-system/useFunnelPreference.ts` | business mode from localStorage, no interview authority | `localStorage['nextshift.currentFunnel']` | `BusinessModeSnapshot` |
| `src/app/api/v1/funnel-os/route.ts` | business mode from request query param, shared downstream | `?type=` query param | `BusinessModeSnapshot` |
| `src/modules/funnel/services/funnel-context-provider.ts` | business-mode defaults + metadata + brand context merge | local defaults + metadata + `getBrandContext()` | `BusinessModeSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/app/api/v1/funnel-context/route.ts` | route consumer of unresolved business-mode chain | `getAllFunnelContexts()` | `BusinessModeSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/brand-builder/components/wizard/InterviewStepClient.tsx` | reads interview runtime then PATCHes legacy profile API | interview APIs + `/brand-builder/profile` | `InterviewProfileSnapshot`, `AudienceSnapshot`, `BusinessContextSnapshot` |
| `src/modules/brand-discovery/hooks/useBrandDiscovery.ts` | active consumer of live interview state and extracted completion state | `/brand-builder/interview`, `answers.__dialogue`, `status` | `InterviewProfileSnapshot`, `AudienceSnapshot` |

## 2. Medium-Risk Consumers

These consumers are active, but they are less risky because they already read through a shared service boundary rather than touching legacy profile metadata directly.

- `contentEngineService`
- `contentCalendarService`
- `contentInsightsService`
- `videoScriptService`
- `socialSetupService`
- `leadMagnetService`
- `webinarService`
- `trafficEngineService`
- `crmCenterService`
- `analyticsService`
- `whatsappService`
- `funnelBuilderService`
- `ceoAdvisorEngine`
- `content-director` agent
- `brand-strategist` agent
- `brand-health-projection`
- `brand-advisor-projection`
- `videoFinalizeService`
- `videoStrategyService`

Common risk reason:

- they consume `getBrandContext()` or `brandDnaService`, and those boundaries still include metadata fallback or inferred/derived data

## 3. Legacy Metadata Consumer Cluster

Direct runtime consumers of `User.metadata.brand_profile` or `brand_profile` payloads:

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

This is the strongest direct-retention cluster found in the audit.

## 4. Business Mode Consumer Cluster

Current runtime business-mode consumers:

- `useFunnelPreference()`
- `FunnelOperatingCenter`
- `FunnelSelector`
- `useFunnelOperatingData()`
- `/api/v1/funnel-os`
- `getFunnelContext()`
- `/api/v1/funnel-context`

Risk reason:

- none of these consumers currently read from interview-derived or canonical business-mode truth
- they rely on local storage, query params, hard-coded defaults, and metadata overlays

## 5. Migration Risk by Consumer Shape

### Shape A: direct metadata page readers

Risk: high
Reason:

- page boot depends on metadata shape
- no canonical adapter in the page

### Shape B: legacy helper API readers

Risk: high
Reason:

- route is shared by multiple components
- route often writes based on consumed truth

### Shape C: shared canonical service with fallback

Risk: high to medium
Reason:

- changing service semantics affects many downstream consumers at once

### Shape D: interview runtime consumers

Risk: high
Reason:

- they consume live session state and extracted results directly
- they are closest to the current source truth

### Shape E: business-mode consumers

Risk: high
Reason:

- no stable authority exists behind them

## 6. Consumer Risk Conclusion

The consumer migration risk is concentrated in four hubs:

1. `brand-builder/profile` API and legacy metadata pages
2. `brandDnaService`
3. `BrandContextProvider`
4. the entire funnel/business-mode chain

The single riskiest page-level consumer is:

- `src/app/(auth)/brand-builder/calendar/page.tsx`

The single riskiest route-level consumer is:

- `src/app/api/v1/brand-builder/profile/route.ts`

The single riskiest service-level consumer is:

- `src/modules/brand-dna/services/brandDnaService.ts`

The single riskiest unresolved domain is:

- business mode
