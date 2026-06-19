# Onboarding Role Decision

## Decision

C1A-001 uses Option A: self-signup owners remain `operator`, but incomplete operators enter the same Activation / Journey start path before seeing the operator admin dashboard.

## Rationale

- `tenantService.create()` already creates self-signup workspace owners as active `operator` users.
- Creating a separate owner/member mode would add a new authority path, which C1A explicitly excludes.
- The critical-path blocker was routing new owners into legacy `/onboarding` or directly to operator surfaces before Interview/Journey activation.

## Implementation

- Signup success now routes directly to `/dashboard`.
- `/dashboard` renders `DashboardV4` for `operator` users until the canonical mission journey is complete.
- Completed operators still receive `OperatorDashboard`.

## Expected New User Path

Signup -> Dashboard Activation -> Brand Interview -> Brand Profile -> Journey progression.
