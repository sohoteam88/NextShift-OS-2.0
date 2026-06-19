# User Journey Audit

Status: C1 Production Hardening
Work type: user journey audit
Runtime changes: none
Date: 2026-06-18

## Audit Method

This audit followed the runtime code paths for authenticated users, route handlers, mission progress writes, navigation surfaces, and generated-output screens. No destructive actions were triggered.

Validation commands:

- `pnpm type-check` passed.
- Route and mission-key evidence was checked with source searches across `src/app`, `src/components`, and `src/modules`.

Limitation: no live authenticated browser session was executed in this pass. Findings are based on real route/API code paths, not architecture diagrams.

## Executive Summary

Final decision: **NOT READY FOR C2**

The critical path is not reliable for a brand-new self-signup user. The main blockers are:

- Self-signup creates an `operator`, while the activation/journey onboarding path is designed for `member`.
- Brand Builder writes wizard/profile state, but does not consistently write the mission checks consumed by Dashboard/Journey.
- Multiple modules use different completion keys for the same milestone.
- Several navigation routes point to legacy or wrong surfaces (`/leads`, `/traffic`) instead of the actual generator routes (`/lead-magnet`, `/traffic-engine`).
- AI COO exists behind `/ceo-mode` and `/api/v1/business-intel`, but it is not exposed as a clear primary navigation step for members.
- Growth Loop analytics can undercount activation progress because it only reads string-array `completedChecks`, while mission progress now stores `{ check, completed_at }` entries.

## Journey Scores

| Journey | Score | Status |
| --- | ---: | --- |
| New User Onboarding | 1 | Severe friction |
| Brand Builder | 2 | Moderate/severe friction |
| Content Engine | 3 | Usable with friction |
| Funnel Creation | 2 | Moderate/severe friction |
| Journey System | 1 | Severe friction |
| AI COO | 2 | Hidden / weak handoff |
| Workforce | 3 | Usable, but not clearly connected |
| Growth Loop | 2 | Data correctness risk |
| Dashboard | 2 | Role and hierarchy mismatch |

## Journey 1: New User Onboarding

Path audited:

```text
Signup/Login -> Dashboard -> Interview -> Business State -> Journey
```

Evidence:

- `/signup` signs up through Supabase, then calls `/api/v1/tenant/register`.
- `tenantService.create()` creates the owner user with role `operator`, status `active`.
- `/dashboard` renders `OperatorDashboard` for `operator`; `DashboardV4` and `ActivationDashboard` only render for `member`.
- Auth layout redirects pending/suspended users, but active operators are allowed into the operator dashboard.

Result: a brand-new self-signup user does not enter the member activation path. They land in an operator/admin-style dashboard, so the required C1 path is not naturally guided.

Critical answer: **No, a brand-new self-signup user cannot reliably reach Journey without manual intervention or role/context clarification.**

Score: 1

## Journey 2: Brand Builder

Path audited:

```text
Interview -> Profile -> Audience -> Offer -> Brand DNA
```

Evidence:

- `/brand-builder/step/interview` creates/loads an interview and can finish through `/api/v1/brand-builder/interview/[id]/finish`.
- `InterviewStepClient.completeWithProfile()` calls `/api/v1/brand-builder/wizard/complete-step` and `/api/v1/brand-builder/profile`.
- `/api/v1/brand-builder/wizard/complete-step` only updates `metadata.brand_builder_state`.
- `/api/v1/brand-builder/profile` writes `metadata.brand_profile`, and only notifies mission progress for `positioning_completed`, `bio_generated`, and `avatar_completed` based on specific update fields.
- `/api/v1/brand-builder/interview/[id]/extract` and `/confirm` can write `brand_discovery_completed` and `brand_dna_confirmed`, but the main interview finish flow does not clearly call these endpoints.

Result: the user can likely finish the UI steps, but mission/Journey completion does not reliably move with the visible Brand Builder completion.

Critical answer: **User can finish parts of Brand Builder, but Brand Builder completion is not reliably reflected in Journey.**

Score: 2

## Journey 3: Content Engine

Path audited:

```text
Brand DNA -> Content Engine -> Content Calendar -> Content Output
```

Evidence:

- `/content-engine` renders `ContentCommandCenter` by default.
- Smart generation routes to `ContentEngineDashboard` with query params.
- `/api/v1/content-engine/generate` saves generated post content and notifies `first_content_generated`.
- `/api/v1/content-engine/calendar` creates 30/90/180 day calendar rows.
- The generator view shows `lastPost` and a text status after calendar generation.
- Full generated calendar visibility is split across content engine and brand-builder calendar surfaces.

Result: generation works and output is visible. Friction remains around where generated calendars are reviewed and how publish completion is surfaced.

Score: 3

