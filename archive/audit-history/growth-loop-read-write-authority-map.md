# Growth Loop Read / Write Authority Map

Task: `TASK_018_GROWTH_LOOP_PRECEDENCE_AUDIT`

Scope: current runtime read paths, write paths, strongest authority chain, and effective ownership for Growth Loop-relevant sources.

## Acquisition Authorities

| Source | Reads From | Writes To | Primary Consumers | Effective Ownership | Notes |
| --- | --- | --- | --- | --- | --- |
| `funnelService` | `Funnel`, `FunnelTemplate`, quota state | `Funnel` rows, status, config, publish state, views | public funnel pages, funnel APIs, funnel builder, funnel admin | Funnel acquisition state | strongest funnel record authority |
| public funnel submit route | published `Funnel`, request body | `Lead`, `Activity`, `Funnel.conversions`, lead score | public funnel forms, CRM, analytics, funnel metrics | Public lead capture | strongest public acquisition write path |
| `leadService` | `Lead`, tags, owner/downline scope | `Lead`, lead score, `Activity` | CRM APIs, CRM dashboard, analytics, AI/CRM agents | CRM lead state | strongest CRM lead authority |
| `contentEngineService` | BrandContext, `BrandProfile`, `Content`, `ContentCalendar` | `Content`, `ContentCalendar`, `BrandProfile.contentPillars` | content dashboard, analytics, CEO Advisor, platform/beta | Content acquisition state | content is acquisition and retention input |
| `leadMagnetService` | BrandContext, user metadata | `user.metadata.lead_magnet` | lead magnet dashboard, traffic, funnel/AI agents | Lead magnet package | metadata package, not lead record authority |
| `trafficEngineService` | BrandContext, metadata, `Content` count | `user.metadata.traffic_engine` | traffic dashboard, AI traffic agent | Traffic readiness package | readiness/advisory package |
| `funnelProgressService` / `funnelHealthService` | DB counts, `Funnel`, metadata, package structures | none | funnel-os, funnel health API, funnel builder | Funnel projection/readiness | read-only derived authority |
| `ceoAdvisorEngine` | BrandContext, counts, metadata | none | CEO mode, business-intel API, AI agents | Strategic acquisition recommendation | advisory only |

## Activation Authorities

| Source | Reads From | Writes To | Primary Consumers | Effective Ownership | Notes |
| --- | --- | --- | --- | --- | --- |
| `missionService` | `userProgress`, journey map helpers | `userProgress` through complete/check/mode paths | mission APIs, journey, dashboard, activation, evolution adapter | Modern activation/progress state | strongest persisted activation chain |
| `activation-service` / `useActivation()` | mission state/completed events | none | `ActivationDashboard`, `DashboardV4` | Activation projection | read-time day/score/level model |
| `growth-roadmap` | EvolutionSnapshot | none | dashboard roadmap, roadmap components | Roadmap projection | read-only step projection |
| `mission-engine` | legacy mission stages/progress inputs | legacy mission progress paths | dashboard mission selector, legacy mission consumers | Legacy mission selection | duplicate activation/mission semantics |
| `revenue-activation` | completed revenue events, revenue inputs | none | dashboard revenue progress | First revenue projection | sidecar activation/expansion model |
| onboarding services/APIs | user/member onboarding fields | onboarding/profile state | onboarding pages, member onboarding APIs | Onboarding subdomain | activation input, not GrowthLoop authority |

## Retention Authorities

| Source | Reads From | Writes To | Primary Consumers | Effective Ownership | Notes |
| --- | --- | --- | --- | --- | --- |
| `followupService` | `Lead.nextFollowup`, tenant/owner/downline scope | `Lead.nextFollowup`, `Activity` followup events | followup APIs, followup hook, `FollowupWidget`, CRM dashboard | CRM followup state | strongest retention write authority |
| `crmCenterService` | leads, scores, stages, followup dates | none | CRM command center API, CRM dashboard, CRM AI agent | CRM retention/acquisition aggregate | read-only aggregate |
| `whatsappService` / `whatsappEngines` | BrandContext, CRM leads | `user.metadata.whatsapp_ai` | WhatsApp dashboard, sales coach, WhatsApp APIs | WhatsApp retention package | owns followup copy/templates, not due dates |
| `automationEngine` | `user.metadata.automation_workflows`, templates, events | `Lead`, `Activity` depending on action | automation API/dashboard, CEO recommendations | Automation action executor | can affect acquisition/retention facts |
| `analytics-service` | users, leads, activities, content, AI usage, daily actions, funnels/events | none | analytics APIs/dashboards, AI CEO wrapper | Reporting retention | read-only reporting authority |
| `team-engine` | EvolutionSnapshot | none | team dashboard | Team retention display | partly synthetic current metrics |
| `franchiseService` | sponsored users, `UserProgress`, leads, content, metadata | `user.metadata.master_blueprints`, `user.metadata.blueprint_assignment` | franchise API/dashboard | Franchise retention/replication | team-level retention/expansion |

## Referral Authorities

