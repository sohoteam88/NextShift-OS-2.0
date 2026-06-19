# First-Time User Confusion Report

Date: 2026-06-19
Source spec: `FIRST_TIME_USER_AUDIT.md`

## Method

The requested test calls for observing 5 real users who have never seen NextShift OS. No live user recordings or session notes were provided in this environment, so this report uses a proxy audit:

- Code-level inspection of signup, login, onboarding, dashboard, journey, and brand-builder routes.
- First-time-user simulation across 5 beginner personas.
- Findings are tagged as inferred from source behavior rather than live human observation.

## Simulated Users

| User | First Click | Confusion Point | Stop Point | Ignored Buttons | Screens Not Understood |
| --- | --- | --- | --- | --- | --- |
| User 1: total beginner | `创建账号` | After signup, system previously sent user to `/dashboard`, before explaining first mission | Dashboard mission vs onboarding mismatch | Top navigation modules | Dashboard before first result |
| User 2: wants content fast | `生成内容` / Content Engine | Brand/profile context not guaranteed before content action | Content output feels disconnected | Journey progress | Dashboard and Content Engine relationship |
| User 3: wants brand clarity | `开始品牌访谈` | Brand Builder completion previously did not mark member onboarding `brand` step | Loop risk: onboarding returns to brand step | Skip | Why brand is not marked complete |
| User 4: wants leads | Funnel / first funnel | First funnel creation previously returned directly to dashboard with no completion summary | Dashboard transition after funnel creation | Open funnel | Whether funnel was created and where to see it |
| User 5: returning first-time user | Login | Login previously sent user to dashboard even if onboarding incomplete | User can land in app shell without completing setup | Onboarding resume | Which setup step remains |

## Primary Confusion Points

| Severity | Area | Confusion | Evidence | Status |
| --- | --- | --- | --- | --- |
| P0 | Signup | New user landed on dashboard instead of onboarding | `src/app/signup/page.tsx` routed to `/dashboard` | FIXED |
| P0 | Login | Returning incomplete user landed on dashboard instead of onboarding resume | `src/app/login/page.tsx` routed to `/dashboard` | FIXED |
| P0 | Dashboard | Member could access dashboard while onboarding was incomplete | `src/app/(auth)/dashboard/page.tsx` had no onboarding gate | FIXED |
| P0 | Brand Builder completion | Member onboarding `brand` step was not completed | Called non-existent `/api/v1/member/onboarding/complete-step` | FIXED |
| P1 | First funnel completion | User was returned to dashboard immediately after funnel creation | `first-funnel/page.tsx` routed to `/dashboard` | FIXED |
| P1 | Onboarding brand bridge | `/onboarding/brand` redirects into Brand Builder wizard | Intentional bridge, but completion depends on Brand Builder finish | MITIGATED |

## What Users Click First

Observed from available first-screen controls and simulated intent:

- Signup: `创建账号`
- Login: `登录`
- Dashboard: current mission CTA
- Activation dashboard: `开始`
- Onboarding profile: `下一步`
- Brand Builder: interview start / completion CTA

## Screens Likely Not Understood

- Dashboard shown before first onboarding result.
- Brand Builder wizard as a replacement for `/onboarding/brand`.
- First funnel success state before this fix, because there was no completion screen.
- Content Engine before profile/brand context exists.

## Recommendations

- Keep `/onboarding` as the first route after signup and login.
- Keep member dashboard gated until onboarding is complete.
- Treat Brand Builder completion as the source event for onboarding `brand`.
- Always show `/onboarding/complete` after the first funnel step, so users see what they created and what to do next.
