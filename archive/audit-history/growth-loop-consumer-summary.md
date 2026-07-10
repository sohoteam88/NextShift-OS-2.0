# Growth Loop Consumer Summary

Status: P6-003 consumer audit summary
Authority: Growth Loop
Final decision: READY FOR BOUNDED CUTOVER

## Summary

Growth Loop consumers are distributed across dashboards, routes, hooks, AI agents, analytics, CRM, referral, team, franchise and platform-admin surfaces.

No consumer was migrated in P6-003. No runtime behavior was changed.

## Domain Coverage

| Domain | Consumers Identified | Primary Sources |
| --- | --- | --- |
| Acquisition | Yes | Lead engine, lead magnet, traffic engine, content engine, funnel/funnel-os, CRM stats, analytics, CEO Advisor |
| Activation | Yes | Growth Roadmap, DashboardV4, mission APIs, activation hook/dashboard, AI Coach, team/platform surfaces |
| Retention | Yes | CRM followups, CRM center/stats, WhatsApp AI, analytics, automation, CEO Advisor, team/franchise surfaces |
| Referral | Yes | inviteService APIs, public invite validation, member registration, member invite UI, team/franchise/platform surfaces |
| Expansion | Yes | team summary, team engine, franchise, analytics, funnel-os, CEO Advisor, platform operating, beta command |

## Key Findings

1. Growth Loop has no existing consumer authority.
2. Consumers currently read signals directly from domain services, APIs, hooks and local rule engines.
3. Recommendation and action consumers are the highest-risk migration group.
4. Read-only reporting routes are the only safe first cutover class.
5. DashboardV4, Growth Roadmap, AI Coach, CEO Advisor, CRM writes and invite writes must remain blocked.

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
- Lead Engine writes
- Traffic generation
- Funnel writes and funnel health action owners
- Mission/Journey write paths
- Automation execution
- Platform admin decision surfaces

## Bounded Cutover Candidates

Primary candidate:

- `GET /api/v1/analytics/member`
- File: `src/app/api/v1/analytics/member/route.ts`
- Type: read-only reporting route
- Domains: acquisition, retention, expansion
- Risk: Low

Secondary candidate:

- `GET /api/v1/team/summary`
- File: `src/app/api/v1/team/summary/route.ts`
- Type: read-only team growth report route
- Domains: activation, retention, referral, expansion
- Risk: Low to Medium

## Why Primary Candidate Is Safe Enough For Planning

`GET /api/v1/analytics/member`:

- authenticates a single member
- returns report data only
- does not create/update/delete records
- does not generate recommendations
- does not generate actions
- does not own CRM, traffic, referral, journey, dashboard, workforce, or platform behavior
- aligns with user-scoped `GrowthLoopStateService.getGrowthLoopState(user.id)`

P6-004 should still require response compatibility and keep analytics fallback if `GrowthLoopState` does not fully cover the current report shape.

## Required Questions Answered

Does each consumer consume acquisition/activation/retention/referral/expansion signals?

- Yes, mapped in `audit/growth-loop-consumer-inventory.md`.

What is the current source?

- Existing source is documented per consumer in the inventory table.

Does it generate signals or only display them?

- Signal generation/display ownership is documented per consumer.

Does it own recommendations?

- Recommendation ownership is documented per consumer. High-risk recommendation owners remain blocked.

Does it own actions?

- Action ownership is documented per consumer. Action owners remain blocked.

Can it eventually consume `GrowthLoopStateService`?

- Yes for selected read-only reporting routes.
- Not yet for dashboards, roadmap, AI, CRM writes, invite writes, platform admin, or automation.

Migration risk?

- Classified in `audit/growth-loop-consumer-risk-report.md`.

## Verification

Boundary expectation:

```text
GrowthLoopStateService / getGrowthLoopState only inside src/modules/growth-loop/**
```

No consumer import is allowed in P6-003.

## Final Decision

READY FOR BOUNDED CUTOVER.

## Exit Gate

Eligible for:

- `P6-004_BOUNDED_GROWTH_LOOP_CUTOVER_PLAN.md`

Not eligible for:

- Dashboard cutover
- Growth Roadmap cutover
- CRM cutover
- Lead Engine cutover
- AI Coach cutover
- CEO Advisor cutover
- inviteService cutover