## Journey 4: Funnel Creation

Path audited:

```text
Brand DNA -> Funnel Builder -> Lead Magnet -> Landing Page
```

Evidence:

- `/lead-magnet` has a generator and preview, backed by `/api/v1/lead-magnet/generate`.
- `/funnel` has a real page creation flow backed by `/api/v1/funnel/funnels`.
- `/funnel-builder` generates a full funnel package, backed by `/api/v1/funnel-builder/generate`.
- Activation day 4 points to `/leads`, while Journey and agents often point to `/lead-magnet` or `/funnel`.
- `JOURNEY_MAP` routes `lead_magnet` and `funnel` to `/funnel`, while `getNextJourneyAction` routes first lead to `/lead-magnet`.

Result: assets can generate and pages can save, but the user path is fragmented across three surfaces.

Score: 2

## Journey 5: Journey System

Path audited:

```text
Journey -> Mission -> Next Action -> Progress Update
```

Evidence:

- `/journey` uses `useMissionState()` and `getNextJourneyAction()`.
- `BeginnerJourneyView` displays the current action and links to the next route.
- It has no direct complete/progress button.
- Mission progress depends on other modules calling `notifyMissionProgress()`.
- UI selectors look for simplified keys like `brand_interview`, `brand_dna`, `first_content`, `first_lead`.
- Canonical `JOURNEY_MAP` uses keys like `brand_discovery_completed`, `brand_dna_confirmed`, `first_content_generated`, `lead_magnet_created`.
- Some adapters support aliases, but `/journey`, `useActivation()`, and `useDashboardMission()` still rely on simplified checks plus progress-percent fallback.

Critical answer: **Journey does not reliably move from direct user-visible completion.**

Score: 1

## Journey 6: AI COO

Path audited:

```text
Business State -> AI COO -> Strategic Recommendation
```

Evidence:

- AI COO plan generation exists through `cooPlanService.getCOOPlan()`.
- `/api/v1/business-intel` combines `COOPlanService` and `ceoAdvisorEngine`.
- UI surface is `/ceo-mode`, rendered by `CEOAdvisorDashboard`.
- Primary navigation does not expose `/ceo-mode` clearly for members.
- `TopBar` sends member "business" navigation to `/analytics-center`, not `/ceo-mode`.

Critical answer: **AI COO can produce useful output if reached, but the user path to it is hidden.**

Score: 2

## Journey 7: Workforce

Path audited:

```text
AI COO -> Workforce -> Execution -> Result
```

Evidence:

- `/ai-workforce` loads `WorkforceDashboard`.
- `/api/v1/ai-workforce` reads `RuntimeStateService`.
- `/api/v1/ai-workforce/execute` can run single-agent or multi-agent execution and writes reports to memory.
- `CEOAdvisorDashboard` can route to `/ai-workforce`.
- AI COO delegations are planning-only and do not dispatch work automatically.

Result: workforce can load and execute. The gap is the handoff from AI COO plan/delegation to actual execution.

Score: 3

## Journey 8: Growth Loop

Path audited:

```text
Activity -> Analytics -> Growth Signals
```

Evidence:

- `/analytics` renders member/leader/operator dashboards by role.
- `/api/v1/analytics/member` combines `GrowthLoopStateService` and legacy analytics fallback.
- `GrowthLoopAssembler` reads user progress, content, leads, funnels, invites, activities, AI usage, and followups.
- `GrowthLoopAssembler.jsonStringArray()` only handles `string[]`.
- `MissionService` now stores completed checks as `{ check, completed_at }[]`.

Result: charts can load, but Growth Loop activation signals can undercount completed checks.

Score: 2

## Dashboard Audit

Expected surfaces:

```text
Dashboard -> Today's Focus -> Current Journey -> Business Health -> AI COO Focus -> Quick Actions
```

Findings:

- Member dashboard can show Activation Dashboard or DashboardV4 depending on activation state.
- Self-signup owner gets OperatorDashboard, not DashboardV4.
- DashboardV4 shows today's mission, roadmap progress, unlock preview, revenue progress, and AI coach.
- Business Health and AI COO Focus are not first-class on member DashboardV4.
- Quick actions are spread across top navigation, mission sidebar, and route-specific cards.
- Some navigation points to legacy/wrong routes (`/leads`, `/traffic`).

Score: 2

## Success Criteria Result

| Criteria | Result |
| --- | --- |
| Onboarding validated | Failed |
| Brand builder validated | Partial |
| Content validated | Partial pass |
| Funnel validated | Partial |
| Journey validated | Failed |
| AI COO validated | Partial |
| Workforce validated | Partial pass |
| Growth loop validated | Partial |
| Dashboard audited | Completed |
| Friction scored | Completed |

## Final Decision

NOT READY FOR C2
