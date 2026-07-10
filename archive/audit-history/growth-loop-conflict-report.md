# Growth Loop Conflict Report

Task: `TASK_018_GROWTH_LOOP_PRECEDENCE_AUDIT`

Scope: current runtime conflicts only.

## Conflict Summary

Growth Loop conflicts are active runtime splits.

The major conflict pattern is:

- persisted domain facts
- derived readiness/progress services
- local dashboard wrappers
- AI/CEO recommendation engines
- platform operating aggregates

These often answer adjacent questions without one shared precedence rule.

## Conflict 1: Acquisition Facts vs Acquisition Recommendations

Question:

```text
What should improve next for acquisition?
```

Conflicting authorities:

- `funnelService`
- public funnel submit route
- `leadService`
- `contentEngineService`
- `funnelHealthService`
- `funnelProgressService`
- `trafficEngineService`
- `ceoAdvisorEngine`
- AI coach recommendation route
- `AiRecommendationPanel`

Observed conflict shape:

- one surface may see no funnel and recommend building a funnel
- another surface may see content as the bottleneck
- CEO Advisor may prioritize automation or sales if leads already exist
- CRM may show lead/followup urgency instead of content/funnel work

Current winner:

- factual record questions: persisted `Funnel`, `Lead`, and `Content` state wins
- funnel surfaces: funnel health/progress wins
- dashboard/AI surfaces: local recommendation source wins
- CEO surfaces: CEO Advisor wins

Risk:

- the user can see multiple "next growth action" answers at the same time.

## Conflict 2: Funnel Progress vs Business/CEO Health

Question:

```text
How healthy is growth?
```

Conflicting authorities:

- `funnelProgressService`
- `funnelHealthService`
- `funnel-os`
- `ceoAdvisorEngine`
- `platformOperatingService`

Observed conflict shape:

- funnel can be healthy while business health is weak
- CEO Advisor can flag sales/automation bottlenecks while funnel-os says next action is traffic
- platform admin can show tenant-level growth even if one user surface is blocked

Current winner:

- funnel surfaces trust funnel health/progress
- CEO mode trusts CEO Advisor
- platform admin trusts platform operating data

Risk:

- scores are not comparable because they measure different scopes.

## Conflict 3: Activation Mission vs Roadmap vs Revenue Progress

Question:

```text
Where is the user in activation?
```

Conflicting authorities:

- `missionService`
- `activation-service`
- `useActivation()`
- `growth-roadmap`
- `mission-engine`
- `revenue-activation`

Observed conflict shape:

- mission service can show completed checks
- activation can show day-based progress
- growth roadmap can show step-based progress
- revenue progress can show first-revenue milestones
- legacy mission-engine can present a separate mission model

Current winner:

- `/dashboard` can short-circuit to `ActivationDashboard`
- `/journey` and modern mission routes trust `missionService`
- roadmap surfaces trust `growth-roadmap`
- revenue widgets trust `revenue-activation`

Risk:

- progress and "current step" can differ by surface.

## Conflict 4: Retention Followup Date vs WhatsApp Followup Plan

Question:

```text
Who needs followup now?
```

Conflicting authorities:

- `followupService`
- `crmCenterService`
- `whatsappService`
- `whatsappEngines`
- AI sales/CRM agents

Observed conflict shape:

- CRM due lists come from persisted `Lead.nextFollowup`
- WhatsApp AI creates followup templates and best-followup suggestions
- AI agents can recommend followup based on CRM center or WhatsApp package state

Current winner:

- CRM followup surfaces trust `followupService`
- WhatsApp surfaces trust WhatsApp AI package and CRM context
- AI agent surfaces trust their imported source

Risk:

- "best followup" and "due followup" can be different lists.

## Conflict 5: Retention Metric vs Team/Franchise Retention

Question:

```text
Is retention healthy?
```

Conflicting authorities:

- `analytics-service`
- `team-engine`
- `franchiseService`
- `crmCenterService`
- `ceoAdvisorEngine`

Observed conflict shape:

- analytics retention is activity existence based
- team-engine returns team retention/growth metrics
- franchise health derives activation and execution from team members, leads, and content
- CRM retention focuses on followup and pipeline
- CEO Advisor uses broad sales/CRM/automation health

