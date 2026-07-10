# E3 Smoke Test Suite

Date: 2026-06-19
Status: WARN

## Scope

This suite defines mandatory post-deploy smoke tests for NextShift OS. E3 did not execute these tests against production because the phase prohibits production deployment and VPS changes.

## Test Data Requirements

- One active operator user.
- One test tenant.
- One brand-builder profile capable of completing interview flow.
- One journey state with current mission visible.
- AI provider keys configured in production env where AI flows are expected to run.
- Analytics data or seeded event data sufficient to confirm rendering.

## Global Pass Criteria

Each smoke test must satisfy:

- Page/API loads without 5xx.
- Auth state is correct.
- Tenant-scoped data is visible only to the active tenant.
- Primary call to action works.
- No console/runtime error blocks the workflow.
- No new P0/P1 log entries appear.

## 1. Login

Path: `/login`

Steps:

1. Open `/login`.
2. Sign in as active operator.
3. Confirm redirect to authenticated dashboard.
4. Confirm logout/login cycle does not strand session.

Pass criteria:

- Login succeeds.
- No redirect loop.
- User lands on authorized app surface.

## 2. Dashboard

Path: `/dashboard`

Steps:

1. Open dashboard after login.
2. Confirm mission/progress card renders.
3. Confirm current task CTA routes to expected canonical module.
4. Confirm tenant-specific data is shown.

Pass criteria:

- Dashboard renders without blank state caused by runtime errors.
- Progress state matches journey projection.

## 3. Interview

Path: `/brand-builder/step/interview`

Steps:

1. Open interview route.
2. Send one valid answer.
3. Complete or resume interview.
4. Confirm completion state is persisted.
5. Confirm next route is available and not only a dead-end return button.

Pass criteria:

- Interview state persists.
- Completion unlocks downstream brand intelligence surfaces.

## 4. Journey

Path: `/journey`

Steps:

1. Open journey route.
2. Confirm current objective and current task render.
3. Click current task CTA.
4. Confirm CTA routes to Chinese localized destination where applicable.
5. Return and confirm progress remains synchronized with dashboard.

Pass criteria:

- Dashboard progress and journey progress agree.
- CTA route uses canonical route authority.

## 5. AI COO

Candidate paths:

- `/ai`
- AI recommendation panel on dashboard.
- AI COO API route where applicable.

Steps:

1. Open AI COO surface.
2. Trigger a recommendation or command using non-destructive prompt.
3. Confirm response renders in the selected language.
4. Confirm errors are captured without leaking secrets.

Pass criteria:

- AI action completes or fails gracefully.
- Output language matches UI locale.

## 6. Runtime

Candidate paths:

- Agent runtime routes.
- AI workforce execution routes.

Steps:

1. Trigger a safe runtime action.
2. Confirm runtime creates expected status/result.
3. Confirm telemetry records success/failure.
4. Confirm rate limits and auth boundaries still apply.

Pass criteria:

- Runtime execution is tenant-scoped and observable.
- No unauthorized cross-tenant access.

## 7. Analytics

Candidate paths:

- `/analytics`
- Dashboard analytics widgets.
- Member analytics route.

Steps:

1. Open analytics surface.
2. Confirm charts/cards render.
3. Confirm scoped metrics match tenant/user context.
4. Confirm empty state is usable if no events exist.

Pass criteria:

- Analytics renders without 5xx or cross-tenant leakage.

## Required Post-Smoke Evidence

Record after every release:

- Release version or commit.
- Environment tested.
- Tester.
- Timestamp.
- Pass/fail by test area.
- Linked incident for every failure.
- Screenshot or log reference for failures.

## Decision

WARN. The smoke suite is now defined, but it has not been executed against a deployed release candidate in E3 scope.
