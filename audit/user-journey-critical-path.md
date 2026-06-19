# User Journey Critical Path

Status: C1 Production Hardening
Runtime changes: none
Date: 2026-06-18

## Required Critical Path

```text
Sign Up
-> Complete Interview
-> Reach Business State
-> Start Journey
-> Receive AI COO Guidance
-> Use Workforce
-> Generate Growth Signals
-> Reach First Business Outcome
```

## Actual Current Path

```text
/signup
-> Supabase signup
-> /api/v1/tenant/register
-> user role = operator
-> /dashboard
-> OperatorDashboard
```

For member users, the path is closer to:

```text
/dashboard
-> ActivationDashboard
-> /brand-builder/step/interview
-> /brand-builder/profile or wizard profile step
-> /content-engine
-> /lead-magnet or /funnel
-> /journey
-> /ceo-mode
-> /ai-workforce
-> /analytics
```

This path is not currently expressed as one reliable guided route.

## Critical Path Gate Review

### Gate 1: Sign Up

- Route: `/signup`
- API: `/api/v1/tenant/register`
- Status: blocked for the requested member journey.
- Reason: self-signup creates an `operator`, while C1 journey assumes `member` activation.

Decision: fail.

### Gate 2: Complete Interview

- Route: `/brand-builder/step/interview`
- APIs:
  - `/api/v1/brand-builder/interview`
  - `/api/v1/brand-builder/interview/[id]/message`
  - `/api/v1/brand-builder/interview/[id]/finish`
  - `/api/v1/brand-builder/wizard/complete-step`
  - `/api/v1/brand-builder/profile`
- Status: usable UI, unreliable journey completion.
- Reason: visible interview completion does not consistently write `brand_discovery_completed`.

Decision: partial.

### Gate 3: Reach Business State

- APIs:
  - `/api/v1/business-intel`
  - `BusinessStateService`
  - `COOPlanService`
- Status: available.
- Reason: business state and AI COO can be generated, but the path to the business state surface is not obvious from member onboarding.

Decision: partial.

### Gate 4: Start Journey

- Route: `/journey`
- API: `/api/v1/mission/state`
- Status: opens, but progress movement is unreliable.
- Reason: simplified next-action checks do not consistently match canonical journey completion checks.

Decision: fail.

### Gate 5: Receive AI COO Guidance

- Route: `/ceo-mode`
- API: `/api/v1/business-intel`
- Status: available but hidden.
- Reason: no clear member navigation item for AI COO; top nav "business" points to `/analytics-center`.

Decision: partial.

### Gate 6: Use Workforce

- Route: `/ai-workforce`
- APIs:
  - `/api/v1/ai-workforce`
  - `/api/v1/ai-workforce/execute`
- Status: usable.
- Reason: workforce can load and execute. Handoff from COO delegation to execution is manual.

Decision: partial pass.

### Gate 7: Generate Growth Signals

- Route: `/analytics`
- API: `/api/v1/analytics/member`
- Service: `GrowthLoopStateService`
- Status: available with data risk.
- Reason: Growth Loop may undercount mission completion because of completed-check format mismatch.

Decision: partial.

### Gate 8: Reach First Business Outcome

Expected first business outcome:

```text
first generated content
or first lead magnet / funnel
or first captured lead
```

Status: partial.

Evidence:

- Content generation writes content and `first_content_generated`.
- Lead magnet generation can write `lead_magnet_created` only if quality score is high enough.
- Funnel creation can save a page.
- First captured lead is not clearly guided from generated lead magnet to published page to lead capture.

Decision: partial.

## Critical Blockers

1. Role mismatch after signup.
   - Self-signup owner is `operator`, but activation is member-only.

2. Mission completion key mismatch.
   - Canonical keys: `brand_discovery_completed`, `brand_dna_confirmed`, `first_content_generated`, `lead_magnet_created`.
   - UI next-action keys: `brand_interview`, `brand_dna`, `first_content`, `first_lead`.

3. Missing atomic Brand Builder completion.
   - Interview/Profile save does not consistently update the canonical mission checks.

4. Route mismatch.
   - `/leads` vs `/lead-magnet`
   - `/traffic` vs `/traffic-engine`
   - `/ceo-mode` hidden from primary member navigation

5. Growth Loop completed-check parsing.
   - Mission service stores object entries.
   - Growth Loop reads only string arrays.

## Minimum Fix Order Before C2

1. Decide brand-new self-signup persona:
   - owner/operator onboarding, or member activation onboarding.

2. Create one canonical journey completion adapter:
   - It must map legacy/simple keys and canonical keys consistently.
   - Dashboard, Activation, Journey, Evolution, and Growth Loop should consume it.

3. Make Brand Builder completion atomic:
   - Interview finish should write `brand_discovery_completed`.
   - Profile/DNA confirmation should write `brand_dna_confirmed`.

4. Canonicalize route targets:
   - `/lead-magnet` for lead magnet creation.
   - `/funnel` for real landing pages.
   - `/traffic-engine` for traffic.
   - visible `/ceo-mode` or equivalent AI COO route.

5. Fix Growth Loop completed-check parsing:
   - Accept both `string[]` and `{ check, completed_at }[]`.

6. Add a live acceptance test for the critical path:
   - signup or seeded user login
   - interview completion
   - mission state assertion
   - content generation assertion
   - journey next-action assertion
   - AI COO response assertion
   - workforce execution assertion
   - analytics growth signal assertion

## Final Decision

NOT READY FOR C2
