# Growth Loop Source Summary

Task: `TASK_016_GROWTH_LOOP_SOURCE_AUDIT`

Scope: discovery only. This summary maps current runtime sources to the future `GrowthLoop` projection areas without defining migration steps.

## Verdict

`SOURCE AUDIT COMPLETE`

All required Growth Loop domains were identified:

- acquisition
- activation
- retention
- referral
- expansion

Current runtime reality:

```text
GrowthLoop is not implemented as a single authority.
Growth signals are distributed across existing module authorities.
Several modules independently infer readiness, next action, health, retention, and expansion.
```

## Projection Mapping

```text
GrowthLoop
  acquisition
    lead-magnet
    funnel
    public funnel submit
    funnel-os
    traffic-engine
    content-engine
    CRM lead source and lead creation
    CEO advisor acquisition opportunities

  activation
    activation service
    onboarding
    mission
    mission-engine
    growth-roadmap
    revenue-activation
    WhatsApp mission notification

  retention
    CRM followup service
    CRM center and stats
    WhatsApp AI followup plans
    automation followup workflows
    analytics retention flag
    team-engine retention
    franchise health
    AI followup recommendations

  referral
    invite-service
    member invite API
    public invite validation API
    member registration
    invite UI consumers

  expansion
    platformOperatingService
    beta-command-service
    system-monitoring
    team-engine
    franchise
    CEO advisor
    automation
    funnel-os upgrade/recruitment signals
```

## Canonical Runtime Source Candidates

These are not migration decisions. They are the strongest current runtime sources discovered for each domain.

| GrowthLoop Area | Strongest Current Runtime Sources | Why |
| --- | --- | --- |
| Acquisition | `leadMagnetService`, `funnelService`, public funnel submit route, `trafficEngineService`, `contentEngineService`, `leadService`, `funnel-os` | These create or measure lead capture infrastructure, content, traffic, funnels, and leads. |
| Activation | `activation-service`, mission services, `growth-roadmap`, onboarding service, revenue activation | These define the user's early progress, current step, and readiness milestones. |
| Retention | `followupService`, `whatsappService`, `whatsappEngines`, automation engine, analytics service | These define followup timing, followup content, reactivation templates, and retention indicators. |
| Referral | `inviteService`, member invite API, public invite API, member registration route | These create, validate, and consume referral/member invite links. |
| Expansion | `platformOperatingService`, `betaCommandService`, `system-monitoring`, `franchiseService`, `team-engine`, `ceoAdvisorEngine` | These aggregate team/platform growth, beta funnel, upgrade funnel, franchise replication, and growth opportunities. |

## Active Source Count By Domain

| Domain | Active Source Families Found | Duplicate Authority Risk |
| --- | ---: | --- |
| Acquisition | 7 | High |
| Activation | 6 | High |
| Retention | 7 | High |
| Referral | 5 | Medium |
| Expansion | 7 | High |

## Important Evidence

### Acquisition

- `leadMagnetService.generate()` reads BrandContext and writes `user.metadata.lead_magnet`.
- `funnelService.createInternal()` is the internal write path for `Funnel` inserts.
- Public funnel submit creates `Lead`, writes `Activity`, scores the lead, and increments `Funnel.conversions`.
- `trafficEngineService.generate()` reads funnel/lead magnet/content presence and writes `user.metadata.traffic_engine`.
- `contentEngineService.generatePlatformPost()` writes `Content`; `generateCalendar()` writes `ContentCalendar`.
- `leadService.create()` writes manual/API leads and logs lead creation activity.
- `funnel-os` reads content, video, lead, customer, and funnel counts to produce progress, milestones, KPI, health, and next action.

### Activation

- `activation-service` defines a 7-day activation program and calculates day, score, level, and completion.
- `mission/constants/journey-map.ts` and `mission-engine/missionStages.ts` define growth journey stages including acquisition and WhatsApp followup.
- `growth-roadmap` maps EvolutionSnapshot into current step, next step, progress, and mission groups.
- `revenue-activation` defines first-revenue milestones and forecast helper logic.
- WhatsApp generation route calls mission progress notification for `whatsapp_followup_configured`.

### Retention

- `followupService.setFollowup()` writes `Lead.nextFollowup` and logs `followup_set` or `followup_cleared`.
- `followupService.getTodayFollowups()` and `getFollowupCounts()` read overdue/today/upcoming followups.
- `crmCenterService` calculates followup overdue/today/upcoming and advisor tips.
- WhatsApp AI generates followup plans, objection responses, appointment flow, and best followups from CRM leads.
- Automation templates include assessment followup, hot lead escalation, and webinar followup.
- Analytics service defines a retention boolean based on any lead/content/action/AI/activity presence.
- Franchise health and team-engine both expose retention/growth metrics.

### Referral

- `inviteService.createInvite()` writes `InviteCode`.
- `inviteService.validateInvite()` reads invite validity and sponsor/tenant information.
- `member/register` creates a pending member user, sets `sponsorId`, writes invite metadata, marks invite used, and writes an audit log.
- `MemberInvitePanel` creates and displays invite links.
- `JoinInviteForm` validates invite code and submits registration.

### Expansion

- `platformOperatingService` aggregates tenants, users, funnels, leads, customers, content, AI usage, and invites into platform operating data.
- `betaCommandService` computes invited, activated, brand/content/funnel/lead/appointment/customer/member metrics.
- `system-monitoring` computes growth windows, founder alerts, retail/recruitment/upgrade funnel analysis.
- `team-engine` returns team retention/growth/duplication metrics from EvolutionSnapshot context.
- `franchiseService` writes replication metadata and computes team health from sponsored users, leads, content, and progress.
- `ceoAdvisorEngine` emits growth opportunities, bottlenecks, risks, next-best actions, agent recommendations, and automation recommendations.

## Duplicate Authority Summary

Detailed duplicate findings are in:

```text
audit/growth-loop-duplicate-authorities.md
```

Top duplicate clusters:

- Acquisition next action: funnel health, CEO advisor, AI coach, dashboard recommendation rules, growth roadmap.
- Activation progress: activation service, mission, mission-engine, growth-roadmap, revenue activation.
- Retention followup: CRM followup, WhatsApp AI, automation, AI prompt panel, CRM/AI agents.
- Referral invite consumption: invite service has `markUsed()`, but registration route updates `InviteCode.used` directly.
- Expansion metrics: platform operating, beta command, system monitoring, team-engine, franchise, CEO advisor.

## Ownership Mapping Complete

| Required Domain | Sources Identified | Duplicate Authorities Documented | Current Ownership Status |
| --- | --- | --- | --- |
| Acquisition | Yes | Yes | Distributed |
| Activation | Yes | Yes | Distributed |
| Retention | Yes | Yes | Distributed |
| Referral | Yes | Yes | Mostly centralized in invite flow, with duplicated usage write |
| Expansion | Yes | Yes | Distributed |

## Final Discovery Finding

The current codebase already has enough runtime signals to feed a future `GrowthLoop`, but those signals are not canonicalized.

The future GrowthLoop should consume these sources as signal inputs. Current evidence does not support making GrowthLoop a direct writer over leads, funnels, followups, invites, mission state, business state, team state, or franchise metadata.
