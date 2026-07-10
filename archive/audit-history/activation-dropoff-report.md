# Activation Dropoff Report

Date: 2026-06-19

## Activation Funnel

Current intended first-time flow:

1. Signup or login
2. `/onboarding`
3. Profile
4. Goals
5. Brand Builder wizard
6. First content
7. First funnel
8. Completion screen
9. Dashboard activation plan

## Dropoff Points

| Severity | Step | Dropoff Cause | Impact | Status |
| --- | --- | --- | --- | --- |
| P0 | Signup -> Dashboard | New user bypassed onboarding | User sees app before first guided result | FIXED |
| P0 | Login -> Dashboard | Incomplete returning user bypassed onboarding resume | User can forget setup state and click unrelated modules | FIXED |
| P0 | Dashboard access | Dashboard did not check member onboarding completion | First-time users could enter feature navigation early | FIXED |
| P0 | Brand completion | Brand Builder completion used a non-existent onboarding API route | `brand` onboarding step could remain incomplete | FIXED |
| P1 | First funnel -> Dashboard | Funnel creation jumped directly to dashboard | User misses confirmation and next step clarity | FIXED |
| P1 | Brand bridge | `/onboarding/brand` redirects to `/brand-builder` | User may not understand this is still onboarding | OPEN UX RISK |
| P2 | Profile step | Phone/avatar/bio can feel like setup work before visible value | Potential early friction | OPEN UX RISK |
| P2 | Goals step | Multiple option groups create decision load | User may select defaults without understanding | OPEN UX RISK |

## Remediation Applied

- Signup now routes to `/onboarding`.
- Login now routes to `/onboarding`; completed users are redirected onward by onboarding index.
- Member dashboard now redirects incomplete onboarding users to `/onboarding`.
- Brand Builder complete now PATCHes `/api/v1/member/onboarding` with `step: brand`.
- First funnel create/skip now routes to `/onboarding/complete`.

## Remaining Risks

- The brand bridge is technically valid but not self-explanatory. The user sees Brand Builder instead of a page labeled onboarding step 3.
- The onboarding profile step still asks for setup fields before generating the first visible asset.
- The activation dashboard starts after onboarding, so it should not substitute for true first-run onboarding.

## Acceptance Criteria

- New signup cannot land on dashboard before onboarding.
- Returning incomplete member resumes onboarding.
- Brand Builder completion advances member onboarding.
- First funnel completion shows a confirmation screen.
- Dashboard appears only after onboarding completion for member users.
