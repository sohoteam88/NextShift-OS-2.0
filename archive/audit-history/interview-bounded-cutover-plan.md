# Interview Authority Bounded Consumer Cutover Plan

Source task: `P1-004_BOUNDED_INTERVIEW_CONSUMER_CUTOVER_PLAN`

Status: planning only. No implementation was performed.

## Decision

Proceed with a bounded Interview Authority consumer cutover plan for Brand Builder read-only profile and guide surfaces only.

Do not cut over Dashboard, Journey, Business State, BrandContextProvider, Brand DNA, AI COO, Growth Loop, or onboarding write paths.

## Approved Scope

The first bounded migration may only touch these candidates:

| Consumer | Current Source | Target Source | Risk | Cutover Notes |
| --- | --- | --- | --- | --- |
| `src/app/(auth)/brand-builder/profile/page.tsx` | `metadata.brand_profile` | `InterviewAuthorityService` through ViewModel adapter | Low | Server page can hydrate the same `initialProfile` shape from InterviewAuthority. |
| `src/app/(auth)/brand-builder/step/profile/page.tsx` | `metadata.brand_profile` plus wizard state | `InterviewAuthorityService` through ViewModel adapter | Low | Keep `getWizardState()` and `interviewId` unchanged. |
| `src/app/(auth)/brand-builder/step/accounts/page.tsx` | `metadata.brand_profile` | `InterviewAuthorityService` through ViewModel adapter | Low | Hydrate `AccountsStepClient` with same `brandProfile` prop shape. |
| `src/app/(auth)/brand-builder/step/guides/page.tsx` | `metadata.brand_profile` | `InterviewAuthorityService` through ViewModel adapter | Low | Preserve `platforms`, `phone`, and `funnelUrl` fallbacks. |
| `src/app/(auth)/brand-builder/step/strategy/page.tsx` | `metadata.brand_profile` | `InterviewAuthorityService` through ViewModel adapter | Low | Hydrate strategy UI only; keep PATCH write path unchanged. |
| `src/app/(auth)/brand-builder/guides/page.tsx` | `metadata.brand_profile` | `InterviewAuthorityService` through ViewModel adapter | Low | Preserve no-profile empty state behavior. |
| `src/modules/brand-builder/components/PlatformGuideStep.tsx` | `brandProfile` prop | `BrandBuilderProfileViewModel` prop | Low | Component can remain prop-driven; parent supplies same shape. |
| `src/modules/brand-builder/components/guides/FacebookGuide.tsx` | `brandProfile` prop | `BrandBuilderProfileViewModel` prop | Low | Needs `username`, `identity`, and `bios.facebook`. |
| `src/modules/brand-builder/components/guides/InstagramGuide.tsx` | `brandProfile` prop | `BrandBuilderProfileViewModel` prop | Low | Needs `username`, `identity`, and `bios.instagram`. |
| `src/modules/brand-builder/components/ContentStrategyStep.tsx` | `brandProfile` prop | `BrandBuilderProfileViewModel` prop | Medium | Approved only for read hydration. Its existing PATCH to `/api/v1/brand-builder/profile` must not change in the bounded cutover. |

## Explicitly Out Of Scope

- `src/modules/dashboard/hooks/useDashboardMission.ts`
- `src/modules/journey/utils/getNextJourneyAction.ts`
- `src/modules/mission-engine/services/mission-service.ts`
- `src/modules/evolution/**`
- `src/modules/activation/**`
- `src/modules/brand-dna/services/BrandContextProvider.ts`
- `src/modules/brand-dna/services/brandDnaService.ts`
- `src/modules/brand-intelligence/**`
- `src/modules/member/services/onboarding-service.ts`
- Any `src/app/api/v1/member/onboarding/**` route
- Any BrandInterview write route
- Any BrandProfile or `metadata.brand_profile` write path
- AI recommendation or generation surfaces
- Business mode, funnel type, journey, or dashboard decision logic

## Target Flow

Current:

```text
metadata.brand_profile
  -> route/page
  -> brandProfile prop
  -> UI
```

Target:

```text
InterviewAuthorityService.getInterviewAuthority(userId)
  -> InterviewAuthority
  -> BrandBuilderProfileViewModel adapter
  -> existing brandProfile-compatible prop
  -> UI
```

The UI should not consume raw `InterviewAuthority` directly in the first bounded cutover. A view-model adapter must preserve the legacy prop shape expected by the current UI.

## Required ViewModel Contract

Create a local Brand Builder view model adapter in the implementation PR. Recommended location:

`src/modules/brand-builder/adapters/InterviewAuthorityBrandProfileViewModel.ts`

Suggested exported API:

```ts
export type BrandBuilderProfileViewModel = Record<string, unknown>;

export function toBrandBuilderProfileViewModel(
  authority: InterviewAuthority,
  legacyProfile?: Record<string, unknown> | null,
): BrandBuilderProfileViewModel;
```

The adapter must output the fields current approved consumers expect:

