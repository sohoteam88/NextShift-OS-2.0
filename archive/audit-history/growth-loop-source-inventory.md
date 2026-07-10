# Growth Loop Source Inventory

Task: `TASK_016_GROWTH_LOOP_SOURCE_AUDIT`

Target authority: `GrowthLoop`

Authority question:

```text
How does the system grow itself?
```

Scope: discovery only. This file documents current runtime sources that contribute to acquisition, activation, retention, referral, and expansion. It does not propose migration steps or implementation changes.

## Inventory

| File Path | Source Name | Authority Role | Read Path | Write Path | Active Status | Migration Risk |
| --- | --- | --- | --- | --- | --- | --- |
| `src/modules/lead-magnet/leadMagnetService.ts` | Lead magnet generation and storage | Acquisition | Reads BrandContext and user metadata | Writes `user.metadata.lead_magnet` | Active | Medium |
| `src/app/api/v1/lead-magnet/generate/route.ts` | Lead magnet generation API | Acquisition | Consumes authenticated user request | Calls `leadMagnetService.generate()` | Active | Medium |
| `src/app/api/v1/lead-magnet/route.ts` | Lead magnet read API | Acquisition | Reads authenticated user lead magnet | No direct writes observed | Active | Low |
| `src/modules/lead-magnet/leadSegmentationEngine.ts` | Lead magnet segmentation logic | Acquisition | Consumes lead magnet result shapes | No DB writes observed | Active | Low |
| `src/modules/funnel/services/funnel-service.ts` | Funnel CRUD and publish service | Acquisition | Reads `Funnel`, `FunnelTemplate`, tenant quota | Writes `Funnel`, increments `views`, publishes/unpublishes funnels | Active | High |
| `src/modules/funnel/services/funnel-builder-service.ts` | AI funnel package to funnel creation | Acquisition | Reads generated funnel package and user context | Calls `funnelService.createInternal()` | Active | High |
| `src/app/api/v1/funnel/funnels/route.ts` | Funnel CRUD API | Acquisition | Consumes `funnelService` | Writes through `funnelService` | Active | Medium |
| `src/app/api/v1/funnel/funnels/[id]/publish/route.ts` | Funnel publish API | Acquisition | Reads authenticated funnel ownership | Writes funnel status through `funnelService.publish()` | Active | Medium |
| `src/app/api/v1/public/funnel/[slug]/submit/route.ts` | Public funnel lead capture | Acquisition | Reads published `Funnel` by slug | Creates `Lead`, updates lead score, writes `Activity`, increments `Funnel.conversions` | Active | High |
| `src/modules/funnel/services/funnel-progress-service.ts` | Funnel progress signal service | Acquisition / Expansion | Reads `Content`, `VideoProject`, `Lead`, `Customer`, `User.metadata` | No direct writes observed | Active | Medium |
| `src/modules/funnel/services/funnel-health-service.ts` | Funnel health and next-action engine | Acquisition / Expansion | Reads `Funnel` and activity counts | No direct writes observed | Active | High |
| `src/app/api/v1/funnel-os/route.ts` | Funnel OS aggregate API | Acquisition / Expansion | Reads funnel progress, funnel health, content/video/lead/customer/funnel counts | No direct writes observed | Active | High |
| `src/modules/traffic-engine/trafficEngineService.ts` | Traffic package generation | Acquisition | Reads BrandContext, `user.metadata`, `Content` count | Writes `user.metadata.traffic_engine` | Active | Medium |
| `src/app/api/v1/traffic-engine/generate/route.ts` | Traffic generation API | Acquisition | Consumes authenticated request | Calls `trafficEngineService.generate()` | Active | Medium |
| `src/modules/content-engine/contentEngineService.ts` | Content pillars, calendar, post generation | Acquisition / Retention | Reads BrandContext, `BrandProfile`, `Content`, `ContentCalendar` | Writes `BrandProfile.contentPillars`, `ContentCalendar`, `Content`, published status | Active | High |
| `src/app/api/v1/content-engine/generate/route.ts` | Content post generation API | Acquisition / Retention | Reads user, tenant, platform, format, funnel stage | Writes `Content` through `contentEngineService.generatePlatformPost()` | Active | Medium |
| `src/app/api/v1/content-engine/calendar/route.ts` | Content calendar API | Acquisition / Retention | Reads calendar rows | Writes generated `ContentCalendar` rows through service | Active | Medium |
| `src/modules/crm/services/lead-service.ts` | CRM lead CRUD and scoring | Acquisition / Retention | Reads `Lead`, tags, owner/downline scope | Creates and updates `Lead`, recalculates score, writes `Activity` | Active | High |
| `src/modules/crm/types.ts` | CRM lead source and pipeline definitions | Acquisition / Retention | Used by CRM services and UI | No direct writes | Active | Medium |
| `src/app/api/v1/crm/leads/route.ts` | CRM lead API | Acquisition / Retention | Consumes `leadService` | Writes leads through `leadService.create()` | Active | High |
| `src/modules/activation/services/activation-service.ts` | 7-day activation mission source | Activation | Reads completed event array supplied by consumers | No DB writes observed | Active | High |
| `src/modules/activation/hooks/useActivation.ts` | Activation projection hook | Activation | Reads mission/progress data used by activation UI | No direct writes observed | Active | Medium |
| `src/modules/activation/components/ActivationDashboard.tsx` | Activation dashboard consumer | Activation | Reads `useActivation()` | No direct writes observed | Active | Low |
| `src/modules/member/services/onboarding-service.ts` | Member onboarding service | Activation | Reads and calculates onboarding progress | Writes onboarding/profile-related state through member APIs | Active | Medium |
| `src/app/api/v1/member/onboarding/route.ts` | Member onboarding API | Activation | Reads authenticated onboarding state | Writes onboarding state through service | Active | Medium |
| `src/modules/mission/constants/journey-map.ts` | Mission journey map | Activation / Acquisition / Retention | Read by journey and mission UI | No direct writes | Active | High |
| `src/modules/mission-engine/missionStages.ts` | Mission engine stage source | Activation / Acquisition / Retention | Read by mission engine and dashboard mission consumers | No direct writes | Active | High |
| `src/modules/mission-engine/services/mission-service.ts` | Mission service next-stage logic | Activation / Acquisition | Reads input state such as brand/content/lead/customer flags | No direct DB writes observed in audited path | Active | High |
| `src/modules/mission/services/mission-service.ts` | Mission runtime state service | Activation | Reads and writes user mission state | Writes mission progress/state through mission APIs | Active | High |
| `src/modules/growth-roadmap/services/roadmap-service.ts` | Growth roadmap step projection | Activation / Acquisition / Expansion | Reads EvolutionSnapshot | No direct writes | Active | High |
| `src/modules/revenue-activation/services/revenue-journey-service.ts` | 30-day first revenue journey | Activation / Expansion | Reads completed revenue event names | No DB writes observed | Active | Medium |
| `src/modules/crm/services/followup-service.ts` | CRM followup schedule service | Retention | Reads `Lead.nextFollowup` by tenant/owner/downline | Writes `Lead.nextFollowup`, writes `Activity` followup events | Active | High |
| `src/modules/crm/hooks/use-followup.ts` | CRM followup hook | Retention | Reads `/api/v1/crm/followups` | Writes `/api/v1/crm/leads/[id]/followup` | Active | Medium |
| `src/app/api/v1/crm/followups/route.ts` | CRM followup read API | Retention | Reads followup counts/today lists through `followupService` | No direct writes | Active | Medium |
| `src/app/api/v1/crm/leads/[id]/followup/route.ts` | CRM lead followup write API | Retention | Reads request body and lead ownership | Writes followup date through `followupService.setFollowup()` | Active | High |
| `src/modules/crm/crmCenterService.ts` | CRM command center aggregate | Retention / Acquisition | Reads leads, scores, stages, followup dates | No direct writes | Active | High |
| `src/modules/crm/crmEngines.ts` | CRM advisor tips | Retention | Reads aggregate counts supplied by CRM center | No direct writes | Active | Medium |
| `src/app/api/v1/crm/stats/route.ts` | CRM stats API | Retention / Acquisition | Reads lead counts, score buckets, conversion rate, followup counts, activity counts | No direct writes | Active | Medium |
| `src/modules/whatsapp-ai/whatsappService.ts` | WhatsApp AI package generation | Retention | Reads BrandContext and CRM leads | Writes `user.metadata.whatsapp_ai` | Active | High |
| `src/modules/whatsapp-ai/whatsappEngines.ts` | WhatsApp reply, scoring, followup engines | Retention | Reads BrandContext and lead score inputs | No DB writes | Active | High |
| `src/app/api/v1/whatsapp-ai/generate/route.ts` | WhatsApp package generation API | Retention / Activation | Reads authenticated user | Writes WhatsApp package through service and calls mission progress notification | Active | High |
| `src/modules/automation/automationEngine.ts` | Automation workflow execution | Acquisition / Retention / Expansion | Reads `user.metadata.automation_workflows` and enabled templates | Writes `Lead` and `Activity` for workflow actions | Active | High |
| `src/modules/automation/workflowTemplates.ts` | Built-in automation templates | Acquisition / Retention / Activation | Read by automation engine | No direct writes | Active | High |
| `src/app/api/v1/automation/route.ts` | Automation API | Acquisition / Retention / Expansion | Reads user automation config | Writes automation workflow metadata through automation service/API path | Active | Medium |
| `src/modules/analytics/services/analytics-service.ts` | Analytics member retention and funnel metrics | Retention / Expansion | Reads users, leads, activities, content, AI usage, daily actions, funnels/events | No direct writes observed | Active | High |
| `src/app/api/v1/analytics/operator/route.ts` | Operator analytics API | Retention / Expansion | Reads analytics dashboard data | No direct writes | Active | Medium |
| `src/app/api/v1/analytics/leader/route.ts` | Leader analytics API | Retention / Expansion | Reads analytics dashboard data | No direct writes | Active | Medium |
| `src/modules/member/services/invite-service.ts` | Member invite service | Referral | Reads `InviteCode`, sponsor, tenant | Creates `InviteCode`, validates invite, marks invite used | Active | High |
| `src/app/api/v1/member/invite/route.ts` | Member invite create/list API | Referral | Reads active invites through `inviteService` | Creates invite through `inviteService.createInvite()` | Active | Medium |
| `src/app/api/v1/public/member/invite/[code]/route.ts` | Public invite validation API | Referral | Reads invite through `inviteService.validateInvite()` | No direct writes | Active | Low |
| `src/app/api/v1/member/register/route.ts` | Invite-based member registration | Referral / Activation | Reads invite, auth user, existing user | Creates `User`, updates `InviteCode.used`, writes `AuditLog` | Active | High |
| `src/modules/member/components/MemberInvitePanel.tsx` | Invite generation UI | Referral | Reads `/api/v1/member/invite` | Posts `/api/v1/member/invite` | Active | Low |
| `src/modules/member/components/JoinInviteForm.tsx` | Join invite form UI | Referral | Reads `/api/v1/public/member/invite/[code]` | Posts `/api/v1/member/register` | Active | Low |
| `src/modules/admin/services/platformOperatingService.ts` | Platform operating growth/beta metrics | Expansion | Reads tenants, users, funnels, leads, customers, content, AI usage, invite count | No direct writes | Active | High |
| `src/modules/admin/services/beta-command-service.ts` | Tenant beta activation funnel | Expansion / Activation | Reads invites, active users, brand profiles, content, video, funnels, leads, appointments, customers, members | No direct writes | Active | High |
| `src/modules/admin/services/system-monitoring.ts` | Growth windows, alerts, funnel analysis | Expansion | Reads supplied users, tenants, contents, lead groups, customers, funnels, tenant health | No direct writes | Active | High |
| `src/modules/team-engine/hooks/useTeamEngine.ts` | Team engine metrics hook | Expansion / Retention | Reads EvolutionSnapshot | No DB writes; returns synthetic retention/growth metrics | Active | High |
| `src/modules/team-engine/types/team.types.ts` | Team retention/growth metric types | Expansion / Retention | Used by team engine UI/hook | No direct writes | Active | Medium |
| `src/modules/franchise/franchiseService.ts` | Franchise replication and health service | Expansion / Retention / Referral | Reads sponsored users, UserProgress, leads, content, metadata blueprints | Writes `user.metadata.master_blueprints` and `user.metadata.blueprint_assignment` | Active | High |
| `src/app/api/v1/franchise/route.ts` | Franchise API | Expansion | Consumes franchise service | Writes/reads franchise metadata depending on action | Active | Medium |
| `src/modules/business-intelligence/ceoAdvisorEngine.ts` | CEO advisor growth opportunity engine | Acquisition / Retention / Expansion | Reads BrandContext, content/video/lead/customer/funnel counts, user metadata | No direct writes; emits health, bottlenecks, opportunities, actions, automation recs | Active | High |
| `src/app/api/v1/business-intel/route.ts` | Business intelligence API | Acquisition / Retention / Expansion | Reads CEO advisor report | No direct writes observed | Active | Medium |
| `src/modules/dashboard/components/AiRecommendationPanel.tsx` | Dashboard local recommendation rules | Acquisition / Retention / Activation | Reads local dashboard/user/module state | No direct writes observed | Active | High |
| `src/app/api/v1/ai/coach/recommend/route.ts` | AI coach recommendation API | Acquisition / Retention / Activation | Reads authenticated user and growth state | No direct writes observed in audited role | Active | High |