Current winner:

- analytics pages trust analytics
- team pages trust team-engine
- franchise pages trust franchise service
- CRM pages trust CRM center/followup
- CEO mode trusts CEO Advisor

Risk:

- the word "retention" represents multiple unrelated calculations.

## Conflict 6: Invite Service vs Registration Transaction

Question:

```text
Who owns referral invite consumption?
```

Conflicting authorities:

- `inviteService.markUsed()`
- `member/register` route direct `InviteCode.updateMany()`

Observed conflict shape:

- invite service exposes a mark-used method
- registration route validates invite through the service, but marks used inside its own transaction while creating user and audit log

Current winner:

- final invite consumption is won by `member/register`.
- invite validity is won by `inviteService.validateInvite()`.

Risk:

- duplicate write shape exists around invite consumption.

## Conflict 7: Referral User Flow vs CRM Referral Source

Question:

```text
What is a referral?
```

Conflicting authorities:

- member invite flow
- `User.sponsorId`
- CRM `LeadSource = 'referral'`
- platform/beta invite and first-member metrics

Observed conflict shape:

- member invite creates users and sponsor relationships
- CRM referral is a lead source label
- platform/beta treats invite/member counts as growth funnel metrics

Current winner:

- member referral flow wins member/team referral truth
- CRM wins lead source display on CRM surfaces
- platform/beta wins aggregate reporting

Risk:

- "referral" can mean lead source or member invite, with no shared contract.

## Conflict 8: Platform Expansion vs Team/Franchise Expansion

Question:

```text
Is the system expanding?
```

Conflicting authorities:

- `platformOperatingService`
- `betaCommandService`
- `system-monitoring`
- `team-engine`
- `franchiseService`
- `ceoAdvisorEngine`

Observed conflict shape:

- platform operating uses tenants/users/funnels/leads/customers/content/AI usage/invites
- beta command uses beta funnel milestones
- team-engine uses synthetic or evolution-derived team stats
- franchise uses sponsored users, content, leads, progress, and blueprints
- CEO Advisor uses strategic growth opportunities

Current winner:

- platform admin surfaces trust platform operating/beta command
- team surface trusts team-engine
- franchise surface trusts franchise service
- CEO mode trusts CEO Advisor

Risk:

- platform-level growth and team-level growth can disagree without reconciliation.

## Conflict 9: Automation As Action vs Automation As Recommendation

Question:

```text
Should automation drive growth or merely be recommended?
```

Conflicting authorities:

- `automationEngine`
- `workflowTemplates`
- `ceoAdvisorEngine.automationRecommendations`
- `AutomationDashboard`
- AI coach/recommendation surfaces

Observed conflict shape:

- automation engine can create leads or activities when workflows run
- CEO Advisor recommends automation templates
- Automation dashboard lets users toggle workflow availability

Current winner:

- actual automation execution wins action effects.
- CEO Advisor wins recommendation display on CEO surfaces.
- Automation dashboard wins workflow UI state.

Risk:

- automation is both an execution mechanism and a growth recommendation object.

## Conflict 10: User Dashboard vs Platform Dashboard

Question:

```text
Which growth state should be shown?
```

Conflicting authorities:

- `DashboardV4`
- `useDashboardMission`
- `AICoachCard`
- `AiRecommendationPanel`
- `PlatformOperatingDashboard`
- platform admin pages

Observed conflict shape:

- user dashboard is mission/activation/action oriented
- platform dashboard is tenant, revenue, beta, funnel, and alert oriented
- both can show growth status but at different scopes

Current winner:

- user routes trust user dashboard wrappers
- platform routes trust platform operating data

Risk:

- "growth" is not scoped in the UI contract.

## Final Conflict Finding

The most dangerous conflicts are not raw data conflicts.

They are recommendation and next-action conflicts:

- dashboard next action
- AI coach next action
- CEO next action
- funnel next action
- CRM followup action
- automation recommendation/action

Current runtime rule:

```text
The active surface wins.
```

There is no system-wide GrowthLoop conflict resolver today.
