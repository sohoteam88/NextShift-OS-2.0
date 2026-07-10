# Growth Loop Bounded Cutover Plan

Status: P6-004 consumer cutover planning
Authority: Growth Loop
Work type: planning only
Runtime changes: none

## Objective

Define the first bounded Growth Loop consumer migration without changing runtime behavior in P6-004.

The first migration must validate this path:

```text
GrowthLoopStateService
  -> GrowthLoopState
  -> MemberAnalyticsViewModelAdapter
  -> GET /api/v1/analytics/member
  -> same response
```

## Approved Candidate

Only approved target:

- `GET /api/v1/analytics/member`
- File: `src/app/api/v1/analytics/member/route.ts`

## Cutover Decision

Proceed to P6-005 with a bounded read-only route cutover plan.

This does not approve DashboardV4, Growth Roadmap, AI Coach, CEO Advisor, CRM write paths, inviteService write paths, lead generation, traffic generation, funnel generation, automation execution, or platform-admin decision surfaces.

## Explicitly Blocked

- `DashboardV4`
- `growth-roadmap`
- AI Coach
- CEO Advisor
- Workforce
- Agent Runtime
- CRM write paths
- `inviteService` write paths
- lead creation or lead mutation
- traffic generation
- funnel generation
- funnel health action ownership
- mission or journey writes
- automation execution
- platform-admin analytics actions
- platform-admin decision surfaces

## Target Flow

Current:

```text
analyticsService.getMemberAnalytics()
  -> GET /api/v1/analytics/member
  -> AnalyticsDashboardData response
```

Target:

```text
GrowthLoopStateService
  -> GrowthLoopState
  -> MemberAnalyticsViewModelAdapter
  -> GET /api/v1/analytics/member
  -> same AnalyticsDashboardData response
```

## Current Response Contract

The route currently returns:

```ts
{
  data: AnalyticsDashboardData;
}
```

`AnalyticsDashboardData` contains:

```ts
{
  view: AnalyticsScopeRole;
  period: AnalyticsPeriod;
  range: { start: string; end: string };
  summary: {
    totalUsers: number;
    activeMembers: number;
    newMembers: number;
    totalLeads: number;
    totalConversions: number;
    conversionRate: number;
    contentCount: number;
    aiUsageCount: number;
    funnelViews: number;
    funnelConversions: number;
    actionCompletionRate: number;
    memberRetentionRate: number;
    avgResponseMinutes: number | null;
  };
  stageDistribution: AnalyticsDistributionPoint[];
  leadTrend: AnalyticsTrendPoint[];
  conversionTrend: AnalyticsTrendPoint[];
  conversionFunnel: AnalyticsFunnelStep[];
  contentByPlatform: AnalyticsDistributionPoint[];
  aiUsageTrend: AnalyticsTrendPoint[];
  funnelPerformance: AnalyticsFunnelPerformance[];
  actionCompletionTrend: AnalyticsTrendPoint[];
  teamGrowthTrend: AnalyticsTrendPoint[];
  heatmap: AnalyticsHeatmapCell[];
  memberStats: AnalyticsMemberStat[];
  topMembers: AnalyticsMemberStat[];
}
```

P6-005 must preserve this full response shape.

## P6-005 Implementation Boundary

P6-005 may add:

- `src/modules/growth-loop/view-models/MemberAnalyticsViewModelAdapter.ts`
- focused adapter tests if practical
- route-level wiring in `src/app/api/v1/analytics/member/route.ts`
- a read-reduction report

P6-005 may import `GrowthLoopStateService` only in:

- `src/app/api/v1/analytics/member/route.ts`
- `src/modules/growth-loop/**`
- approved tests for the route or view model

P6-005 must not import `GrowthLoopStateService` into:

- Dashboard components
- Growth Roadmap
- CRM routes, hooks, or services
- AI Coach
- CEO Advisor or AI COO consumers
- Lead Engine
- Traffic Engine
- Funnel Engine
- Invite Service
- Mission/Journey services
- Automation
- Platform Admin
- Agent Runtime
- Workforce

## ViewModel Rules

`MemberAnalyticsViewModelAdapter` must:

- accept `GrowthLoopState`
- return the existing `AnalyticsDashboardData` shape
- preserve top-level `data` wrapping in the route
- preserve `view`, `period`, and `range`
- preserve all trend arrays and list fields
- map Growth Loop signals into compatible summary fields only where safe
- use explicit analytics fallback where `GrowthLoopState` does not yet carry enough analytics detail

Allowed Growth Loop mappings:

- `AcquisitionSignal` -> lead/acquisition summary metrics
- `ActivationSignal` -> activation or action-completion compatible metrics only if response compatibility is preserved
- `RetentionSignal` -> retention summary metrics
- `ReferralSignal` -> referral-derived growth metrics only through compatible fallback fields
- `ExpansionSignal` -> growth/team compatible metrics only through compatible fallback fields

