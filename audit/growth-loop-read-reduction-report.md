# Growth Loop Read Reduction Report

Status: P6-005 consumer cutover implementation
Authority: Growth Loop
Approved route: `GET /api/v1/analytics/member`

## Summary

`GET /api/v1/analytics/member` now reads Growth Loop state through `GrowthLoopStateService` and maps the result through `MemberAnalyticsViewModelAdapter`.

The route still uses the existing member analytics payload as compatibility fallback so the full `AnalyticsDashboardData` response shape is preserved.

No dashboard, roadmap, CRM, lead, traffic, funnel, invite, automation, platform-admin, workforce, or agent-runtime behavior was changed.

## Before

The approved route directly returned:

- `analyticsService.getMemberAnalytics(user, period)`

The route had no Growth Loop read authority.

## After

The approved route reads:

- `growthLoopStateService.getGrowthLoopState(user.id)`
- `analyticsService.getMemberAnalytics(user, period)` as compatibility fallback
- `toMemberAnalyticsViewModel(growthLoopState, fallback)`

## Response Compatibility

The route continues to return:

```ts
{
  data: AnalyticsDashboardData;
}
```

The adapter preserves:

- `view`
- `period`
- `range`
- trend arrays
- funnel arrays
- heatmap
- `memberStats`
- `topMembers`

The adapter only maps Growth Loop values into compatible `summary` fields when the meaning is explicit.

## Boundary Confirmation

Changed files:

- `src/app/api/v1/analytics/member/route.ts`
- `src/modules/growth-loop/view-models/MemberAnalyticsViewModelAdapter.ts`
- `audit/growth-loop-read-reduction-report.md`

Explicitly unchanged:

- DashboardV4
- Growth Roadmap
- AI Coach
- CEO Advisor
- CRM routes and services
- Lead Engine
- Traffic Engine
- Funnel generation
- Invite Service
- Platform Admin
- Workforce
- Agent Runtime

## Write Confirmation

The approved route and view model do not write:

- leads
- CRM state
- traffic state
- funnel state
- invite state
- journey state
- automation state

## Exit Gate

Eligible for:

- `P6-006_GROWTH_LOOP_POST_CUTOVER_AUDIT.md`
