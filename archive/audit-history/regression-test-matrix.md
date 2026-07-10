# C3 Regression Test Matrix

## Final Decision

READY FOR D1

## Severity

- P0: user blocked
- P1: authority drift
- P2: data mismatch
- P3: UX issue

## Matrix

| ID | Area | Test | Severity | Expected |
| -- | ---- | ---- | -------- | -------- |
| C3-AUTH-001 | Authentication | New user signup creates tenant owner/operator | P0 | User exists, tenant exists, role is `operator`, status is active. |
| C3-AUTH-002 | Authentication | Signup success routing | P0 | New operator routes to `/dashboard`, not legacy `/onboarding`. |
| C3-AUTH-003 | Authentication | Incomplete operator dashboard routing | P0 | Incomplete operator sees Activation/DashboardV4 path. |
| C3-AUTH-004 | Authentication | Completed operator dashboard routing | P1 | Completed operator sees OperatorDashboard. |
| C3-AUTH-005 | Authentication | Login with active user | P0 | Authenticated user reaches role-appropriate dashboard. |
| C3-AUTH-006 | Authentication | Logout | P0 | Session clears and protected routes redirect to login. |
| C3-AUTH-007 | Authentication | Tenant isolation | P0 | User only sees own tenant data. |
| C3-IA-001 | Interview Authority | Finish interview | P0 | Finish API calls `completeBrandDiscovery()`. |
| C3-IA-002 | Interview Authority | Brand interview state | P0 | `brandInterview.status` becomes confirmed and profile is stored. |
| C3-IA-003 | Interview Authority | Brand profile upsert | P0 | `brandProfile` row reflects interview output. |
| C3-IA-004 | Interview Authority | Legacy profile metadata compatibility | P1 | `user.metadata.brand_profile` remains available. |
| C3-IA-005 | Interview Authority | Audience propagation | P0 | Interview Authority exposes audience snapshot. |
| C3-IA-006 | Interview Authority | Business context propagation | P0 | Interview Authority exposes business context. |
| C3-IA-007 | Interview Authority | Business mode fallback | P1 | Business mode follows ADR-022 fallback order when absent in primary source. |
| C3-BS-001 | Business State | Business State reads Interview Authority | P1 | `BusinessStateAssembler` consumes Interview Authority. |
| C3-BS-002 | Business State | Stage from completed checks | P1 | `brand_discovery_completed` maps to audience/business foundation state. |
| C3-BS-003 | Business State | Readiness aggregation | P1 | Readiness score uses factual readiness sources and excludes CEO advisor from average. |
| C3-BS-004 | Business State | Bottleneck merge | P1 | Duplicate bottleneck codes are merged once. |
| C3-BS-005 | Business State | Opportunity merge | P1 | Duplicate opportunity codes are merged once. |
| C3-BS-006 | Business State | Missing sources fallback | P1 | Missing readiness sources return fallback metadata. |
| C3-JOURNEY-001 | Journey | Brand discovery completion advances Journey | P0 | `brand_discovery_completed` changes JourneyState stage/progress. |
| C3-JOURNEY-002 | Journey | Business State stage influences Journey stage | P0 | Changing `businessStage` changes `JourneyState.stage`. |
| C3-JOURNEY-003 | Journey | Low readiness conservatism | P1 | Low readiness keeps stage conservative without changing next action directly. |
| C3-JOURNEY-004 | Journey | High bottleneck conservatism | P1 | High severity bottleneck can move Journey stage to relevant domain. |
| C3-JOURNEY-005 | Journey | Journey owns next action | P0 | Business State does not directly select `JourneyState.nextAction`. |
| C3-JOURNEY-006 | Journey | Milestones from user progress | P1 | Milestone completion reflects completed checks. |
| C3-JOURNEY-007 | Journey | Revenue progress remains Journey-owned | P1 | Business State changes do not mutate revenue progress directly. |
| C3-AICOO-001 | AI COO | COOPlan consumes JourneyState | P0 | `COOPlanAssembler` calls `JourneyStateService`. |
| C3-AICOO-002 | AI COO | Journey-derived recommendation | P0 | First COO recommendation reflects Journey next action. |
| C3-AICOO-003 | AI COO | Journey stage maps to assignment context | P0 | COO assignment context changes when Journey stage changes. |
| C3-AICOO-004 | AI COO | Milestone context in reasoning | P1 | COO recommendation reasoning includes milestone count. |
| C3-AICOO-005 | AI COO | Revenue context in reasoning | P1 | COO recommendation reasoning/signals include revenue progress. |
| C3-AICOO-006 | AI COO | CEO advisor compatibility | P1 | CEO advisor recommendations still appear after Journey recommendation. |
| C3-RUNTIME-001 | Agent Runtime | Runtime consumes COO assignments | P0 | `RuntimeState.pendingAssignments` are adapted from `COOPlan.assignments`. |
| C3-RUNTIME-002 | Agent Runtime | Runtime default fallback | P0 | Default stage assignment appears only when COO assignments are empty. |
| C3-RUNTIME-003 | Agent Runtime | Assignment ID preservation | P1 | Runtime assignment carries `sourceAssignmentId`. |
| C3-RUNTIME-004 | Agent Runtime | Assignment objective preservation | P1 | Runtime objective matches COO assignment objective. |
| C3-RUNTIME-005 | Agent Runtime | Assignment agent preservation | P1 | Runtime selected agents match COO recommended agents. |
| C3-RUNTIME-006 | Agent Runtime | GET `/ai-workforce` | P0 | GET returns RuntimeState-derived workforce view model. |
| C3-RUNTIME-007 | Agent Runtime | POST `/ai-workforce/execute` single agent | P0 | Legacy execution path still runs and stores agent memory. |
| C3-RUNTIME-008 | Agent Runtime | POST `/ai-workforce/execute` multi-agent | P0 | Legacy multi-agent goal orchestration still runs. |
| C3-GROWTH-001 | Growth Loop | Content signal | P1 | Content count contributes to acquisition/activation signals. |
| C3-GROWTH-002 | Growth Loop | Lead signal | P1 | Lead count contributes to acquisition/retention signals. |
| C3-GROWTH-003 | Growth Loop | Journey signal | P1 | Completed checks contribute to activation signal. |
| C3-GROWTH-004 | Growth Loop | Activity signal | P1 | Recent activity count contributes to retention signal. |
| C3-GROWTH-005 | Growth Loop | AI usage signal | P2 | AI usage count contributes to expansion signal. |
| C3-GROWTH-006 | Growth Loop | Runtime result deferred | P2 | Agent memory fallback remains; Runtime -> Growth Loop direct signal is not required until D/C3 follow-up. |
| C3-BRAND-001 | Brand Builder | Interview page loads existing/latest interview | P0 | Existing interview can resume. |
| C3-BRAND-002 | Brand Builder | Interview finish routes to profile step | P0 | Client routes to `/brand-builder/step/profile`. |
| C3-BRAND-003 | Brand Builder | Profile step loads Interview Authority view model | P0 | Generated profile/audience/DNA are visible. |
| C3-BRAND-004 | Brand Builder | Brand DNA confirmation | P0 | Confirming profile writes `brand_dna_confirmed`. |
| C3-BRAND-005 | Brand Builder | Content pillars visible | P1 | Content pillars from profile are available in profile/content strategy surfaces. |
| C3-CONTENT-001 | Content Engine | Generate content | P1 | Generation succeeds and writes `first_content_generated`. |
| C3-CONTENT-002 | Content Engine | Generate 30-day calendar | P1 | Calendar generation creates planned content. |
| C3-CONTENT-003 | Content Engine | Generate 90-day calendar | P2 | Calendar generation creates longer planning range without UI break. |
| C3-CONTENT-004 | Content Engine | Generate 180-day calendar | P2 | Calendar generation creates longer planning range without UI break. |
| C3-FUNNEL-001 | Funnels | Lead Magnet route | P1 | Canonical route is `/lead-magnet`. |
| C3-FUNNEL-002 | Funnels | Funnel route | P1 | Canonical route is `/funnel`. |
| C3-FUNNEL-003 | Funnels | Traffic route | P1 | Canonical route is `/traffic-engine`. |
| C3-FUNNEL-004 | Funnels | No critical `/leads` route regression | P1 | Journey/sidebar/activation do not link users to `/leads` as lead magnet. |
| C3-FUNNEL-005 | Funnels | No critical `/traffic` route regression | P1 | Journey/sidebar/activation do not link users to `/traffic`. |
| C3-ANALYTICS-001 | Analytics | Member analytics API | P1 | `/api/v1/analytics/member` returns analytics view model. |
| C3-ANALYTICS-002 | Analytics | GrowthLoopState to analytics mapping | P1 | Analytics dashboard data remains valid. |
| C3-ANALYTICS-003 | Analytics | No hard failure with empty data | P1 | Empty content/leads/customers returns valid zero-state analytics. |

## Coverage Check

- Authority layers covered: yes
- Onboarding/auth covered: yes
- Content covered: yes
- Funnel covered: yes
- Workforce covered: yes
- Analytics covered: yes
- Critical path covered: yes
