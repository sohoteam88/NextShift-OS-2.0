# Growth Loop Duplicate Authorities

Task: `TASK_016_GROWTH_LOOP_SOURCE_AUDIT`

Scope: discovery only. This file identifies current duplicate authority surfaces for acquisition, activation, retention, referral, and expansion. It does not assign final ownership or define migration steps.

## Summary

Current runtime reality:

```text
GrowthLoop does not exist as a single runtime authority.
Growth behavior is distributed across module-local services, APIs, hooks, and dashboards.
Several modules independently answer "what should improve next?"
Several modules also directly write growth-related state.
```

Highest-risk duplication areas:

- next-action and recommendation logic
- acquisition funnel readiness
- activation progress
- CRM followup and retention timing
- referral invite consumption
- expansion and upgrade funnel metrics

## Duplicate Acquisition Authorities

| Duplicate Area | Files | Current Runtime Reality | Risk |
| --- | --- | --- | --- |
| Lead acquisition readiness | `src/modules/lead-magnet/leadMagnetService.ts`, `src/modules/traffic-engine/trafficEngineService.ts`, `src/modules/funnel/services/funnel-progress-service.ts`, `src/modules/funnel/services/funnel-health-service.ts`, `src/app/api/v1/funnel-os/route.ts`, `src/modules/business-intelligence/ceoAdvisorEngine.ts` | Lead magnet, traffic engine, funnel progress, funnel health, funnel-os, and CEO advisor each infer whether the user is ready to generate leads. | High |
| Next acquisition action | `src/modules/funnel/services/funnel-health-service.ts`, `src/modules/business-intelligence/ceoAdvisorEngine.ts`, `src/modules/growth-roadmap/services/roadmap-service.ts`, `src/modules/dashboard/components/AiRecommendationPanel.tsx`, `src/app/api/v1/ai/coach/recommend/route.ts` | Multiple modules independently decide whether the next action is content, lead magnet, funnel, traffic, or followup. | High |
| Lead creation writers | `src/modules/crm/services/lead-service.ts`, `src/app/api/v1/public/funnel/[slug]/submit/route.ts`, `src/modules/automation/automationEngine.ts` | Leads can be created manually/API-driven, through public funnel submissions, or through automation workflows. | High |
| Funnel performance signals | `src/modules/funnel/services/funnel-service.ts`, `src/app/api/v1/public/funnel/[slug]/submit/route.ts`, `src/modules/funnel/services/funnel-health-service.ts`, `src/modules/admin/services/system-monitoring.ts` | Funnel views/conversions are written in funnel/public routes and interpreted by funnel health and platform monitoring. | Medium |
| Content as acquisition driver | `src/modules/content-engine/contentEngineService.ts`, `src/modules/funnel/services/funnel-progress-service.ts`, `src/modules/business-intelligence/ceoAdvisorEngine.ts`, `src/modules/admin/services/beta-command-service.ts` | Content count is used as growth readiness in several places, each with different thresholds. | Medium |

## Duplicate Activation Authorities

| Duplicate Area | Files | Current Runtime Reality | Risk |
| --- | --- | --- | --- |
| Activation journey definition | `src/modules/activation/services/activation-service.ts`, `src/modules/mission/constants/journey-map.ts`, `src/modules/mission-engine/missionStages.ts`, `src/modules/growth-roadmap/services/roadmap-service.ts` | Activation is defined as 7-day missions, mission stages, journey-map stages, and growth roadmap steps. | High |
| Activation progress scoring | `src/modules/activation/services/activation-service.ts`, `src/modules/growth-roadmap/services/roadmap-service.ts`, `src/modules/mission/services/mission-service.ts`, `src/modules/revenue-activation/services/revenue-journey-service.ts` | Multiple services calculate progress, current step, next step, score, or level from different event models. | High |
| First lead/customer activation | `src/modules/activation/services/activation-service.ts`, `src/modules/growth-roadmap/services/roadmap-service.ts`, `src/modules/mission-engine/services/mission-service.ts`, `src/modules/admin/services/beta-command-service.ts` | First lead/customer milestones are used by activation, roadmap, mission, and beta funnel metrics. | Medium |
| WhatsApp followup activation | `src/modules/activation/services/activation-service.ts`, `src/app/api/v1/whatsapp-ai/generate/route.ts`, `src/modules/mission-engine/missionStages.ts` | WhatsApp followup is both an activation mission and a mission completion event. | Medium |

## Duplicate Retention Authorities

| Duplicate Area | Files | Current Runtime Reality | Risk |
| --- | --- | --- | --- |
| Followup schedule authority | `src/modules/crm/services/followup-service.ts`, `src/modules/crm/hooks/use-followup.ts`, `src/app/api/v1/crm/leads/[id]/followup/route.ts`, `src/modules/ai/components/AIPromptPanel.tsx` | CRM service is the DB writer, while AI prompt UI can also trigger followup date writes through the route. | High |
| Followup recommendation authority | `src/modules/crm/crmEngines.ts`, `src/modules/crm/crmCenterService.ts`, `src/modules/whatsapp-ai/whatsappEngines.ts`, `src/modules/ai/agents/sales-coach.ts`, `src/modules/ai/agents/crm-manager.ts`, `src/modules/business-intelligence/ceoAdvisorEngine.ts` | CRM, WhatsApp AI, AI agents, and CEO advisor all recommend followup actions. | High |
| Retention metric definition | `src/modules/analytics/services/analytics-service.ts`, `src/modules/team-engine/hooks/useTeamEngine.ts`, `src/modules/franchise/franchiseService.ts` | Analytics uses activity existence, team-engine returns synthetic retention, franchise calculates activation/execution-based health. | High |
| Automation retention actions | `src/modules/automation/automationEngine.ts`, `src/modules/automation/workflowTemplates.ts`, `src/modules/whatsapp-ai/whatsappService.ts`, `src/modules/crm/services/followup-service.ts` | Automation creates followup activities; WhatsApp generates followup plans; CRM stores actual next followup dates. | High |
| CRM stats vs CRM center | `src/app/api/v1/crm/stats/route.ts`, `src/modules/crm/crmCenterService.ts`, `src/modules/crm/services/followup-service.ts` | Followup overdue/today counts are calculated in multiple places. | Medium |

