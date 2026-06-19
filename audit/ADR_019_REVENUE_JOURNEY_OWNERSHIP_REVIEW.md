# ADR-019 Revenue Journey Ownership Review

Status: Approved With Conditions

Category: Authority Decision

Architecture Review Board Item: `ARB-002`

Affected layers:

- Business State
- Journey
- Growth Loop

Reviewed input:

- `/Users/stevenmacmini/Desktop/ADR-019 Revenue Journey Ownership/ADR-019 Revenue Journey Ownership.md`

Related evidence:

- `audit/journey-authority-migration-readiness-review.md`
- `audit/business-state-migration-readiness-review.md`
- `audit/growth-loop-migration-readiness-review.md`
- `audit/journey-authority-source-inventory.md`
- `audit/journey-authority-consumer-inventory.md`
- `audit/journey-authority-duplicate-authorities.md`
- `audit/growth-loop-source-inventory.md`
- `audit/growth-loop-read-write-authority-map.md`
- `audit/PHASE_9C_ARCHITECTURE_REVIEW_BOARD.md`

Runtime evidence checked:

- `src/modules/revenue-activation/services/revenue-journey-service.ts`
- `src/modules/revenue-activation/hooks/useRevenueJourney.ts`
- `src/modules/revenue-activation/components/RevenueProgress.tsx`
- `src/modules/dashboard/components/DashboardV4.tsx`

## Review Verdict

`APPROVE AS AUTHORITY DECISION, WITH IMPLEMENTATION CONDITIONS`

ADR-019 correctly resolves the open Revenue Journey ownership blocker:

```text
Revenue Journey progression is owned by Journey Authority.
Canonical source: JourneyState.revenueProgress.
```

This is the correct boundary because revenue milestones are progression. Business State should diagnose readiness, bottlenecks, and opportunities. Growth Loop should report revenue signals, trends, velocity, and expansion indicators.

## Architecture Review Outcome

Outcome:

`Approve With Conditions`

Meaning:

- migration planning may treat revenue progression as Journey-owned
- `revenue-activation` becomes a sidecar adapter input, not the future authority
- Business State may consume revenue context for readiness and opportunities
- Growth Loop may consume revenue signals for trend/velocity/expansion reporting
- no implementation, consumer cutover, or retirement is approved by this ADR alone

## Decision

Approved authority decision:

```text
JourneyState.revenueProgress
```

owns Revenue Journey progression.

Owner:

```text
Journey Authority
```

Revenue Journey answers:

```text
What revenue milestone is next?
```

It does not answer:

- how healthy the business is
- how fast growth is moving
- what the best business opportunity is
- whether a funnel or CRM writer should change state

## Current Runtime Authority

Current runtime revenue progression is fragmented.

Evidence:

- `revenue-activation/services/revenue-journey-service.ts` defines a separate `REVENUE_MILESTONES` list, score, level, completion, and forecast helper.
- `useRevenueJourney()` reads `useMissionState()` completed checks and applies revenue-specific scoring.
- `RevenueProgress` renders the current revenue challenge in DashboardV4.
- Journey readiness review marks `revenue-journey-service.ts` as unresolved relative to Journey.
- Journey duplicate authority audit identifies Revenue Journey as a parallel journey-like progression authority.
- Growth Loop audits classify `revenue-activation` as activation/expansion sidecar, not canonical growth authority.

Current runtime state:

```text
NO CANONICAL REVENUE JOURNEY AUTHORITY
```

## Target Authority

Target contract:

```ts
interface RevenueProgress {
  currentMilestone: RevenueMilestone;
  nextMilestone: RevenueMilestone;
  completionPercent: number;
  achievedMilestones: RevenueMilestone[];
}
```

Canonical owner:

```text
Journey Authority
```

Required adapter output fields:

- `source`
- `scope`
- `confidence`
- `fallback`

## Ownership Boundary

### Journey Owns Revenue Progression

Journey owns:

- current revenue milestone
- next revenue milestone
- achieved revenue milestones
- revenue progression percentage
- route-level revenue next action

Examples:

- first lead
- first appointment
- first customer
- first revenue
- consistent revenue
- team revenue
- scalable revenue

### Business State Owns Revenue Readiness

Business State owns:

- revenue readiness
- revenue bottlenecks
- revenue opportunities
- diagnostic interpretation

Business State may consume `JourneyState.revenueProgress`.

Business State may not own or rewrite revenue milestone progression.

### Growth Loop Owns Revenue Signals

Growth Loop owns read-only signals such as:

- revenue trends
- revenue velocity
- expansion indicators
- retention indicators
- platform/team revenue reporting

Growth Loop may consume `JourneyState.revenueProgress`.

Growth Loop may not own milestone progression or write revenue journey state.

## Alternatives Review

### Alternative A: Business State Owns Revenue Journey

Decision:

`Rejected`

Reason:

Business State is diagnostic. Revenue Journey is milestone progression. Business State may expose readiness and opportunity, but it should not own the progression chain.

### Alternative B: Growth Loop Owns Revenue Journey

Decision:

`Rejected`

Reason:

Growth Loop is a read-only growth projection. It owns revenue signals and trends, not Journey milestones.

### Alternative C: Revenue Activation Owns Revenue Journey

Decision:

`Rejected`

Reason:

`revenue-activation` is an existing sidecar projection. It can be an adapter input, but leaving it as the owner would preserve the same unresolved sidecar authority that blocked Journey closure.

### Alternative D: Dashboard Owns Revenue Journey

Decision:

`Rejected`

Reason:

DashboardV4 is a high-risk mixed consumer and is explicitly last-wave under Phase 9 governance. `RevenueProgress` may display revenue progress; it must not own it.

