# Growth Loop Consumer Risk Report

Status: P6-003 consumer risk report
Authority: Growth Loop
Scope: discovery only
Runtime changes: none

## Risk Model

Low risk:

- read-only signal displays
- authenticated reporting routes
- no recommendation ownership
- no action ownership
- no writes

Medium risk:

- signal dashboards
- health dashboards
- report consumers with team/downline/operator scope
- bounded feature dashboards that mix display with commands

High risk:

- generates recommendations
- generates actions
- modifies CRM, leads, traffic, referrals, team, journey, or platform state
- mixed authority dashboards
- AI or admin decision surfaces

## Low-Risk Consumers

| Consumer | File Path | Domains | Reason | Candidate |
| --- | --- | --- | --- | --- |
| Member analytics API | `src/app/api/v1/analytics/member/route.ts` | acquisition, retention, expansion | Read-only member-scoped report route using `analyticsService.getMemberAnalytics`; no writes/recommendations/actions. | Primary |
| Traffic engine read API | `src/app/api/v1/traffic-engine/route.ts` | acquisition | Read-only and already projection-backed through BusinessState; not GrowthLoop first candidate. | No |
| Lead magnet read API | `src/app/api/v1/lead-magnet/route.ts` | acquisition | Narrow read-only acquisition package route; source-specific rather than report route. | No |
| Public invite validation API | `src/app/api/v1/public/member/invite/[code]/route.ts` | referral | Read-only invite validation, but public/code-scoped rather than user GrowthLoop-scoped. | No |
| Member analytics dashboard | `src/modules/analytics/components/MemberAnalytics.tsx` | acquisition, retention, expansion | Display-only consumer of member analytics API. | No, route first |

## Medium-Risk Consumers

| Consumer | File Path | Domains | Reason | Candidate |
| --- | --- | --- | --- | --- |
| Team summary API | `src/app/api/v1/team/summary/route.ts` | activation, retention, referral, expansion | Read-only team report route; response is team/downline scoped. | Secondary |
| CRM stats API | `src/app/api/v1/crm/stats/route.ts` | acquisition, retention | Read-only metrics route, but role/downline CRM filtering must be preserved. | Later |
| Analytics leader/operator APIs | `src/app/api/v1/analytics/leader/route.ts`, `src/app/api/v1/analytics/operator/route.ts` | acquisition, retention, referral, expansion | Read-only reporting but broader scope than member. | Later |
| CRM followup read API | `src/app/api/v1/crm/followups/route.ts` | retention | Read-only but tightly coupled to CRM followup semantics. | Later |
| Traffic dashboard | `src/modules/traffic-engine/components/TrafficDashboard.tsx` | acquisition | Displays signal and owns generate action. | No |
| Lead dashboard | `src/modules/lead-engine/components/LeadDashboard.tsx` | acquisition, activation | Displays pipeline and action links. | No |
| Team dashboard | `src/modules/team-engine/components/TeamDashboard.tsx` | all five | Dashboard display over synthetic/team metrics. | No |
| Franchise dashboard/API | `src/modules/franchise/components/FranchiseDashboard.tsx`, `src/app/api/v1/franchise/route.ts` | all five | Feature-bounded but mixes health, blueprints, team and replication. | No |
| Analytics center API | `src/app/api/v1/analytics-center/route.ts` | acquisition, retention, expansion | Reporting plus intelligence semantics. | Later |

## High-Risk Consumers