## Duplicate Referral Authorities

| Duplicate Area | Files | Current Runtime Reality | Risk |
| --- | --- | --- | --- |
| Invite validation | `src/modules/member/services/invite-service.ts`, `src/app/api/v1/public/member/invite/[code]/route.ts`, `src/app/api/v1/member/register/route.ts` | Public validation and registration both validate invite state through service before use. | Medium |
| Invite consumption writer | `src/modules/member/services/invite-service.ts`, `src/app/api/v1/member/register/route.ts` | `inviteService.markUsed()` exists, but registration directly updates `InviteCode.used` in a transaction. | High |
| Referral-to-member side effects | `src/app/api/v1/member/register/route.ts`, `src/modules/member/services/approval-service.ts`, `src/modules/member/components/MemberApprovalQueue.tsx` | Registration creates pending member state; approval queue later controls activation/approval flow. | Medium |
| Referral source classification | `src/modules/crm/types.ts`, `src/modules/member/services/invite-service.ts`, `src/app/api/v1/member/register/route.ts` | CRM has `referral` as a lead source, while member invite creates users/members, not leads. | Medium |

## Duplicate Expansion Authorities

| Duplicate Area | Files | Current Runtime Reality | Risk |
| --- | --- | --- | --- |
| Platform growth funnel | `src/modules/admin/services/platformOperatingService.ts`, `src/modules/admin/services/beta-command-service.ts`, `src/modules/admin/services/system-monitoring.ts` | Platform operating, beta command, and system monitoring all compute growth/activation/funnel metrics. | High |
| Team growth metrics | `src/modules/team-engine/hooks/useTeamEngine.ts`, `src/modules/franchise/franchiseService.ts`, `src/modules/admin/services/platformOperatingService.ts`, `src/modules/admin/services/system-monitoring.ts` | Team growth/retention/recruitment are calculated in team-engine, franchise health, and platform admin metrics. | High |
| Upgrade/expansion funnel detection | `src/modules/funnel/services/funnel-progress-service.ts`, `src/app/api/v1/funnel-os/route.ts`, `src/modules/admin/services/system-monitoring.ts` | Upgrade funnel behavior exists in funnel-os and admin system monitoring classification. | High |
| Growth recommendations | `src/modules/business-intelligence/ceoAdvisorEngine.ts`, `src/modules/dashboard/components/AiRecommendationPanel.tsx`, `src/app/api/v1/ai/coach/recommend/route.ts`, `src/modules/funnel/services/funnel-health-service.ts` | CEO advisor, dashboard rules, AI coach, and funnel health all produce growth actions. | High |
| Automation as scale system | `src/modules/automation/automationEngine.ts`, `src/modules/business-intelligence/ceoAdvisorEngine.ts`, `src/modules/franchise/franchiseService.ts` | Automation actions, CEO automation recommendations, and franchise blueprint replication all imply expansion/scaling behavior. | Medium |

## Duplicate Source Map To GrowthLoop

| GrowthLoop Area | Duplicate Source Families | Current State |
| --- | --- | --- |
| `acquisition` | lead magnet, funnel, traffic, content, CRM leads, funnel-os, CEO advisor | Many active sources; no canonical acquisition signal adapter |
| `activation` | activation service, onboarding, mission, mission-engine, roadmap, revenue activation | Many step/score definitions; no single activation signal contract |
| `retention` | CRM followups, WhatsApp AI, automation, analytics, team-engine, franchise, AI agents | Highest overlap between recommendations and write paths |
| `referral` | invite service, invite APIs, registration route, approval flow, CRM referral source | Invite service is central, but registration duplicates invite consumption write |
| `expansion` | platform operating, beta command, system monitoring, team-engine, franchise, CEO advisor, automation | Admin/team/franchise/BI each compute expansion signals independently |

## Discovery Conclusions

1. `GrowthLoop` should not be introduced as a direct writer over these domains without a later migration task.
2. Current duplicate authority is mostly in signal interpretation and recommendation generation, not only in DB writes.
3. The highest-risk writers are `funnelService`, public funnel submit, `leadService`, `followupService`, automation action execution, invite registration, and franchise metadata writes.
4. The highest-risk recommendation producers are CEO advisor, funnel health, AI coach recommendation API, dashboard recommendation rules, CRM engines, WhatsApp AI, and growth roadmap.
5. Retention has the most fragmented authority because followup dates, followup templates, retention booleans, activity counts, and team/franchise retention metrics are different concepts sharing the same label.
