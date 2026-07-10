# Growth Loop Precedence Report

Task: `TASK_018_GROWTH_LOOP_PRECEDENCE_AUDIT`

Scope: current runtime precedence only.

Question:

```text
When multiple growth authorities disagree, who wins?
```

## Global Finding

`Growth Loop does not have one global precedence chain today.`

Current runtime precedence is domain-local and surface-local:

- acquisition surfaces trust acquisition services and funnel/CRM counts
- activation surfaces trust mission, activation, roadmap, or revenue sidecars
- retention surfaces trust CRM followup, WhatsApp AI, analytics, or team/franchise metrics
- referral surfaces mostly trust invite flow, but registration has its own transactional write path
- expansion surfaces trust platform operating, beta command, team/franchise, funnel-os, or CEO advisor depending on page

There is no runtime `GrowthLoop` resolver that reconciles disagreements.

## 1. Acquisition Precedence

### Primary

Transactional acquisition writers and measured acquisition facts:

- `funnelService`
- public funnel submit route
- `leadService`
- `contentEngineService`

Why:

- `funnelService` owns active `Funnel` CRUD/publish state.
- public funnel submit creates `Lead`, writes `Activity`, updates lead score, and increments `Funnel.conversions`.
- `leadService` owns CRM lead creation/update/read behavior.
- `contentEngineService` writes `Content` and `ContentCalendar`, which are consumed as acquisition readiness.

### Secondary

Derived acquisition readiness and next-action sources:

- `funnelProgressService`
- `funnelHealthService`
- `funnel-os`
- `trafficEngineService`
- `leadMagnetService`

Why:

- these read persisted funnel/content/lead/customer/metadata facts and derive readiness, progress, health, or next action.
- `trafficEngineService` and `leadMagnetService` persist generated packages in `user.metadata`, but they do not override lead/funnel facts.

### Fallback

Advisory acquisition sources:

- `ceoAdvisorEngine`
- `/api/v1/ai/coach/recommend`
- `AiRecommendationPanel`
- growth roadmap

Why:

- they recommend acquisition actions but do not own acquisition records.

### Conflict Rule

Current runtime rule:

1. If the question is "what exists?", persisted facts win: `Funnel`, `Lead`, `Content`, `ContentCalendar`.
2. If the question is "what should this acquisition surface show?", the current surface's own service wins.
3. If the question is "what should the user do next?", the current recommendation surface wins only on its own page.

So a CRM lead count beats CEO lead-generation health for factual lead presence, but CEO Advisor still wins on CEO Mode.

## 2. Activation Precedence

### Primary

Mission state and mission completion chain:

- `missionService`
- `/api/v1/mission/*`
- `useMissionState()`

Why:

- it is the strongest active persisted activation/progress chain for modern surfaces.

### Secondary

Surface-level activation interpreters:

- `activation-service`
- `useActivation()`
- `growth-roadmap`
- `mission-engine`
- `revenue-activation`

Why:

- these reinterpret progress as day missions, roadmap steps, legacy missions, or revenue milestones.

### Fallback

Local thresholds and default snapshots:

- dashboard default EvolutionSnapshot
- local completed-check thresholds
- revenue milestone defaults

### Conflict Rule

Current runtime rule:

- modern mission routes trust `missionService`
- activation UI trusts `useActivation()`
- dashboard trusts `useDashboardMission()` and may short-circuit into `ActivationDashboard`
- roadmap UI trusts `growth-roadmap`
- revenue UI trusts `revenue-activation`

Activation precedence is therefore surface-based. If activation day and journey progress disagree, the active page decides the winner.

## 3. Retention Precedence

### Primary

CRM followup storage and lead activity:

- `followupService`
- `leadService`
- CRM followup APIs

Why:

- `followupService.setFollowup()` writes `Lead.nextFollowup`.
- followup counts/lists are derived directly from persisted `Lead.nextFollowup`.
- `leadService` owns CRM lead records that retention surfaces inspect.

### Secondary

Retention recommendation and package generators:

- `crmCenterService`
- `crmEngines`
- `whatsappService`
- `whatsappEngines`
- `automationEngine`

Why:

- they recommend followups, generate followup templates, or create followup-related activities.
- they do not override the persisted CRM followup date.

### Fallback

Reporting and team/franchise retention signals:

- `analytics-service`
- `team-engine`
- `franchiseService`
- CEO advisor retention bottlenecks

Why:

- these calculate broader retention, activity, activation, or execution health, but they do not own CRM followup truth.

### Conflict Rule

Current runtime rule:

1. For actual followup due state, `Lead.nextFollowup` through `followupService` wins.
2. For WhatsApp followup copy/plan, WhatsApp AI wins only inside WhatsApp surfaces.
3. For reporting retention, analytics/team/franchise surfaces win their own display.
4. For strategic retention recommendations, CEO Advisor wins only inside CEO surfaces.

Retention has the most terminology conflict because "retention" means followup schedule, followup content, activity presence, team retention, or franchise health depending on the consumer.