| Consumer | File Path | Domains | Risk Reason |
| --- | --- | --- | --- |
| DashboardV4 | `src/modules/dashboard/components/DashboardV4.tsx` | acquisition, activation, retention, expansion | Main mixed dashboard chooses user-facing experience and next action. |
| Dashboard mission hook | `src/modules/dashboard/hooks/useDashboardMission.ts` | acquisition, activation, retention, expansion | Combines mission, evolution, team, journey and AI advice into dashboard state. |
| Growth Roadmap | `src/modules/growth-roadmap/hooks/useGrowthRoadmap.ts`, `src/modules/growth-roadmap/services/roadmap-service.ts` | acquisition, activation, expansion | Owns step sequencing, next step and route recommendations. |
| AI Coach | `src/app/api/v1/ai/coach/recommend/route.ts`, `src/modules/dashboard/components/AICoachCard.tsx` | acquisition, activation, retention | Generates recommendations and actions. |
| AI recommendation panel | `src/modules/dashboard/components/AiRecommendationPanel.tsx` | acquisition, activation, retention, expansion | Local rule-based recommendation owner. |
| CEO Advisor | `src/app/api/v1/business-intel/route.ts`, `src/modules/business-intelligence/components/CEOAdvisorDashboard.tsx` | acquisition, retention, expansion | Strategic recommendations, bottlenecks, opportunities and actions. |
| CRM lead write APIs | `src/app/api/v1/crm/leads/route.ts`, `src/app/api/v1/crm/leads/[id]/route.ts` | acquisition, retention | Own lead create/update/delete behavior. |
| CRM followup write API | `src/app/api/v1/crm/leads/[id]/followup/route.ts` | retention | Owns followup writes. |
| Invite write APIs | `src/app/api/v1/member/invite/route.ts`, `src/app/api/v1/member/register/route.ts` | activation, referral, expansion | Create invites/users, set sponsor, mark invite used. |
| Traffic generation | `src/app/api/v1/traffic-engine/generate/route.ts` | acquisition | Generates traffic package. |
| Lead magnet generation | `src/app/api/v1/lead-magnet/generate/route.ts` | acquisition | Generates lead magnet package. |
| Funnel OS and funnel health | `src/app/api/v1/funnel-os/route.ts`, `src/app/api/v1/funnel/funnels/[id]/health/route.ts` | acquisition, expansion | Produces health, progress, next action and milestones. |
| Mission APIs | `src/app/api/v1/mission/state/route.ts`, `src/app/api/v1/mission/journey/route.ts`, `src/app/api/v1/mission/complete-check/route.ts` | activation and mixed growth | Journey authority and write paths. |
| Automation | `src/app/api/v1/automation/route.ts`, `src/modules/automation/components/AutomationDashboard.tsx` | acquisition, activation, retention, expansion | Workflow command/execution surface. |
| Platform admin/founder | `src/app/api/v1/platform-admin/founder/route.ts`, `src/app/(auth)/platform-admin/**` | all five | Platform operating decision authority. |
| Beta command | `src/app/(auth)/admin/beta/page.tsx`, `src/app/(auth)/platform-admin/beta/page.tsx` | all five | Beta activation/growth decision surfaces. |
| AI agents | `src/modules/ai/agents/content-director.ts`, `traffic-strategist.ts`, `crm-manager.ts`, `ceo-advisor.ts` | acquisition, retention, expansion | Generate findings, recommendations and actions from growth sources. |

## Ownership Conflicts

Acquisition conflicts:

- Lead engine, traffic engine, content engine, funnel health, funnel-os, CRM stats, analytics and CEO Advisor all produce acquisition meaning.
- Lead/funnel/content write paths own facts and must not be overridden by Growth Loop.

Activation conflicts:

- Growth Roadmap, DashboardV4, mission service, activation hook, AI Coach and revenue progress all infer activation state.
- Journey/Mission remains the activation write authority.

Retention conflicts:

- CRM followups, WhatsApp AI, analytics retention boolean, team retention and CEO Advisor all interpret retention differently.
- CRM followup service remains the followup write authority.

Referral conflicts:

- Member invite flow owns invite validity and usage.
- CRM lead `source = referral` is a different signal than member invite/sponsor referral.

Expansion conflicts:

- Team engine, franchise, platform operating, beta command, analytics, CEO Advisor and funnel-os all emit expansion meaning at different scopes.
- Platform/admin surfaces must not be first cutover targets.

## Blocked Consumer Decision

Blocked now:

- DashboardV4
- Growth Roadmap
- AI Coach
- CEO Advisor
- Workforce and Agent Runtime
- CRM write paths
- inviteService write paths
- Lead/funnel/traffic/content generation
- Mission/Journey write paths
- Automation execution
- Platform admin and beta command pages

## Early Candidate Decision

Eligible for bounded planning:

1. `GET /api/v1/analytics/member`
2. `GET /api/v1/team/summary`

Recommended P6-004 first candidate:

- `GET /api/v1/analytics/member`

Reason:

- read-only
- user/member scoped
- reporting route
- no recommendation ownership
- no action ownership
- no writes
- can use `GrowthLoopStateService` with a response-compatible view model while retaining analytics fallback if needed
