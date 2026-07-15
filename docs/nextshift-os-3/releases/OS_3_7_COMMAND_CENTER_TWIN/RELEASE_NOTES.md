# OS 3.7 Command Center + Business Twin Release Notes

Version: 3.7 RC  
Status: RC package prepared — awaiting approval  
Last Updated: 2026-07-15

---

## Summary

OS 3.7 turns the Command Center into a more coherent, business-aware operating surface. Business Score is grounded in the domain policy; the Command Center follows an approved information architecture; Weekly Review reads the existing memory rather than introducing another store; and recommendation discussion can use bounded, real Business Twin facts.

## Highlights

### Registration Recovery Fix

Email-confirmed signups no longer strand users with an Auth account but no tenant. Signup persists provisioning intent, `/auth/callback` provisions after verification, and `/setup-workspace` recovers pre-existing dangling accounts. The flow is idempotent, handles slug collisions and concurrent requests, and has CI E2E coverage.

### Business Twin Prompt Quality

Discussion prompts now receive real, user-provided Twin facts only when available. Empty Twin data is omitted, fields are bounded, and F2 removes duplicate business-name and positioning facts at the repository layer before prompt construction. The model receives each retained fact once, not repeated labels for the same value.

### AI Router Intake Completed

All four remaining `generateWithFallback` call sites were removed. Onboarding and voice AI generation use the shared router, categories, quota checks, and usage logging path.

### Command Center And Weekly Review

Business Score, the approved information architecture, and a read-only Weekly Review make the Command Center more actionable while preserving the existing storage model.

## Verification Summary

- Two 2026-07-15 audits found no ship-blocking source defect.
- PR #73 and PR #74 passed all checks, including E2E.
- The final audit records C-1 (criterion wording), C-2 (Twin duplication), and A-2 (field bounds) as closed.

## Known Limitation

**C-3 remains post-deploy only.** After an authorized deployment, a real dangling-account recovery and the resulting `user_signed_up` PostHog event must be observed. Until then, G2 remains 4/5 verified; this package does not claim production observation that has not happened.

## Release Decision

```text
RC prepared. Tag and deployment are intentionally deferred.
```