| Source | Reads From | Writes To | Primary Consumers | Effective Ownership | Notes |
| --- | --- | --- | --- | --- | --- |
| `inviteService` | `InviteCode`, sponsor, tenant | `InviteCode` create/mark-used method | member invite API, public invite API, member registration | Invite validity and creation | strongest invite service authority |
| `member/invite` API | `inviteService` | `InviteCode` through service | `MemberInvitePanel` | Invite UI command path | route wrapper |
| public invite API | `inviteService.validateInvite()` | none | `JoinInviteForm` | Invite read/validation | read-only public validation |
| `member/register` API | invite validation, auth user, existing user | `User`, `InviteCode.used`, `AuditLog`, sponsor metadata | join flow, approval/member systems | Invite consumption | strongest referral write transaction |
| CRM `LeadSource = 'referral'` | lead source labels | lead source via lead writes | CRM lead views/reporting | Referral lead classification | separate from member invite authority |

## Expansion Authorities

| Source | Reads From | Writes To | Primary Consumers | Effective Ownership | Notes |
| --- | --- | --- | --- | --- | --- |
| `platformOperatingService` | tenants, users, funnels, leads, customers, content, AI usage, invite count | none | platform admin pages, founder API, platform dashboards | Platform growth aggregate | strongest platform expansion read chain |
| `betaCommandService` | invite, user, brand, content, video, funnel, lead, appointment, customer, member, AI usage data | none | admin beta pages, platform beta page | Beta activation funnel | tenant beta growth aggregate |
| `system-monitoring` | supplied platform records and tenant health | none | platform operating service | Growth windows, alerts, funnel analysis | helper authority under platform operating |
| `franchiseService` | sponsored users, progress, leads, content, metadata | blueprint and assignment metadata | franchise dashboard/API | Franchise expansion | team-level expansion and replication |
| `team-engine` | EvolutionSnapshot | none | team dashboard | Team expansion display | current metrics are synthetic/derived |
| `ceoAdvisorEngine` | counts, metadata, BrandContext | none | CEO mode, business-intel API | Strategic expansion recommendation | advisory |
| `automationEngine` | workflow metadata/templates/events | `Lead`, `Activity` | automation dashboard/API | Expansion action executor | workflow-driven scaling actions |
| `funnel-os` | funnel progress/health, content/video/lead/customer/funnel counts | none | funnel operating card/API | Upgrade/recruitment expansion projection | read-only projection |

## Strongest Read Chains

| Projection | Strongest Read Chain |
| --- | --- |
| acquisition | persisted DB facts and metadata -> domain services -> funnel/lead/content/traffic/lead magnet/funnel-os consumers |
| activation | `userProgress` / completed checks -> `missionService` -> mission APIs/hooks -> dashboard/journey/activation wrappers |
| retention | `Lead.nextFollowup` / CRM lead records -> `followupService` / `crmCenterService` -> CRM/followup/WhatsApp/AI consumers |
| referral | `InviteCode` / sponsor data -> `inviteService` -> invite APIs/UI -> registration |
| expansion | tenants/users/funnels/leads/customers/content/AI usage/invites -> `platformOperatingService` / beta/system-monitoring -> platform dashboards |

## Strongest Write Chains

| Projection | Strongest Write Chain |
| --- | --- |
| acquisition | `funnelService` writes `Funnel`; public funnel submit writes `Lead`/`Activity`/conversions; `leadService` writes CRM leads; `contentEngineService` writes content/calendar |
| activation | `missionService` writes modern mission/progress state; onboarding APIs write onboarding substate |
| retention | `followupService` writes `Lead.nextFollowup`; automation can write `Lead`/`Activity`; WhatsApp writes package metadata |
| referral | `inviteService` creates invites; `member/register` consumes invite and creates member/sponsor relationship |
| expansion | `franchiseService` writes blueprint/assignment metadata; automation writes action side effects; platform/beta/system monitoring are read-only aggregates |

## Effective Read / Write Winners

| Projection | Strongest Read Winner | Strongest Write Winner | Current Runtime Status |
| --- | --- | --- | --- |
| acquisition | DB facts through `funnelService`, `leadService`, `contentEngineService`, funnel-os | `funnelService`, public submit route, `leadService`, `contentEngineService` | split by acquisition subdomain |
| activation | `missionService` on modern surfaces, `useActivation`/roadmap/revenue sidecars on their own surfaces | `missionService` for modern progress; onboarding APIs for onboarding substate | surface-local |
| retention | `followupService` for due followups, CRM/WhatsApp/analytics/team/franchise on their own surfaces | `followupService`, automation, WhatsApp package save | split by retention meaning |
| referral | `inviteService` for validity, registration for final consumption | `member/register` for consumption, `inviteService` for creation | mostly invite-flow centralized, with duplicate mark-used shape |
| expansion | `platformOperatingService` for platform admin, `franchiseService`/`team-engine` for team surfaces | `franchiseService` and automation write side effects; platform aggregates read-only | split by scope |

## Final Read / Write Assessment

Growth Loop has no single read authority and no single write authority today.

The practical current rule is:

- persisted domain writers own facts
- derived services own the surfaces that call them
- recommendation engines do not override facts
- platform operating owns platform/admin read models
- team/franchise own their local expansion surfaces