## Migration Impact Assessment

Impact:

`Cross-Layer`

Affected waves:

- Phase 2 Business State
- Phase 3 Journey
- Phase 6 Growth Loop

Affected PR types:

- Contract PR
- Adapter PR
- Consumer Cutover PR
- Authority Audit PR
- later Retirement PR

Command-boundary impact:

`None for this ADR`

Reason:

ADR-019 defines Revenue Journey as a read projection. It introduces no new writer. Mission and progression systems continue writing underlying events until a separate command-boundary decision says otherwise.

High-risk consumer impact:

`Yes`

Affected high-risk consumers:

- DashboardV4
- `RevenueProgress`
- Growth Roadmap
- CEO Advisor
- Funnel OS
- Activation Dashboard

These must not cut over before the Journey revenue adapter exists.

## Consumer Impact

Affected consumers:

- DashboardV4
- RevenueProgress
- Growth Roadmap
- CEO Advisor
- Funnel OS
- Journey
- Activation Dashboard
- Business State revenue readiness adapter
- Growth Loop revenue signal adapter

Consumer cutover rule:

```text
No consumer cutover before adapter exists.
```

Dashboard rule:

```text
DashboardV4 remains last-wave.
```

## Write / Command Impact

Approved:

```text
Revenue Journey is a read projection.
```

Not approved:

- new revenue writer
- new mission writer
- Dashboard revenue write path
- Growth Loop revenue write path
- Business State revenue write path

Existing underlying event writers remain outside this ADR.

If later work changes who writes revenue milestones, mission completion, CRM revenue, sales revenue, or platform revenue, it must be routed through a command-boundary decision.

## Retirement Impact

Retirement candidates after adapter migration:

- duplicate revenue milestone calculations
- dashboard-local revenue progression
- roadmap-local revenue progression
- `revenue-activation` as independent authority

Not approved for retirement yet:

- `src/modules/revenue-activation/services/revenue-journey-service.ts`
- `src/modules/revenue-activation/hooks/useRevenueJourney.ts`
- `src/modules/revenue-activation/components/RevenueProgress.tsx`

Retirement requires:

- zero runtime references
- stable Journey revenue adapter
- consumer audit
- authority audit
- regression checks

## Required Follow-Up PRs

### P3-002: Journey Revenue Adapter

Create:

```text
JourneyState.revenueProgress
```

Required:

- map current `revenue-activation` milestone model
- map completed checks or mission events into revenue milestones
- expose source/scope/confidence/fallback
- preserve current dashboard behavior until cutover
- no DashboardV4 cutover in adapter PR

### P2-002: Business State Revenue Readiness Adapter

Map:

- readiness
- bottlenecks
- opportunities

Required:

- consume `JourneyState.revenueProgress`
- do not own progression
- do not write revenue events

### P6-002: Growth Loop Revenue Signal Adapter

Map:

- revenue trend
- revenue velocity
- expansion indicators
- retention indicators

Required:

- read Journey revenue progression as one signal
- preserve Growth Loop read-only rule
- do not own milestones

### P3-003: Revenue Consumer Audit

Audit consumers:

- DashboardV4
- RevenueProgress
- Growth Roadmap
- Activation Dashboard
- CEO Advisor
- Funnel OS

Required:

- classify old read path
- classify new read path
- identify retirement candidates

## Approval Conditions

ADR-019 is approved with these conditions:

1. `JourneyState.revenueProgress` must land as a contract before consumer cutover.
2. `revenue-activation` must be treated as adapter input, not final authority.
3. Business State may only consume revenue progression for readiness, bottlenecks, and opportunities.
4. Growth Loop may only consume revenue progression for read-only signals.
5. DashboardV4 and `RevenueProgress` cannot be first-wave consumers.
6. No command/write ownership changes are allowed under this ADR.
7. Retirement of revenue sidecar code requires authority audit and zero runtime references.
8. Adapter outputs must expose `source`, `scope`, `confidence`, and `fallback`.

## Governance Checks

| Rule | Result | Notes |
| --- | --- | --- |
| Rule 1: No layer bypasses upstream authority | PASS | Revenue progression is assigned to Journey, downstream layers consume it. |
| Rule 2: No consumer cutover before adapter exists | PASS WITH CONDITION | P3-002 must land first. |
| Rule 4: DashboardV4 last-wave migration | PASS | Dashboard revenue display cannot cut over early. |
| Rule 6: Growth Loop read-only | PASS | Growth Loop owns signals only. |
| Rule 8: Business State/Journey projection boundary | PASS | Journey owns progression; Business State owns diagnostics. |
| Rule 9: Adapter source/scope/confidence/fallback | PASS WITH CONDITION | Must be enforced in P3-002/P2-002/P6-002. |
| Rule 10: Retirement requires Authority Audit | PASS | Retirement is not approved here. |

## Board Outcome

ARB-002 status:

```text
Approved With Conditions
```

Decision:

```text
Revenue Journey progression is owned by Journey Authority.
```

Canonical source:

```text
JourneyState.revenueProgress
```

Migration impact:

```text
Cross-Layer
```

Implementation readiness:

```text
NOT READY UNTIL FOLLOW-UP CONTRACT AND ADAPTER PRs LAND
```

## Final Architecture Judgment

ADR-019 resolves the Revenue Journey ownership blocker at the architecture level.

It does not authorize direct implementation, DashboardV4 cutover, command-boundary changes, or revenue sidecar retirement.

The next valid action is P3-002 Journey Revenue Adapter, with Business State and Growth Loop adapters following from that contract.
