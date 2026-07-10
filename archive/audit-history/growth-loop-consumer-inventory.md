# Growth Loop Consumer Inventory

Status: P6-003 consumer audit
Authority: Growth Loop
Scope: discovery only
Runtime changes: none

## Objective

Identify current runtime consumers of acquisition, activation, retention, referral, and expansion signals. This audit does not migrate consumers, import `GrowthLoopStateService`, or retire existing sources.

## Inventory

| File Path | Consumer Name | Consumer Type | Reads Acquisition | Reads Activation | Reads Retention | Reads Referral | Reads Expansion | Current Source | Generates Signal | Generates Recommendation | Generates Action | Migration Risk | Early Cutover Candidate | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `src/modules/growth-roadmap/hooks/useGrowthRoadmap.ts` | `useGrowthRoadmap` | Growth | Yes | Yes | No | No | Yes | `getGrowthRoadmapState()` from `EvolutionSnapshot` | Yes | No | No | High | No | Blocked by spec because Growth Roadmap owns sequencing/progress display. |
| `src/modules/growth-roadmap/services/roadmap-service.ts` | `getGrowthRoadmapState` | Growth | Yes | Yes | No | No | Yes | Static roadmap steps plus `EvolutionSnapshot` | Yes | Yes | Yes | High | No | Produces current/next steps and routes; recommendation/action-like ownership. |
| `src/modules/dashboard/components/DashboardV4.tsx` | DashboardV4 | Dashboard | Yes | Yes | Yes | No | Yes | `useGrowthRoadmap`, `useDashboardMission`, `useActivation`, revenue progress | Yes | Yes | Yes | High | No | Explicitly blocked; mixed dashboard authority. |
| `src/modules/dashboard/hooks/useDashboardMission.ts` | Dashboard mission hook | Dashboard | Yes | Yes | Yes | No | Yes | mission state, evolution projection, team summary, AI coach advice | Yes | Yes | Yes | High | No | Converts mixed signals into dashboard mission/next action. |
| `src/modules/dashboard/components/AiRecommendationPanel.tsx` | Dashboard recommendation panel | Dashboard | Yes | Yes | Yes | No | Yes | mission current state and completed checks | Yes | Yes | Yes | High | No | Local rule-based recommendation owner. |
| `src/app/api/v1/ai/coach/recommend/route.ts` | AI Coach recommendation API | Dashboard | Yes | Yes | Yes | No | No | user growth facts, daily actions, content, lead and followup signals | Yes | Yes | Yes | High | No | Explicitly blocked; recommendation/action surface. |
| `src/modules/dashboard/components/AICoachCard.tsx` | AI Coach card | Dashboard | Yes | Yes | Yes | No | No | `/api/v1/ai/coach/recommend` | No | Yes | Yes | High | No | Explicitly blocked; user-facing action advice. |
| `src/modules/lead-engine/components/LeadDashboard.tsx` | Lead dashboard | Lead | Yes | Yes | No | No | No | `useLeadEngine`, `useDashboardMission` | Yes | No | Yes | Medium | No | Displays pipeline and action links; not a pure report. |
| `src/app/api/v1/crm/leads/route.ts` | CRM leads API | Lead | Yes | No | Yes | No | No | `leadService.list`, `leadService.create` | Yes | No | Yes | High | No | Owns lead read/write; blocked for cutover. |
| `src/app/api/v1/crm/leads/[id]/route.ts` | CRM lead detail API | Lead | Yes | No | Yes | No | No | `leadService.getById`, `update`, `delete` | Yes | No | Yes | High | No | CRM write path; blocked. |
| `src/app/api/v1/crm/stats/route.ts` | CRM stats API | CRM | Yes | No | Yes | No | No | direct Prisma lead/activity counts | Yes | No | No | Medium | No | Read-only metrics route, but role/downline filtering makes it a later candidate, not first. |
| `src/app/api/v1/crm-center/route.ts` | CRM command center API | CRM | Yes | No | Yes | No | No | `crmCenterService.getCommandCenter()` | Yes | Yes | Yes | High | No | Produces advisor tips and hot lead actions. |
| `src/app/api/v1/crm/followups/route.ts` | CRM followup read API | CRM | No | No | Yes | No | No | `followupService.getFollowupCounts`, `getTodayFollowups` | Yes | No | No | Medium | No | Read-only retention route, but tightly coupled to CRM followup semantics. |
| `src/app/api/v1/crm/leads/[id]/followup/route.ts` | CRM followup write API | CRM | No | No | Yes | No | No | `followupService.setFollowup` | Yes | No | Yes | High | No | CRM write path; blocked. |
| `src/app/api/v1/traffic-engine/route.ts` | Traffic engine read API | Traffic | Yes | No | No | No | No | `businessStateService` plus traffic readiness view model | Yes | No | No | Low | No | Already migrated to BusinessState projection; not a GrowthLoop first cutover. |
| `src/app/api/v1/traffic-engine/generate/route.ts` | Traffic engine generate API | Traffic | Yes | No | No | No | No | `trafficEngineService.generate` | Yes | Yes | Yes | High | No | Generates traffic package; blocked. |
| `src/modules/traffic-engine/components/TrafficDashboard.tsx` | Traffic dashboard | Traffic | Yes | No | No | No | No | `/api/v1/traffic-engine`, generate mutation | No | Yes | Yes | Medium | No | Mixes signal display and generation command. |
| `src/app/api/v1/lead-magnet/route.ts` | Lead magnet read API | Lead | Yes | No | No | No | No | `leadMagnetService.get` | Yes | No | No | Low | No | Narrow acquisition source; not a report route. |
| `src/app/api/v1/lead-magnet/generate/route.ts` | Lead magnet generate API | Lead | Yes | No | No | No | No | `leadMagnetService.generate` | Yes | Yes | Yes | High | No | Generates acquisition asset; blocked. |
| `src/app/api/v1/content-engine/route.ts` | Content engine aggregate API | Growth | Yes | No | Yes | No | No | content engine service and calendar/content facts | Yes | Yes | Yes | Medium | No | Content source and recommendation surface, not first cutover. |
| `src/app/api/v1/funnel-os/route.ts` | Funnel OS aggregate API | Growth | Yes | No | No | No | Yes | funnel progress, funnel health, lead/content/customer counts | Yes | Yes | Yes | High | No | Produces progress, health, next action, milestones. |
| `src/app/api/v1/funnel/funnels/[id]/health/route.ts` | Funnel health API | Growth | Yes | No | No | No | Yes | `funnelHealthService.calculate()` | Yes | Yes | Yes | High | No | Health and action owner; blocked. |
| `src/modules/activation/hooks/useActivation.ts` | Activation hook | Growth | No | Yes | No | No | No | `DAY_MISSIONS`, activation scoring helpers | Yes | Yes | Yes | Medium | No | Activation projection with mission advice. |
| `src/modules/activation/components/ActivationDashboard.tsx` | Activation dashboard | Dashboard | No | Yes | No | No | No | `useActivation()` | No | Yes | Yes | High | No | Dashboard/action owner; blocked. |
| `src/app/api/v1/mission/state/route.ts` | Mission state API | Growth | No | Yes | No | No | No | `missionService.getState()` | Yes | Yes | Yes | High | No | Journey/activation authority; blocked. |
| `src/app/api/v1/mission/journey/route.ts` | Mission journey API | Growth | Yes | Yes | Yes | No | Yes | `missionService.getJourneyMap()` | Yes | Yes | Yes | High | No | Mixed journey map authority; blocked. |
| `src/app/api/v1/mission/complete-check/route.ts` | Mission complete check API | Growth | No | Yes | No | No | No | `missionService.completeCheck()` | Yes | No | Yes | High | No | Write path; blocked. |
| `src/app/api/v1/member/invite/route.ts` | Member invite API | Referral | No | No | No | Yes | Yes | `inviteService.listActiveInvites`, `createInvite` | Yes | No | Yes | High | No | Invite write path; blocked. |
| `src/app/api/v1/public/member/invite/[code]/route.ts` | Public invite validation API | Referral | No | No | No | Yes | No | `inviteService.validateInvite` | Yes | No | No | Low | No | Read-only but public/code-scoped, not user GrowthLoop-scoped. |
| `src/app/api/v1/member/register/route.ts` | Invite registration API | Referral | No | Yes | No | Yes | Yes | invite validation, user creation, sponsor assignment, audit log | Yes | No | Yes | High | No | Referral write/activation path; blocked. |
| `src/modules/member/components/MemberInvitePanel.tsx` | Member invite panel | Referral | No | No | No | Yes | Yes | `/api/v1/member/invite` | No | No | Yes | Medium | No | UI wrapper over invite create/list. |
| `src/modules/member/components/JoinInviteForm.tsx` | Join invite form | Referral | No | Yes | No | Yes | Yes | public invite validation and registration APIs | No | No | Yes | Medium | No | UI wrapper over registration write. |
| `src/app/api/v1/team/summary/route.ts` | Team summary API | Expansion | No | Yes | Yes | Yes | Yes | `teamService.getTeamSummary` | Yes | No | No | Low | Yes | Read-only team growth report route; secondary candidate. |
| `src/modules/team/services/team-service.ts` | Team service summary/read models | Expansion | Yes | Yes | Yes | Yes | Yes | users, leads, content, daily actions, training progress | Yes | No | No | Medium | No | Service owns team read model; route-level cutover only if response preserved. |
| `src/modules/team-engine/hooks/useTeamEngine.ts` | Team engine hook | Expansion | Yes | Yes | Yes | Yes | Yes | EvolutionProjection plus synthetic team stats | Yes | Yes | Yes | High | No | Synthetic metrics and team recommendations; blocked. |
| `src/modules/team-engine/components/TeamDashboard.tsx` | Team dashboard | Expansion | Yes | Yes | Yes | Yes | Yes | `useTeamEngine()` | No | Yes | Yes | Medium | No | Dashboard, not first cutover. |
| `src/app/api/v1/franchise/route.ts` | Franchise API | Expansion | Yes | Yes | Yes | Yes | Yes | `franchiseService` health, members, blueprints, assignment | Yes | Yes | Yes | Medium | No | Franchise-specific authority; not first cutover. |
| `src/modules/franchise/components/FranchiseDashboard.tsx` | Franchise dashboard | Expansion | Yes | Yes | Yes | Yes | Yes | `/api/v1/franchise` | No | Yes | Yes | Medium | No | Dashboard/report hybrid. |
| `src/app/api/v1/analytics/member/route.ts` | Member analytics API | Expansion | Yes | No | Yes | No | Yes | `analyticsService.getMemberAnalytics` | Yes | No | No | Low | Yes | Read-only member report route; primary candidate. |
| `src/app/api/v1/analytics/leader/route.ts` | Leader analytics API | Expansion | Yes | No | Yes | Yes | Yes | `analyticsService.getLeaderAnalytics` | Yes | No | No | Medium | No | Read-only but team/downline scoped; later candidate. |
| `src/app/api/v1/analytics/operator/route.ts` | Operator analytics API | Expansion | Yes | No | Yes | Yes | Yes | `analyticsService.getOperatorAnalytics` | Yes | No | No | Medium | No | Read-only but tenant/operator scoped; later candidate. |
| `src/app/api/v1/analytics-center/route.ts` | Analytics center API | Expansion | Yes | No | Yes | No | Yes | `analyticsService.getAnalyticsCenter` | Yes | Yes | No | Medium | No | Reporting plus advisor/intelligence semantics. |
| `src/modules/analytics/components/MemberAnalytics.tsx` | Member analytics dashboard | Dashboard | Yes | No | Yes | No | Yes | `/api/v1/analytics/member` | No | No | No | Low | No | Display-only dashboard; can follow route cutover. |
| `src/modules/analytics/components/LeaderAnalytics.tsx` | Leader analytics dashboard | Dashboard | Yes | No | Yes | Yes | Yes | `/api/v1/analytics/leader` | No | No | No | Medium | No | Display-only but team scoped. |
| `src/modules/analytics/components/OperatorAnalytics.tsx` | Operator analytics dashboard | Dashboard | Yes | No | Yes | Yes | Yes | `/api/v1/analytics/operator` | No | No | No | Medium | No | Display-only but operator scoped. |
| `src/app/api/v1/business-intel/route.ts` | Business intelligence API | Expansion | Yes | No | Yes | No | Yes | `COOPlanService`, CEO report compatibility | Yes | Yes | Yes | High | No | CEO Advisor/AI COO recommendation surface; blocked. |
| `src/modules/business-intelligence/components/CEOAdvisorDashboard.tsx` | CEO Advisor dashboard | Dashboard | Yes | No | Yes | No | Yes | `/api/v1/business-intel` | No | Yes | Yes | High | No | Explicitly blocked. |
| `src/app/api/v1/automation/route.ts` | Automation API | Expansion | Yes | Yes | Yes | No | Yes | automation metadata/workflow execution | Yes | Yes | Yes | High | No | Can execute workflows; blocked. |
| `src/modules/automation/components/AutomationDashboard.tsx` | Automation dashboard | Dashboard | Yes | Yes | Yes | No | Yes | `/api/v1/automation`, workflow templates | No | Yes | Yes | High | No | Command surface; blocked. |
| `src/app/api/v1/platform-admin/founder/route.ts` | Founder platform API | Expansion | Yes | Yes | Yes | Yes | Yes | `platformOperatingService.getOperatingData` | Yes | Yes | Yes | High | No | Platform operating authority; blocked. |
| `src/app/(auth)/platform-admin/page.tsx` | Platform CEO page | Expansion | Yes | Yes | Yes | Yes | Yes | `platformOperatingService` and dashboard components | Yes | Yes | Yes | High | No | Platform admin decision surface. |
| `src/app/(auth)/platform-admin/growth/page.tsx` | Platform growth page | Expansion | Yes | Yes | Yes | Yes | Yes | `platformOperatingService`, `GrowthDashboard` | Yes | Yes | Yes | High | No | Platform growth decision surface. |
| `src/app/(auth)/admin/beta/page.tsx` | Admin beta page | Expansion | Yes | Yes | Yes | Yes | Yes | `betaCommandService.getTenantReport` | Yes | Yes | Yes | High | No | Beta funnel/platform activation report with decisions. |
| `src/app/(auth)/platform-admin/beta/page.tsx` | Platform beta page | Expansion | Yes | Yes | Yes | Yes | Yes | `betaCommandService.getTenantReport` | Yes | Yes | Yes | High | No | Platform beta decision surface. |
| `src/modules/ai/agents/content-director.ts` | Content Director agent | Growth | Yes | No | Yes | No | No | content service facts | Yes | Yes | Yes | High | No | AI agent action recommendations; blocked. |
| `src/modules/ai/agents/traffic-strategist.ts` | Traffic Strategist agent | Traffic | Yes | No | No | No | No | `trafficEngineService.get` | Yes | Yes | Yes | High | No | AI agent action recommendations; blocked. |
| `src/modules/ai/agents/crm-manager.ts` | CRM Manager agent | CRM | Yes | No | Yes | No | No | `crmCenterService.getCommandCenter` | Yes | Yes | Yes | High | No | AI agent action recommendations; blocked. |
| `src/modules/ai/agents/ceo-advisor.ts` | CEO Advisor agent | Expansion | Yes | No | Yes | No | Yes | analytics/business context | Yes | Yes | Yes | High | No | AI agent strategic recommendations; blocked. |

## Early Cutover Candidates

Primary candidate:

- `GET /api/v1/analytics/member`
- File: `src/app/api/v1/analytics/member/route.ts`
- Reason: read-only authenticated reporting route, no action ownership, no write behavior, member/user scope aligns with `GrowthLoopStateService.getGrowthLoopState(user.id)`.

Secondary candidate:

- `GET /api/v1/team/summary`
- File: `src/app/api/v1/team/summary/route.ts`
- Reason: read-only team growth report route, but response is team/downline scoped and should follow after the member analytics route.

## Blocked Consumers

Must remain blocked:

- DashboardV4
- Growth Roadmap
- AI Coach
- CEO Advisor
- Workforce
- Agent Runtime
- CRM write paths
- inviteService write paths
- lead/funnel/traffic/content generation paths
- platform admin decision surfaces
- automation execution surfaces
