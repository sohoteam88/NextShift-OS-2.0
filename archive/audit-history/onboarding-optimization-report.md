# Onboarding Optimization Report

Date: 2026-06-19

## UX Diagnosis

Current problem:
First-time users had multiple ways to enter the dashboard before completing the guided setup.

User confusion risk:
They may see product modules before understanding their first mission or producing their first useful asset.

Decision fatigue source:
Dashboard navigation, activation plan, onboarding steps, and Brand Builder wizard all compete as "the next thing."

First success moment:
The user should complete a brand foundation, generate first content, and create or consciously skip a first funnel.

## Recommended Mission Flow

Today's mission:
Build your first business foundation.

Step 1:
Tell NextShift who you are and who you want to help.

Step 2:
Complete the Brand Builder interview.

Step 3:
Generate your first publish-ready content.

Step 4:
Create your first lead capture funnel or skip with intent.

Continue action:
Show `/onboarding/complete`, then transition to dashboard.

## Implemented Routing Changes

| Route / Component | Change |
| --- | --- |
| `src/app/signup/page.tsx` | Signup now sends users to `/onboarding` |
| `src/app/login/page.tsx` | Login now sends users to `/onboarding` |
| `src/app/(auth)/dashboard/page.tsx` | Member dashboard redirects incomplete onboarding users to `/onboarding` |
| `src/modules/brand-builder/components/wizard/CompleteStepClient.tsx` | Brand Builder completion now marks member onboarding `brand` step via existing PATCH API |
| `src/app/(auth)/onboarding/first-funnel/page.tsx` | First funnel create/skip now routes to `/onboarding/complete` |

## Screen-by-Screen Optimization Notes

| Screen | Where am I? | What should I do? | What happens next? | Primary Action |
| --- | --- | --- | --- | --- |
| Signup | Creating a workspace | Create account | Go to onboarding | `创建账号` |
| Onboarding profile | Step 1 of setup | Add basic contact/context | Choose goals | `下一步` |
| Onboarding goals | Step 2 of setup | Pick specialty, audience, goals | Start Brand Builder | `下一步` |
| Brand Builder wizard | Brand discovery | Finish interview and setup | Return to onboarding first content | `进入控制台` after completion |
| First content | First visible asset | Generate/save first content | Create first funnel | `保存内容` |
| First funnel | Lead capture setup | Create or intentionally skip funnel | See completion summary | `创建漏斗` / `跳过` |
| Complete | Result summary | Review created assets | Enter dashboard | `Go Dashboard` |

## Anti-Blank-Dashboard Rules

- Do not show dashboard to incomplete member users.
- Do not use dashboard activation as a replacement for onboarding.
- Do not send first-time users to module navigation before the first asset.
- Do not complete Brand Builder without updating member onboarding state.
- Do not return users to dashboard immediately after first funnel creation.

## Next Recommended Improvements

- Add copy on `/onboarding/brand` explaining: "Next step opens Brand Builder, then you will return to first content."
- Reduce profile step friction by making avatar optional and visually secondary.
- Add "Why we ask this" helper copy on goals.
- Auto-generate first content immediately if enough brand data exists.
- Track analytics events: `signup_completed`, `onboarding_started`, `profile_completed`, `goals_completed`, `brand_completed`, `first_content_saved`, `first_funnel_created`, `onboarding_completed`.

## First Screen To Improve Next

`/onboarding/brand`: replace the invisible redirect with a clear bridge screen or inline handoff message before entering Brand Builder.
