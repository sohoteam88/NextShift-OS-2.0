# Interview Authority Source Summary

Scope: discovery only. This summary records the current runtime reality of interview-related authority in the repo.

## Executive Summary

The current system does not have a single interview authority. It has a chained runtime with multiple overlapping persistence and read models:

1. live interview session truth in `BrandInterview.answers`
2. extracted interview profile truth in `BrandInterview.extractedProfile`
3. confirmed structured profile truth in `BrandProfile`
4. legacy mirrored profile truth in `User.metadata.brand_profile`
5. side-channel audience/context truth in onboarding metadata
6. unresolved business-mode truth outside the interview chain

## Current Runtime Precedence

### A. Interview extraction input precedence

Inside `src/modules/brand-builder/services/brand-interview-service.ts`, extraction currently prefers:

1. `answers.__dialogue.messages`
2. `voiceProfile.transcript`
3. raw `answers`

This means the authoritative capture source for interview understanding is the dialogue transcript when it exists.

### B. Downstream brand/profile context precedence

Across `brandDnaService`, `BrandContextProvider`, and brand intelligence projections, the current read precedence is:

1. `BrandProfile`
2. `User.metadata.brand_profile`

This is the closest thing to a current canonical read rule.

### C. Legacy page-level exceptions

Some routes and pages still bypass canonical reads and consume `metadata.brand_profile` directly. The clearest runtime conflict found in this audit is:

- `src/app/(auth)/brand-builder/calendar/page.tsx`

That page reads both canonical brand DNA and legacy metadata, then merges them in the page itself.

## Source Classification

### Interview facts

Primary active fact sources:

- `BrandInterview.answers`
- `BrandInterview.answers.__dialogue`
- `BrandProfile` confirmed user/profile fields
- onboarding metadata fields such as `metadata.goals.target_audience`

### Interview-derived inferences

Primary active inference sources:

- `BrandInterview.extractedProfile`
- slot completeness and confidence helpers
- industry-based downstream inference

### Strategy outputs

Primary active strategy sources:

- `BrandProfile` structured brand strategy fields
- `metadata.brand_profile`
- `metadata.brand_positioning`
- derived DNA outputs from `brandDnaGenerator`

## Projection Mapping

### `InterviewProfileSnapshot`

Best current source candidates:

- `BrandInterview.answers`
- `BrandInterview.extractedProfile`
- confirmed profile writes in `BrandProfile`
- legacy mirror in `metadata.brand_profile`

### `AudienceSnapshot`

Best current source candidates:

- dialogue slot `preferred_audience`
- extracted fields `target_audience`, `audience_pain_points`
- `BrandProfile.targetAudience`
- onboarding audience metadata

### `BusinessContextSnapshot`

Best current source candidates:

- extracted `positioning`, `content_pillars`, `recommended_platforms`, `recommended_frequency`
- `BrandProfile` messaging/content/offer fields
- `metadata.brand_profile`
- `metadata.brand_positioning`

### `BusinessModeSnapshot`

Current state: unresolved.

No interview-owned canonical source was found. Current mode-like sources are split across:

- query param `type`
- localStorage funnel preference
- static funnel context defaults
- downstream industry heuristics

## Duplicate Authority Findings

### Profile

Profile truth is duplicated across:

- `BrandInterview.extractedProfile`
- `BrandProfile`
- `User.metadata.brand_profile`

### Audience

Audience truth is duplicated across:

- interview slots
- extracted profile fields
- `BrandProfile`
- onboarding metadata

### Business Context

Business context truth is duplicated across:

- extracted interview strategy fields
- `BrandProfile`
- `metadata.brand_profile`
- onboarding positioning metadata
- page-level merges

### Business Mode

Business mode is fragmented rather than mirrored. It currently behaves as a multi-source unresolved cluster.

## Active vs Legacy Assessment

### Clearly active

- `src/modules/brand-builder/services/brand-interview-service.ts`
- `src/app/api/v1/brand-builder/interview/**`
- `src/modules/brand-builder/components/wizard/InterviewStepClient.tsx`
- `src/modules/brand-discovery/hooks/useBrandDiscovery.ts`
- `src/app/api/v1/brand-builder/profile/route.ts`
- `src/modules/brand-dna/services/brandDnaService.ts`
- `src/modules/brand-dna/services/BrandContextProvider.ts`
- `src/modules/member/services/onboarding-service.ts`

### Active but legacy-shaped

- `User.metadata.brand_profile`
- metadata-only profile PATCH route
- onboarding metadata audience/positioning writes
- page-level legacy merges

### Unresolved

- business mode ownership
- final future precedence between confirmed interview data and onboarding side-channel data

## Audit Conclusion

The current repo already contains enough runtime material to define a future interview authority, but today it is still split across:

1. session capture
2. extraction output
3. canonical structured profile storage
4. legacy mirrored metadata storage
5. side-channel onboarding metadata
6. unresolved business-mode sources

The strongest current authority path is:

`BrandInterview.answers -> BrandInterview.extractedProfile -> confirmProfile() -> BrandProfile`

But that path is not exclusive, because the runtime still permits competing writes into `metadata.brand_profile` and separate onboarding audience/context metadata.
