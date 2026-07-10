# Interview Authority Read / Write Authority Map

Scope: discovery only. This map records which runtime writes authority values, and which runtime reads authority values today.

## 1. InterviewProfileSnapshot

### Current write authority

| Runtime | Writes | Notes |
| --- | --- | --- |
| `brandInterviewService.create()` | `BrandInterview.answers` | creates live interview record |
| `brandInterviewService.saveAnswer()` | `BrandInterview.answers[questionId]` | raw text interview answers |
| `brandInterviewService.sendDialogueMessage()` | `BrandInterview.answers.__dialogue` | live dialogue authority |
| `brandInterviewService.extractBrandProfile()` | `BrandInterview.extractedProfile` | extraction output authority |
| `brandInterviewService.confirmProfile()` | `BrandInterview.extractedProfile`, `metadata.brand_profile`, `BrandProfile` | confirmation duplicates into both long-lived stores |
| `brand-builder/profile` PATCH API | `metadata.brand_profile` | legacy direct-write authority |
| `brandDnaService.saveBrandDNA()` | `BrandProfile`, `metadata.brand_profile` | canonical structured write + backward mirror |

### Current read authority

| Runtime | Reads | Notes |
| --- | --- | --- |
| interview UI consumers | `BrandInterview.answers`, `BrandInterview.extractedProfile` | live session surfaces |
| `brandDnaService.getBrandDNA()` | `BrandProfile`, fallback `metadata.brand_profile` | canonical structured reads |
| legacy builder pages | `metadata.brand_profile` | bypass canonical table |

### Actual current winner

- live session: `BrandInterview.answers`
- confirmed downstream: `BrandProfile` for canonical services, `metadata.brand_profile` for legacy pages

## 2. AudienceSnapshot

### Current write authority

| Runtime | Writes | Notes |
| --- | --- | --- |
| `brandInterviewService.sendDialogueMessage()` | dialogue slot `preferred_audience` inside `answers.__dialogue.slots` | slot-level audience capture |
| `brandInterviewService.extractBrandProfile()` | `extractedProfile.target_audience`, `audience_pain_points` | inferred audience output |
| `brandInterviewService.confirmProfile()` | `BrandProfile.targetAudience`, `BrandProfile.audiencePainPoints`, mirrored metadata fields | confirmation write |
| `brandDnaService.saveBrandDNA()` | `BrandProfile` audience fields + metadata mirror | structured downstream write |
| `onboardingService.saveGoals()` | `metadata.goals.target_audience`, `metadata.target_audience` | competing side-channel write |

### Current read authority

| Runtime | Reads | Notes |
| --- | --- | --- |
| `BrandContextProvider` | `BrandProfile`, fallback metadata | downstream audience read hub |
| `brandDnaService.getBrandDNA()` | `BrandProfile`, fallback metadata | canonical audience reader |
| `brand-health-projection` | `BrandProfile`, fallback metadata | projection reader |
| onboarding overview and onboarding flows | onboarding metadata | side-channel audience reader |

### Actual current winner

- canonical service-backed consumers: `BrandProfile`
- onboarding flows: onboarding metadata

There is no single runtime winner across all consumers.

## 3. BusinessContextSnapshot

### Current write authority

| Runtime | Writes | Notes |
| --- | --- | --- |
| `brandInterviewService.extractBrandProfile()` | extracted `positioning`, `content_pillars`, `recommended_platforms`, etc. | inferred context output |
| `brandInterviewService.confirmProfile()` | `BrandProfile` + `metadata.brand_profile` | confirmation write |
| `brandDnaService.saveBrandDNA()` | `BrandProfile` + `metadata.brand_profile` | structured canonical write |
| `brand-builder/profile` PATCH API | `metadata.brand_profile` | legacy direct write |
| `onboardingService.saveBrandPositioning()` | `metadata.brand_positioning` | separate positioning authority |

### Current read authority

| Runtime | Reads | Notes |
| --- | --- | --- |
| `BrandContextProvider` | `BrandProfile`, fallback metadata | main downstream context read hub |
| `brandDnaService.getBrandDNA()` | `BrandProfile`, fallback metadata | structured context reader |
| `brand-health-projection` | `BrandProfile`, fallback metadata | projection reader |
| `brand-builder/calendar/page.tsx` | `brandDnaService.getBrandDNA()` + `metadata.brand_profile` | local merge reader |
| onboarding overview | `metadata.brand_positioning` | separate read authority |

### Actual current winner

- canonical service-backed consumers: `BrandProfile`
- calendar page specific fields: legacy metadata can override canonical values
- onboarding overview: `metadata.brand_positioning`

## 4. BusinessModeSnapshot

### Current write authority

| Runtime | Writes | Notes |
| --- | --- | --- |
| `useFunnelPreference().setFunnelType()` | `localStorage['nextshift.currentFunnel']` | client preference write |
| metadata custom funnel contexts | `metadata.funnel_contexts` | optional per-mode overrides |

### Current read authority

| Runtime | Reads | Notes |
| --- | --- | --- |
| `useFunnelPreference()` | `localStorage['nextshift.currentFunnel']` | client-side mode read |
| `/api/v1/funnel-os` | query param `type` | request-scoped mode read |
| `getFunnelContext()` | explicit `funnelType` arg + metadata overrides + defaults | service-level mode/context read |
| `content-pillar-service` | `brandContext.industry` heuristic | indirect mode-like read |

### Actual current winner

No single winner.

Current runtime is split by consumer:

- UI winner: localStorage
- API winner: query param
- service winner: explicit function argument
- context fallback: hard-coded defaults

`NO CANONICAL AUTHORITY`

## 5. Read / Write Authority Summary

| Projection | Current Write Authority | Current Read Authority | Runtime Status |
| --- | --- | --- | --- |
| `InterviewProfileSnapshot` | `brandInterviewService`, `brand-builder/profile` API, `brandDnaService` | interview UI, `brandDnaService`, legacy builder pages | split by phase and consumer |
| `AudienceSnapshot` | `brandInterviewService`, `brandDnaService`, `onboardingService` | `BrandContextProvider`, `brandDnaService`, onboarding flows | competing authorities |
| `BusinessContextSnapshot` | `brandInterviewService`, `brandDnaService`, profile API, onboarding service | `BrandContextProvider`, `brandDnaService`, calendar page, onboarding overview | canonical + legacy + side-channel |
| `BusinessModeSnapshot` | localStorage setter, metadata custom context writes | localStorage, query param, explicit arg, defaults | no canonical authority |

## 6. Final Map

The nearest thing to a current read/write authority hierarchy is:

1. interview capture writes into `BrandInterview`
2. confirmation writes into both `BrandProfile` and `metadata.brand_profile`
3. canonical service readers usually prefer `BrandProfile`
4. legacy builder surfaces still read `metadata.brand_profile`
5. onboarding and business mode remain separate authority islands
