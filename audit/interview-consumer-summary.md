# Interview Authority Consumer Summary

Source task: `P1-003_INTERVIEW_CONSUMER_AUDIT`

## Readiness Answer

`READY FOR BOUNDED CUTOVER`

Interview Authority is not ready for full cutover, but it is ready for a bounded P1-004 cutover plan because the audit identified a narrow set of low-risk, read-only consumers.

## Why Bounded Cutover Is Possible

Low-risk candidates are mostly Brand Builder display/hydration surfaces and guide components that read profile/audience data but do not:

- choose dashboard state,
- choose journey state,
- choose business mode,
- generate strategic recommendations,
- write BrandProfile,
- write `metadata.brand_profile`,
- write onboarding metadata.

Best bounded starting points:

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

## Why Full Cutover Is Not Ready

High-risk and blocked consumers still control critical behavior:

- `BrandContextProvider` is a shared provider with direct `BrandProfile` plus `metadata.brand_profile` fallback.
- Brand interview confirmation writes `BrandInterview.extractedProfile`, `BrandProfile`, and `metadata.brand_profile`.
- `brandDnaService` reads/writes canonical and legacy profile data and reads `BrandInterview.extractedProfile`.
- Onboarding service owns `metadata.onboarding`, goals, target audience, brand positioning, and first content/funnel setup.
- Dashboard, journey, mission, activation, and evolution projections use brand interview/DNA completion flags to choose next actions and levels.
- CEO advisor, content director, funnel strategy, and other AI surfaces generate recommendations or business outputs from BrandContext.

## Migration Guidance For P1-004

P1-004 should be a bounded cutover plan, not an implementation PR for broad runtime migration.

Recommended boundary:

1. Cut over only read-only Brand Builder display/hydration consumers.
2. Keep writes on existing BrandInterview/BrandProfile/metadata paths.
3. Do not import InterviewAuthority into dashboard, journey, mission, evolution, onboarding, BrandContextProvider, Brand DNA service, or AI recommendation surfaces.
4. Add fallback-safe view-model mapping if needed so UI fields remain stable.
5. Validate that visible UI is unchanged after cutover.

## Exit Gate

Eligible for:

- `P1-004_BOUNDED_INTERVIEW_CONSUMER_CUTOVER_PLAN.md`

Not eligible for:

- Dashboard cutover
- Business State cutover
- Journey cutover
- Legacy retirement
- BrandContextProvider replacement
- Brand DNA write-path migration
