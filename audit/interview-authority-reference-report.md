# Interview Authority Reference Report

Source task: `P1-006_INTERVIEW_AUTHORITY_POST_CUTOVER_AUDIT`

Purpose: enumerate current post-cutover Interview Authority references and confirm they align with the approved migration model.

## Approved Read Chain

```text
InterviewAuthorityService.getInterviewAuthority(userId)
  -> InterviewAuthority
  -> toBrandBuilderProfileViewModel()
  -> getBrandBuilderProfileViewModel(userId)
  -> approved Brand Builder pages
  -> existing UI props
```

## Service References

| File | Reference | Status |
| --- | --- | --- |
| `src/modules/interview-authority/services/InterviewAuthorityService.ts` | `getInterviewAuthority(userId)` | Existing authority service from P1-002. |
| `src/modules/brand-builder/adapters/InterviewAuthorityBrandProfileViewModel.ts` | imports `getInterviewAuthority` | Approved bounded consumer entrypoint. |
| `src/modules/brand-builder/adapters/InterviewAuthorityBrandProfileViewModel.ts` | imports `InterviewAuthority` type | Approved contract reference. |

## ViewModel References

| File | Reference | Status |
| --- | --- | --- |
| `src/modules/brand-builder/adapters/InterviewAuthorityBrandProfileViewModel.ts` | `toBrandBuilderProfileViewModel(authority, legacyProfile)` | Approved ViewModel adapter. |
| `src/modules/brand-builder/adapters/InterviewAuthorityBrandProfileViewModel.ts` | `getBrandBuilderProfileViewModel(userId)` | Approved page-facing helper. |
| `src/modules/brand-builder/adapters/InterviewAuthorityBrandProfileViewModel.ts` | centralized `metadata.brand_profile` legacy preservation | Approved compatibility fallback for legacy-only fields. |

## Migrated Page References

| Page | Post-Cutover Reference | Direct `brand_profile` Read |
| --- | --- | --- |
| `src/app/(auth)/brand-builder/profile/page.tsx` | `getBrandBuilderProfileViewModel(user.id)` | No |
| `src/app/(auth)/brand-builder/step/profile/page.tsx` | `getBrandBuilderProfileViewModel(user.id)` | No |
| `src/app/(auth)/brand-builder/step/accounts/page.tsx` | `getBrandBuilderProfileViewModel(user.id)` | No |
| `src/app/(auth)/brand-builder/step/strategy/page.tsx` | `getBrandBuilderProfileViewModel(user.id)` | No |
| `src/app/(auth)/brand-builder/step/guides/page.tsx` | `getBrandBuilderProfileViewModel(user.id)` | No |
| `src/app/(auth)/brand-builder/guides/page.tsx` | `getBrandBuilderProfileViewModel(user.id)` | No |

## Prop-Driven Component References

These components remain prop-driven and were not changed by P1-005:

| Component | Status |
| --- | --- |
| `src/modules/brand-builder/components/PlatformGuideStep.tsx` | Receives `brandProfile` from migrated parent. |
| `src/modules/brand-builder/components/guides/FacebookGuide.tsx` | Receives `brandProfile` from `PlatformGuideStep`. |
| `src/modules/brand-builder/components/guides/InstagramGuide.tsx` | Receives `brandProfile` from `PlatformGuideStep`. |
| `src/modules/brand-builder/components/ContentStrategyStep.tsx` | Receives `brandProfile` from existing wizard clients. |

## Preserved Legacy Fields

The ViewModel adapter preserves these fields from legacy profile metadata when present:

- `username`
- `bios`
- `platforms`
- `contentStrategy`
- `funnelUrl`
- `guideProgress`

This is a compatibility fallback, not authority expansion.

## Blocked Reference Check

No P1-005 InterviewAuthority references were added to:

- `BrandContextProvider`
- `brandDnaService`
- Dashboard / `useDashboardMission`
- Journey
- Business State
- AI Coach
- CEO Advisor
- Growth Loop
- Onboarding write paths

## Reference Decision

`PASS`

All new Interview Authority references introduced by the cutover are contained inside the approved Brand Builder bounded read path.
