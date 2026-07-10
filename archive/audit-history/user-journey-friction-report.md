# User Journey Friction Report

Status: C1 Production Hardening
Runtime changes: none
Date: 2026-06-18

## Scoring Scale

- 0 = blocked
- 1 = severe friction
- 2 = moderate friction
- 3 = usable
- 4 = smooth
- 5 = excellent

## Friction Summary

| Journey | Score | Top issue |
| --- | ---: | --- |
| New User Onboarding | 1 | Signup creates operator, but activation journey is member-only |
| Brand Builder | 2 | Visible completion does not reliably write Journey completion checks |
| Content Engine | 3 | Generation works, but calendar/output locations are unclear |
| Funnel Creation | 2 | Route fragmentation between `/leads`, `/lead-magnet`, `/funnel`, and `/funnel-builder` |
| Journey System | 1 | Next action check keys do not align with canonical Journey Map |
| AI COO | 2 | Existing capability is hidden behind `/ceo-mode` |
| Workforce | 3 | Execution works, but COO delegation is not connected to dispatch |
| Growth Loop | 2 | Completed-check parsing can undercount activation |
| Dashboard | 2 | Role-specific dashboard behavior breaks brand-new-user path |

## Issues

### C1-001

- Journey: New User Onboarding
- Severity: P0
- Steps To Reproduce:
  1. Sign up through `/signup`.
  2. Complete tenant registration.
  3. Land on `/dashboard`.
- Expected: brand-new user sees member activation path with interview, journey, and next action.
- Actual: tenant owner is created as `operator`; `/dashboard` renders `OperatorDashboard`, not `DashboardV4` or `ActivationDashboard`.
- Suggested Fix: define separate owner/operator onboarding or create a member-mode activation path for self-signup owners before admin surfaces.

### C1-002

- Journey: New User Onboarding
- Severity: P1
- Steps To Reproduce:
  1. Open `/dashboard` as member.
  2. Follow Day 1 activation to `/brand-builder/step/interview`.
  3. Finish interview.
- Expected: completing interview advances Journey past brand discovery.
- Actual: the main interview finish flow completes wizard step and profile save, but does not clearly write `brand_discovery_completed`.
- Suggested Fix: make interview finish call a single canonical completion service that writes Brand Builder state and mission check atomically.

### C1-003

- Journey: Brand Builder
- Severity: P1
- Steps To Reproduce:
  1. Finish interview and profile.
  2. Return to Dashboard or Journey.
- Expected: Journey recognizes Brand DNA completion.
- Actual: profile save may notify `positioning_completed`, `bio_generated`, or `avatar_completed`, while Journey expects `brand_dna_confirmed`.
- Suggested Fix: align Brand Builder profile completion with `brand_dna_confirmed`, or update all Journey consumers to use canonical alias mapping.

### C1-004

- Journey: Journey System
- Severity: P1
- Steps To Reproduce:
  1. Complete a canonical mission event such as `brand_discovery_completed` or `first_content_generated`.
  2. Open `/journey`.
- Expected: next action moves to the next correct stage.
- Actual: `/journey`, `useActivation()`, and `useDashboardMission()` check simplified keys (`brand_interview`, `brand_dna`, `first_content`) with progress percent fallback; canonical aliases are not consistently used.
- Suggested Fix: route these consumers through `JourneyNextActionAdapter` or one canonical resolver that handles all completion aliases.

### C1-005

- Journey: Content Engine
- Severity: P2
- Steps To Reproduce:
  1. Generate a 30/90/180 day calendar in `/content-engine?mode=generator`.
  2. Look for the created calendar list.
- Expected: generated calendar rows are visible or linked immediately.
- Actual: generator confirms success, but the full calendar view is not clearly surfaced in the same workflow.
- Suggested Fix: after calendar generation, show the generated list or link directly to the canonical calendar view.

### C1-006

- Journey: Content Engine
- Severity: P2
- Steps To Reproduce:
  1. Generate first content.
  2. Return to Journey.
- Expected: Journey moves past first content.
- Actual: API writes `first_content_generated`; some UI checks use `first_content` or progress percent fallback.
- Suggested Fix: consume canonical completion aliases consistently across dashboard, activation, and journey.

### C1-007

- Journey: Funnel Creation
- Severity: P1
- Steps To Reproduce:
  1. Follow Activation day 4.
  2. Click "创建第一个引流磁铁".
- Expected: user lands on lead magnet or funnel builder creation flow.
- Actual: activation routes to `/leads`, while lead magnet generation is `/lead-magnet` and real funnel pages are under `/funnel`.
- Suggested Fix: update activation and mission sidebar routes to the actual creation surface.

### C1-008

- Journey: Funnel Creation
- Severity: P2
- Steps To Reproduce:
  1. Generate a lead magnet in `/lead-magnet`.
  2. Look for a saved landing page.
- Expected: lead magnet becomes or clearly links to a landing page/funnel.
- Actual: lead magnet preview is not the same as a saved `/funnel` page.
- Suggested Fix: add an explicit "Create landing page from this lead magnet" handoff.

### C1-009

- Journey: AI COO
- Severity: P2
- Steps To Reproduce:
  1. Navigate as a member using top navigation.
  2. Try to find AI COO guidance.
- Expected: clear navigation to AI COO / CEO guidance.
- Actual: `/ceo-mode` exists but is not exposed in primary member navigation; member "business" goes to `/analytics-center`.
- Suggested Fix: add a visible AI COO/CEO Mode entry or integrate the top COO recommendation into DashboardV4.

### C1-010

- Journey: Workforce
- Severity: P2
- Steps To Reproduce:
  1. View AI COO recommendations.
  2. Click into Workforce.
  3. Execute recommended agents.
- Expected: COO delegation maps into a prepared workforce execution.
- Actual: COO delegations are planning-only; Workforce starts from manual goal or agent click.
- Suggested Fix: pass selected COO recommendation/delegation into `/ai-workforce` as execution context.

### C1-011

- Journey: Growth Loop
- Severity: P1
- Steps To Reproduce:
  1. Complete mission checks through `MissionService`.
  2. Open member analytics.
- Expected: Growth Loop activation signal sees completed mission checks.
- Actual: `GrowthLoopAssembler.jsonStringArray()` ignores object-style completed check entries.
- Suggested Fix: reuse `extractCheckKeys()` or equivalent parsing for both string and object completed-check formats.

### C1-012

- Journey: Dashboard
- Severity: P2
- Steps To Reproduce:
  1. Open member DashboardV4 after activation.
  2. Compare expected Dashboard surfaces.
- Expected: Today's Focus, Current Journey, Business Health, AI COO Focus, and Quick Actions are clearly visible.
- Actual: Today's mission and AI Coach are visible, but Business Health and AI COO Focus are not first-class; quick actions are distributed across surfaces.
- Suggested Fix: define Dashboard V3 as a consumer shell with one primary next action, one business health snapshot, and one AI COO recommendation.

### C1-013

- Journey: Routing
- Severity: P2
- Steps To Reproduce:
  1. Follow mission or advisory links for traffic.
- Expected: route opens the actual traffic engine.
- Actual: `JOURNEY_MAP` uses `/traffic`, while the implemented page is `/traffic-engine`.
- Suggested Fix: canonicalize traffic route references to `/traffic-engine` or add a redirect.

## Final Decision

NOT READY FOR C2