## 4. Referral Precedence

### Primary

Invite validation and registration flow:

- `inviteService`
- `member/register` route

Why:

- `inviteService` creates, lists, and validates `InviteCode`.
- `member/register` validates the invite, creates the member user, sets `sponsorId`, marks the invite used, and writes an audit log in one transaction.

### Secondary

Invite UI and public validation consumers:

- `member/invite` route
- public invite validation route
- `MemberInvitePanel`
- `JoinInviteForm`

### Fallback

Referral-like reporting:

- CRM `LeadSource = 'referral'`
- platform invite counts
- beta command first-member metrics
- franchise/team sponsor views

### Conflict Rule

Current runtime rule:

1. `member/register` wins for final invite consumption because it performs the transactional user creation and invite-used update.
2. `inviteService.validateInvite()` wins for validity checks before registration.
3. CRM referral source does not override member invite authority; it is a separate lead classification.
4. Platform/beta/franchise reporting reads referral outcomes, but does not write invite truth.

## 5. Expansion Precedence

### Primary

Platform and tenant-wide operating aggregates:

- `platformOperatingService`
- `betaCommandService`
- `system-monitoring`

Why:

- these aggregate tenants, users, funnels, leads, customers, content, AI usage, invite counts, growth windows, funnel analysis, and beta funnel metrics.
- they are the strongest expansion read chain for admin/platform views.

### Secondary

Team/franchise expansion systems:

- `franchiseService`
- `team-engine`

Why:

- these own team-level growth, retention, duplication, activation, and blueprint/assignment signals for team/franchise surfaces.

### Fallback

Advisory and automation expansion sources:

- `ceoAdvisorEngine`
- `automationEngine`
- `funnel-os` upgrade/recruitment classification

Why:

- they recommend scale actions or classify upgrade/recruitment funnels but do not own platform operating totals.

### Conflict Rule

Current runtime rule:

- platform admin surfaces trust `platformOperatingService` and helpers.
- beta surfaces trust `betaCommandService`.
- team/franchise surfaces trust `team-engine` or `franchiseService`.
- CEO Mode trusts `ceoAdvisorEngine`.
- automation surfaces trust automation workflow state.

No current chain reconciles platform-level expansion, team-level expansion, and CEO strategic expansion into one result.

## Strongest Growth Signal Chain

The strongest current factual signal chain is:

```text
Prisma records and user metadata
  -> domain services
  -> route APIs / server pages
  -> dashboards, reporting, AI surfaces
```

By domain:

| Domain | Strongest Factual Chain |
| --- | --- |
| acquisition | `Funnel` / `Lead` / `Content` / `ContentCalendar` / metadata -> `funnelService`, public submit, `leadService`, `contentEngineService`, `funnel-os` |
| activation | `userProgress` / completed checks -> `missionService` -> `useMissionState()` / dashboard and journey wrappers |
| retention | `Lead.nextFollowup` / `Activity` / lead records -> `followupService`, `leadService`, `crmCenterService` |
| referral | `InviteCode` / `User.sponsorId` -> `inviteService`, `member/register` |
| expansion | tenants/users/funnels/leads/customers/content/AI usage/invites -> `platformOperatingService`, `betaCommandService`, `system-monitoring` |

## Summary Matrix

| GrowthLoop Projection | Primary | Secondary | Fallback | Conflict Rule |
| --- | --- | --- | --- | --- |
| `acquisition` | persisted funnel/lead/content facts through `funnelService`, public submit, `leadService`, `contentEngineService` | `funnelProgressService`, `funnelHealthService`, `trafficEngineService`, `leadMagnetService` | CEO Advisor, AI coach, recommendation panels, roadmap | persisted facts win factual questions; surface service wins page display |
| `activation` | `missionService` on modern persisted progress | `useActivation`, `growth-roadmap`, `mission-engine`, `revenue-activation` | local thresholds/defaults | active surface chooses winner |
| `retention` | `followupService` and CRM lead records | `crmCenterService`, WhatsApp AI, automation | analytics, team/franchise, CEO Advisor | CRM persisted followup wins due state; surface-specific retention wins display |
| `referral` | `inviteService` + `member/register` transaction | invite APIs and UI | CRM referral source, platform/beta reporting | registration wins invite consumption; validation service wins invite validity |
| `expansion` | `platformOperatingService`, `betaCommandService`, `system-monitoring` | `franchiseService`, `team-engine` | CEO Advisor, automation, funnel-os | platform/team/CEO surfaces each win locally |

## Final Precedence Judgment

`Growth Loop precedence is domain-local and surface-local today.`

There is no active runtime object that can answer:

```text
What is the canonical GrowthLoop state?
```

The safest current interpretation is:

- write authorities win factual state inside their own domain
- read-only projection services win the surfaces that call them
- recommendation engines are advisory unless the current page uses them as the CTA source
- platform operating wins platform/admin questions, not user journey questions