## Domain Coverage

### Acquisition Sources Identified

- Lead magnet generation and metadata storage
- Funnel creation, publishing, tracking, and public submit flow
- Funnel OS progress, health, and next-action aggregation
- Traffic engine package generation
- Content engine posts, calendars, and published count
- CRM lead creation and lead source classification
- CEO advisor acquisition opportunities

### Activation Sources Identified

- 7-day activation service
- Member onboarding services and APIs
- Mission journey map
- Mission engine stages and mission service
- Growth roadmap projection
- Revenue activation milestones
- WhatsApp generation mission notification

### Retention Sources Identified

- CRM followup service and APIs
- CRM center and advisor tips
- CRM stats API
- WhatsApp AI followup templates and best followups
- Automation followup workflows
- Analytics retention flag
- Team/franchise retention metrics

### Referral Sources Identified

- Member invite service
- Member invite API
- Public invite validation API
- Invite-based member registration
- Member invite and join UI consumers

### Expansion Sources Identified

- Platform operating service
- Beta command service
- System monitoring growth windows and funnel analysis
- Team engine retention/growth metrics
- Franchise health and replication services
- CEO advisor growth opportunities and automation recommendations
- Funnel OS upgrade/recruitment funnel classification

## Audit Question Answers

### Which growth domain does each source own?

No single source owns Growth Loop today. Ownership is distributed:

- Acquisition: lead magnet, funnel, traffic engine, content engine, CRM lead capture, funnel-os, CEO advisor.
- Activation: activation service, onboarding, mission, growth roadmap, revenue activation.
- Retention: CRM followup, WhatsApp AI, automation, analytics, team-engine, franchise.
- Referral: invite-service, public invite validation, member registration, invite UI.
- Expansion: platform operating, beta command, system monitoring, team-engine, franchise, CEO advisor, automation.

### Is it duplicated elsewhere?

Yes. Duplication exists in all five domains. See `audit/growth-loop-duplicate-authorities.md`.

### Should it become part of GrowthLoop?

These sources should become GrowthLoop signal inputs only. They should not become GrowthLoop-owned command paths unless a later architecture task explicitly changes ownership.

### Should it eventually retire?

Discovery conclusion only:

- Read-only signal producers should generally stay as domain sources.
- Duplicate recommendation and next-action producers need later authority review.
- Direct writers such as `funnelService`, `leadService`, `followupService`, `inviteService`, and `member/register` should not be retired without a migration task.
