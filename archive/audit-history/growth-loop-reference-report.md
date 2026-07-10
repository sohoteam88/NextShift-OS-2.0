# Growth Loop Reference Report

Status: P6-006 reference report
Authority: Growth Loop
Decision: PASS

## Approved Cutover Reference

Approved route:

- `src/app/api/v1/analytics/member/route.ts`

Current flow:

```text
requireAuthApi
  -> requireRoleApi(user, ['member'])
  -> growthLoopStateService.getGrowthLoopState(user.id)
  -> analyticsService.getMemberAnalytics(user, period)
  -> toMemberAnalyticsViewModel(growthLoopState, fallback)
  -> NextResponse.json({ data })
```

## View Model Reference

File:

- `src/modules/growth-loop/view-models/MemberAnalyticsViewModelAdapter.ts`

Export:

- `toMemberAnalyticsViewModel(growthLoopState: GrowthLoopState, fallback: AnalyticsDashboardData): AnalyticsDashboardData`

Behavior:

- preserves the complete `AnalyticsDashboardData` fallback shape
- overlays compatible Growth Loop summary metrics
- does not generate recommendations
- does not generate actions
- does not write state

## Growth Loop Authority Files

Contracts:

- `src/modules/growth-loop/contracts/GrowthSignal.ts`
- `src/modules/growth-loop/contracts/AcquisitionSignal.ts`
- `src/modules/growth-loop/contracts/ActivationSignal.ts`
- `src/modules/growth-loop/contracts/RetentionSignal.ts`
- `src/modules/growth-loop/contracts/ReferralSignal.ts`
- `src/modules/growth-loop/contracts/ExpansionSignal.ts`
- `src/modules/growth-loop/contracts/GrowthLoopState.ts`

Adapters:

- `src/modules/growth-loop/adapters/AcquisitionSignalAdapter.ts`
- `src/modules/growth-loop/adapters/ActivationSignalAdapter.ts`
- `src/modules/growth-loop/adapters/RetentionSignalAdapter.ts`
- `src/modules/growth-loop/adapters/ReferralSignalAdapter.ts`
- `src/modules/growth-loop/adapters/ExpansionSignalAdapter.ts`
- `src/modules/growth-loop/adapters/GrowthLoopAssembler.ts`

Service:

- `src/modules/growth-loop/services/GrowthLoopStateService.ts`

View model:

- `src/modules/growth-loop/view-models/MemberAnalyticsViewModelAdapter.ts`

## Preserved Compatibility Reference

Compatibility source:

- `src/modules/analytics/services/analytics-service.ts`

Compatibility type:

- `src/modules/analytics/types.ts`
- `AnalyticsDashboardData`

Compatibility route:

- `src/app/api/v1/analytics/member/route.ts`

## Blocked Consumer Reference

No Growth Loop consumer imports were added to:

- `src/modules/dashboard/**`
- `src/modules/growth-roadmap/**`
- `src/modules/lead-engine/**`
- `src/modules/traffic-engine/**`
- `src/modules/business-intelligence/**`
- `src/app/(auth)/**`

The following remain blocked by governance:

- DashboardV4
- Growth Roadmap
- AI Coach
- CEO Advisor
- CRM writes
- invite writes
- Lead Engine writes
- Traffic generation
- Funnel generation
- Platform Admin
- Workforce
- Agent Runtime

## Governance Reference

P6-005 complied with:

- bounded route-only migration
- read-only route cutover
- response compatibility
- no recommendation ownership
- no action ownership
- no assignment ownership
- no write behavior
- no dashboard cutover
- no runtime cutover

## Final Reference Decision

PASS.
