# Interview Authority Consumer Summary

Scope: discovery only. This summary records the current runtime consumer map for interview-derived truth.

## Executive Summary

Current runtime consumers do not read from a single interview authority. They read from four overlapping layers:

1. `BrandInterview` live session and extraction output
2. `BrandProfile` canonical structured storage
3. `User.metadata.brand_profile` legacy profile metadata
4. business-mode sources outside the interview chain

The most important consumer split is:

- interview UI consumers still depend on `BrandInterview`
- product services mostly depend on `BrandContextProvider` or `brandDnaService`
- brand-builder legacy pages and helper APIs still read `metadata.brand_profile` directly
- funnel/business-mode flows still depend on local storage, query params, and hard-coded defaults

## 1. Direct Consumers

### Direct reads of legacy profile metadata

These consumers read `metadata.brand_profile` directly:

- brand-builder pages:
  - `/brand-builder/step/profile`
  - `/brand-builder/profile`
  - `/brand-builder/step/accounts`
  - `/brand-builder/step/guides`
  - `/brand-builder/step/strategy`
  - `/brand-builder/guides`
  - `/brand-builder/calendar`
- brand-builder APIs:
  - `/api/v1/brand-builder/profile`
  - `/api/v1/brand-builder/guide-progress`
  - `/api/v1/brand-builder/bio/generate`
  - `/api/v1/brand-builder/bio/regenerate`
  - `/api/v1/brand-builder/username/generate`
  - `/api/v1/brand-builder/username/regenerate`
- canonical-read services with fallback:
  - `brandDnaService`
  - `BrandContextProvider`
  - `brand-health-projection`

### Direct reads of interview runtime state

These consumers directly depend on `BrandInterview` state or the interview APIs:

- `InterviewStepClient`
- `useBrandDiscovery`
- `TextInterview`
- `VoiceInterview`
- `BrandProfileStep`
- interview API routes under `/api/v1/brand-builder/interview/**`

### Direct reads of business-mode truth

These consumers read current business mode from unresolved sources:

- `useFunnelPreference()` from `localStorage['nextshift.currentFunnel']`
- `/api/v1/funnel-os` from request query `type`
- `getFunnelContext()` from hard-coded funnel defaults and metadata overrides

## 2. Indirect Consumers

Most downstream product modules no longer read `BrandInterview` or `metadata.brand_profile` themselves. They consume interview-derived truth through these service boundaries:

- `brandDnaService.getBrandDNA()`
- `getBrandContext()`
- `getBrandHealthSnapshot()`
- `getBrandAdvisorSnapshot()`

The biggest indirect consumer cluster is `getBrandContext()`. Current active consumers include:

- content engine
- content calendar
- content insights
- video strategy/finalize
- social setup
- lead magnet
- webinar center
- traffic engine
- CRM center
- funnel builder
- WhatsApp AI
- analytics
- AI agents
- CEO/business intelligence helpers
- blueprint generation

## 3. Consumers That Merge Multiple Authorities

The clearest mixed-authority consumer found in this audit is:

- `src/app/(auth)/brand-builder/calendar/page.tsx`

It reads:

1. `metadata.brand_profile`
2. `brandDnaService.getBrandDNA()`

Then merges them locally to build `brandProfile` and `hasStrategy`.

This is the most explicit page-level authority merge in current runtime.

There are also service-level merges:

- `brandDnaService.getBrandDNA()`
- `BrandContextProvider.getBrandContext()`
- `brand-health-projection.resolveBrandDNA()`
- `funnel-context-provider.getFunnelContext()`

## 4. Legacy Metadata Dependence

Legacy metadata is still a live runtime dependency, not dead compatibility code.

The most important direct dependencies are:

- profile edit/read APIs
- wizard/profile pages
- bio and username generation routes
- guide progress route
- calendar page

The most important indirect dependencies are:

- `brandDnaService` fallback
- `BrandContextProvider` fallback
- `brand-health-projection` fallback

Because those three services sit underneath many downstream modules, metadata fallback still affects large parts of runtime even when the caller appears canonical.

## 5. Business Mode Consumer State

Business mode is not interview-owned today.

Current consumer chain is:

1. `useFunnelPreference()` reads local storage
2. funnel UI passes `funnelType`
3. `/api/v1/funnel-os` reads `type` query param
4. `getFunnelContext()` overlays brand context with hard-coded per-mode defaults

This means `BusinessModeSnapshot` currently has no interview-backed source and no canonical read path.

## 6. Highest-Risk Consumer Groups

### Group A: direct metadata readers

These are high risk because migration changes would immediately affect page rendering and edit flows:

- brand-builder pages
- profile API
- bio/username APIs
- guide-progress API

### Group B: mixed-authority readers

These are high risk because they merge canonical and legacy truth locally:

- `brand-builder/calendar/page.tsx`
- `funnel-context-provider.ts`

### Group C: high fan-out service boundaries

These are high risk because many downstream modules depend on them:

- `brandDnaService`
- `BrandContextProvider`
- `brand-health-projection`

### Group D: unresolved business-mode readers

These are high risk because they have no interview-owned authority to migrate toward today:

- `useFunnelPreference()`
- `useFunnelOperatingData()`
- `/api/v1/funnel-os`
- `getFunnelContext()`
- `/api/v1/funnel-context`

## 7. Projection Mapping Summary

### `InterviewProfileSnapshot`

Best-fit consumers:

- interview UI and interview APIs
- profile edit flows
- `brandDnaService`
- `brand-strategist` agent

### `AudienceSnapshot`

Best-fit consumers:

- `BrandContextProvider` consumers
- onboarding audience flows
- health/advisor projections
- CRM, content, webinar, lead magnet, social setup

### `BusinessContextSnapshot`

Best-fit consumers:

- content engine
- social setup
- webinar, lead magnet, funnel builder
- traffic engine
- video strategy/finalize
- brand intelligence projections

### `BusinessModeSnapshot`

Best-fit consumers:

- funnel preference hook
- funnel operating center
- funnel OS route
- funnel context provider
- funnel context route

Current runtime source for this projection remains unresolved.

## 8. Audit Conclusion

The current consumer map is not centered on a single V7 interview authority. It is split like this:

- interview capture surfaces read `BrandInterview`
- canonical downstream surfaces mostly read `BrandContextProvider` or `brandDnaService`
- legacy builder surfaces still read `metadata.brand_profile`
- business-mode surfaces read non-interview sources

The practical runtime choke points are:

1. `brandDnaService`
2. `BrandContextProvider`
3. `brand-builder/profile` API
4. `useFunnelPreference` + `/api/v1/funnel-os` + `getFunnelContext`

Those are the key consumer hubs exposed by this audit.