| ViewModel Field | Source Priority | Used By |
| --- | --- | --- |
| `identity` | `authority.profile.professionalRole`, fallback legacy `identity` | FacebookGuide, InstagramGuide, profile UI |
| `personalName` | `authority.profile.fullName`, fallback legacy `personalName` | profile UI |
| `brandName` | `authority.profile.professionalRole`, fallback legacy `brandName` | profile UI |
| `positioning` | `authority.profile.missionStatement`, fallback legacy `positioning` | profile/strategy UI |
| `target_audience` | `authority.audience.primaryAudience`, fallback legacy `target_audience` | profile/strategy UI |
| `audience_pain_points` | `authority.audience.audienceProblems`, fallback legacy `audience_pain_points` | profile UI |
| `audienceGoals` | `authority.audience.audienceGoals`, fallback legacy `audienceGoals` | profile UI |
| `audienceObjections` | `authority.audience.audienceObjections`, fallback legacy `audienceObjections` | profile UI |
| `primaryOffer` | `authority.businessContext.primaryOffer`, fallback legacy `primaryOffer` | strategy/profile UI |
| `contentPillars` | legacy `contentPillars` first, fallback derived from `authority.profile.primarySkills` | ContentStrategyStep |
| `contentStrategy` | legacy `contentStrategy` only | ContentStrategyStep |
| `platforms` | legacy `platforms` first, fallback `authority.audience.audienceChannels`, fallback route defaults | guide pages |
| `username` | legacy `username` only | FacebookGuide, InstagramGuide |
| `bios` | legacy `bios` only | FacebookGuide, InstagramGuide |
| `funnelUrl` | legacy `funnelUrl` only, or existing latest funnel lookup | guides |
| `source` | `InterviewAuthority` source metadata | diagnostics only |

Important: preserve legacy-only fields by merging legacy profile into the ViewModel. InterviewAuthority does not currently own username, bios, guide progress, funnel URL, or content strategy.

## Implementation Sequence For Next PR

1. Add the Brand Builder ViewModel adapter.
2. Add focused unit coverage for the adapter if local test setup supports it.
3. Cut over one server page first: `src/app/(auth)/brand-builder/profile/page.tsx`.
4. Verify `ProfilePageClient` receives a prop compatible with existing legacy shape.
5. Cut over the remaining server pages in this order:
   - `src/app/(auth)/brand-builder/step/profile/page.tsx`
   - `src/app/(auth)/brand-builder/step/accounts/page.tsx`
   - `src/app/(auth)/brand-builder/step/strategy/page.tsx`
   - `src/app/(auth)/brand-builder/step/guides/page.tsx`
   - `src/app/(auth)/brand-builder/guides/page.tsx`
6. Keep `PlatformGuideStep`, `FacebookGuide`, `InstagramGuide`, and `ContentStrategyStep` prop-driven unless the prop name change is necessary.
7. Do not modify `/api/v1/brand-builder/profile` or `/api/v1/brand-builder/guide-progress`.
8. Run `pnpm type-check`.
9. Manually inspect these authenticated routes:
   - `/brand-builder/profile`
   - `/brand-builder/step/profile`
   - `/brand-builder/step/accounts`
   - `/brand-builder/step/strategy`
   - `/brand-builder/step/guides`
   - `/brand-builder/guides`

## Guardrails

The bounded implementation must satisfy all of these:

- No runtime writes are changed.
- No API route write behavior is changed.
- No Dashboard import of InterviewAuthority.
- No Journey import of InterviewAuthority.
- No BrandContextProvider import of InterviewAuthority.
- No Brand DNA service import of InterviewAuthority.
- No onboarding service import of InterviewAuthority.
- No AI generation or recommendation surface import of InterviewAuthority.
- No business mode or funnel type decision changes.
- No metadata retirement.
- No schema or migration changes.

## Fallback Policy

The bounded cutover must remain visually stable for users with partial data.

Use this fallback order inside the ViewModel adapter:

1. InterviewAuthority field when non-empty.
2. Existing legacy `metadata.brand_profile` field when non-empty.
3. Existing page/component default.
4. Empty string or empty array only when current UI already tolerates it.

This keeps legacy-only assets like `username`, `bios`, `platforms`, `contentStrategy`, `funnelUrl`, and guide progress available while the read source for profile/audience identity begins moving to InterviewAuthority.

## Rollback Plan

Rollback must be a one-file-per-page reversal:

1. Replace the page read with the previous `prisma.user.findUnique({ select: { metadata: true } })`.
2. Restore `const brandProfile = (meta.brand_profile as Record<string, unknown>) ?? {}` or `null` as originally used.
3. Leave ViewModel adapter file unused but do not delete it unless rollback is permanent.
4. No database rollback is required because the bounded migration is read-only.

## Verification Checklist

For the implementation PR, verify:

- `pnpm type-check` passes.
- `/brand-builder/profile` renders the same profile editor state.
- `/brand-builder/step/profile` preserves `interviewId`.
- `/brand-builder/step/accounts` still receives generated `username`/`bios` from legacy profile when present.
- `/brand-builder/step/strategy` keeps existing content pillars and content strategy.
- `/brand-builder/step/guides` keeps platform defaults and phone/funnel values.
- `/brand-builder/guides` preserves the no-profile empty state or renders the guide when profile data exists.
- Facebook and Instagram guides still copy the same username and bio values.
- Completing guide progress still calls `/api/v1/brand-builder/guide-progress`.
- Confirming content strategy still calls `/api/v1/brand-builder/profile`.

## Exit Criteria

The bounded implementation is complete only when:

- All approved scope consumers read through the ViewModel adapter or remain prop-driven behind migrated parents.
- Existing write paths are untouched.
- Blocked consumers remain untouched.
- UI behavior is unchanged for users with full legacy profiles.
- UI behavior degrades safely for users with only partial InterviewAuthority data.

## Next Eligible Work

Eligible:

- `P1-005_BOUNDED_INTERVIEW_CONSUMER_CUTOVER_IMPLEMENTATION`

Not eligible:

- Dashboard cutover
- Journey cutover
- Business State cutover
- BrandContextProvider replacement
- Brand DNA write-path migration
- Legacy metadata retirement
