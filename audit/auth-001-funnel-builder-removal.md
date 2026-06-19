# AUTH-001 Funnel Builder Removal

Date: 2026-06-19

## Objective

Remove the legacy `/ai/funnel-builder` authority path so Brand DNA remains the single source of truth for audience, pain, offer, transformation, and goal.

## Changes

- Replaced `src/app/(auth)/ai/funnel-builder/page.tsx` with a server redirect to `/funnel-builder`.
- Added an explicit 302 redirect in `next.config.mjs` for `/ai/funnel-builder` -> `/funnel-builder`.
- Updated navigation and recommendation links from `/ai/funnel-builder` to `/funnel-builder`.
- Deleted the old AI funnel builder strategy endpoint at `src/app/api/v1/ai/funnel-builder/build-strategy/route.ts`.
- Deleted old page-only client helpers:
  - `src/modules/funnel/hooks/use-funnel-form.ts`
  - `src/modules/funnel/services/funnel-builder-api.ts`
- Updated funnel editor AI copy generation to derive context from the current funnel instead of asking for audience/offer again.
- Added redirect coverage in `src/__tests__/api/auth-001-funnel-builder-redirect.test.ts`.

## Updated Links

- `src/app/(auth)/ai/coach/page.tsx`
- `src/components/layouts/Sidebar.tsx`
- `src/modules/mission/constants/sidebar-config.ts`
- `src/modules/dashboard/components/TodaysActionCard.tsx`
- `src/modules/dashboard/components/AiRecommendationPanel.tsx`
- `src/modules/mission-engine/missionStages.ts`
- `src/modules/funnel/services/funnel-health-service.ts`
- `src/app/(auth)/funnel/[id]/edit/page.tsx`
- `src/modules/funnel/components/AIFunnelCopyButton.tsx`

## Expected Authority Chain

Interview Authority -> Brand DNA -> Lead Magnet -> Landing Page -> Canonical Funnel Builder

## Verification Targets

- `/ai/funnel-builder` redirects to `/funnel-builder`.
- `grep -RIn "ai/funnel-builder" src` only returns the redirect page or no active consumer references.
- No visible legacy funnel UI asks users to re-enter business type, audience, pain, transformation, or funnel goal.

## Verification Results

- `grep -RIn "ai/funnel-builder" src`: no output.
- `pnpm exec vitest run src/__tests__/api/auth-001-funnel-builder-redirect.test.ts`: passed.
- `pnpm type-check`: passed.
