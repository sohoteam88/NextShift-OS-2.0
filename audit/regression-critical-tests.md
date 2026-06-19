# C3 Regression Critical Tests

Top 20 tests that must pass before D1.

| ID | Area | Test | Severity | Expected |
| -- | ---- | ---- | -------- | -------- |
| C3-AUTH-001 | Authentication | New user signup creates tenant owner/operator | P0 | User exists, tenant exists, role is `operator`, status is active. |
| C3-AUTH-002 | Authentication | Signup success routing | P0 | New operator routes to `/dashboard`, not legacy `/onboarding`. |
| C3-AUTH-003 | Authentication | Incomplete operator dashboard routing | P0 | Incomplete operator sees Activation/DashboardV4 path. |
| C3-IA-001 | Interview Authority | Finish interview | P0 | Finish API calls `completeBrandDiscovery()`. |
| C3-IA-003 | Interview Authority | Brand profile upsert | P0 | `brandProfile` row reflects interview output. |
| C3-IA-005 | Interview Authority | Audience propagation | P0 | Interview Authority exposes audience snapshot. |
| C3-JOURNEY-001 | Journey | Brand discovery completion advances Journey | P0 | `brand_discovery_completed` changes JourneyState stage/progress. |
| C3-JOURNEY-002 | Journey | Business State stage influences Journey stage | P0 | Changing `businessStage` changes `JourneyState.stage`. |
| C3-JOURNEY-005 | Journey | Journey owns next action | P0 | Business State does not directly select `JourneyState.nextAction`. |
| C3-AICOO-001 | AI COO | COOPlan consumes JourneyState | P0 | `COOPlanAssembler` calls `JourneyStateService`. |
| C3-AICOO-002 | AI COO | Journey-derived recommendation | P0 | First COO recommendation reflects Journey next action. |
| C3-AICOO-003 | AI COO | Journey stage maps to assignment context | P0 | COO assignment context changes when Journey stage changes. |
| C3-RUNTIME-001 | Agent Runtime | Runtime consumes COO assignments | P0 | `RuntimeState.pendingAssignments` are adapted from `COOPlan.assignments`. |
| C3-RUNTIME-002 | Agent Runtime | Runtime default fallback | P0 | Default stage assignment appears only when COO assignments are empty. |
| C3-RUNTIME-006 | Agent Runtime | GET `/ai-workforce` | P0 | GET returns RuntimeState-derived workforce view model. |
| C3-RUNTIME-007 | Agent Runtime | POST `/ai-workforce/execute` single agent | P0 | Legacy execution path still runs and stores agent memory. |
| C3-RUNTIME-008 | Agent Runtime | POST `/ai-workforce/execute` multi-agent | P0 | Legacy multi-agent goal orchestration still runs. |
| C3-BRAND-002 | Brand Builder | Interview finish routes to profile step | P0 | Client routes to `/brand-builder/step/profile`. |
| C3-BRAND-004 | Brand Builder | Brand DNA confirmation | P0 | Confirming profile writes `brand_dna_confirmed`. |
| C3-FUNNEL-001 | Funnels | Lead Magnet route | P1 | Canonical route is `/lead-magnet`. |

## Failure Rule

Any P0 failure blocks D1.

Any P1 authority drift failure requires remediation before D1 unless explicitly waived in the D1 logging architecture plan.