The adapter must not:

- generate recommendations
- generate actions
- generate next steps
- generate assignments
- mutate CRM
- mutate leads
- mutate traffic
- mutate funnels
- mutate invites
- mutate journey state
- call AI execution or agent runtime code
- change dashboard behavior

## Compatibility Strategy

Because `AnalyticsDashboardData` contains many fields that `GrowthLoopState` does not fully represent yet, P6-005 should use a compatibility input.

Recommended function shape:

```ts
toMemberAnalyticsViewModel(
  growthLoopState: GrowthLoopState,
  fallback: AnalyticsDashboardData
): AnalyticsDashboardData
```

Allowed compatibility behavior:

- preserve fallback `view`, `period`, and `range`
- preserve fallback trend arrays
- preserve fallback funnel, heatmap, memberStats, and topMembers
- derive compatible `summary` fields from `GrowthLoopState` only when field meaning is unambiguous
- keep fallback values for any field not fully represented by `GrowthLoopState`

This keeps the first cutover bounded to Growth Loop read authority validation instead of forcing a full analytics schema migration.

## Route Rules

The route may continue to:

- authenticate with `requireAuthApi`
- enforce `requireRoleApi(user, ['member'])`
- read the `period` search param
- return `NextResponse.json({ data })`
- use `analyticsService.getMemberAnalytics(user, period)` as compatibility fallback

The route must:

- call `growthLoopStateService.getGrowthLoopState(user.id)`
- pass the returned `GrowthLoopState` through `MemberAnalyticsViewModelAdapter`
- preserve current `AnalyticsDashboardData` response fields
- remain read-only

The route must not:

- write leads
- write CRM
- send or create invites
- trigger traffic generation
- trigger funnel generation
- trigger automation
- generate AI recommendations
- generate Growth Roadmap steps
- change dashboard imports
- change role behavior

## Acceptance Checks

P6-005 must verify:

- route still returns top-level `data`
- `data.view` exists
- `data.period` exists
- `data.range` exists
- `data.summary` exists
- `data.summary.totalLeads` exists
- `data.summary.totalConversions` exists
- `data.summary.conversionRate` exists
- `data.summary.memberRetentionRate` exists
- `data.summary.funnelViews` exists
- `data.leadTrend` exists
- `data.conversionTrend` exists
- `data.conversionFunnel` exists
- `data.contentByPlatform` exists
- `data.aiUsageTrend` exists
- `data.funnelPerformance` exists
- `data.actionCompletionTrend` exists
- `data.teamGrowthTrend` exists
- `data.heatmap` exists
- `data.memberStats` exists
- `data.topMembers` exists
- route remains read-only
- no recommendation ownership is introduced
- no action ownership is introduced
- no assignment ownership is introduced
- no dashboard imports are introduced

## Required Verification

Run:

```bash
pnpm type-check
grep -RIn "GrowthLoopStateService\|growthLoopStateService\|getGrowthLoopState" src --exclude-dir=node_modules --exclude-dir=.next
grep -n "recommendation\|nextAction\|assignment\|\\.create\|\\.update\|\\.upsert\|\\.delete" src/app/api/v1/analytics/member/route.ts src/modules/growth-loop/view-models/MemberAnalyticsViewModelAdapter.ts
```

Expected import boundary after P6-005:

- `src/modules/growth-loop/**`
- `src/app/api/v1/analytics/member/route.ts`
- approved tests only

Expected forbidden recommendation/action/write grep:

- no new recommendation, next-action, assignment, or write behavior in the approved route or view model adapter

## Rollback Plan

If response compatibility fails in P6-005:

1. Revert only `src/app/api/v1/analytics/member/route.ts`.
2. Keep `MemberAnalyticsViewModelAdapter` only if unused and type-safe.
3. Restore direct route call to `analyticsService.getMemberAnalytics(user, period)`.
4. Do not touch Dashboard, Growth Roadmap, CRM, Lead Engine, Traffic Engine, Invite Service, AI Coach, CEO Advisor, Platform Admin, Workforce, or Agent Runtime.

## Success Criteria

- One read-only route is included.
- `AnalyticsDashboardData` response compatibility is preserved.
- No recommendation ownership is introduced.
- No action ownership is introduced.
- No assignment ownership is introduced.
- No write behavior is introduced.
- No dashboard change is introduced.
- No Growth Roadmap change is introduced.
- No CRM, lead, traffic, funnel, invite, automation, platform-admin, workforce, or agent-runtime change is introduced.

## Exit Gate

Eligible for:

- `P6-005_BOUNDED_GROWTH_LOOP_CUTOVER_IMPLEMENTATION.md`

Not eligible for:

- Dashboard cutover
- Growth Roadmap cutover
- CRM cutover
- Lead Engine cutover
- Traffic Engine cutover
- Funnel cutover
- Platform Admin cutover
- AI Coach cutover
- CEO Advisor cutover
