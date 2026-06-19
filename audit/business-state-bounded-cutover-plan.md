# Business State Bounded Cutover Plan

Status: P2-004 consumer cutover planning
Authority: Business State
Work type: planning only
Runtime changes: none

## Objective

Define the first bounded Business State consumer migration without changing runtime behavior in P2-004. The implementation wave must only target low-risk, read-only consumers confirmed by P2-003.

## Cutover Decision

Proceed to P2-005 with a bounded read-only route cutover plan.

Allowed targets:

1. `src/app/api/v1/funnel/funnels/[id]/health/route.ts`
2. GET side of `src/app/api/v1/social-setup/route.ts`
3. `src/app/api/v1/traffic-engine/route.ts`

Blocked targets:

- `DashboardV4`
- `useDashboardMission`
- Journey page
- `getNextJourneyAction`
- Activation
- Mission Service
- AI Coach
- CEO Advisor / AI COO
- Workforce
- Growth Loop
- BrandContextProvider
- Social setup generate route
- Traffic generate route
- Funnel OS route
- Legacy mission routes

## Target Architecture

Current:

```text
Source Service
  -> Consumer Route
  -> Existing Response Shape
```

Target:

```text
BusinessStateService
  -> BusinessState
  -> Route-Specific ViewModel Adapter
  -> Consumer Route
  -> Existing Response Shape
```

The route response contract must remain compatible. P2-005 may use `BusinessStateService` to derive equivalent readiness view models, but it must not change route names, response top-level keys, write behavior, or dashboard behavior.

## P2-005 Implementation Boundary

P2-005 may add:

- `src/modules/business-state/view-models/FunnelHealthViewModelAdapter.ts`
- `src/modules/business-state/view-models/SocialReadinessViewModelAdapter.ts`
- `src/modules/business-state/view-models/TrafficReadinessViewModelAdapter.ts`
- route-level wiring for the three approved GET/read-only routes
- focused tests for response compatibility

P2-005 must not add:

- `BusinessStateService` imports inside dashboard components or dashboard hooks
- `BusinessStateService` imports inside Journey, Activation, AI, Growth, Mission write paths, or generation routes
- recommendation or next-action behavior changes
- source service deletion or retirement
- response contract breaking changes

## Approved Candidate 1: Funnel Health Route

File: `src/app/api/v1/funnel/funnels/[id]/health/route.ts`

Current source:

- `funnelHealthService.calculate(funnelId, user)`

Current response:

```ts
NextResponse.json({ data: health })
```

Business State mapping:

- `BusinessState.readiness` can supply normalized readiness metadata.
- `BusinessState.bottlenecks` can supply funnel-domain blocker hints.
- `BusinessState.opportunities` can supply funnel-domain improvement hints only if exposed as additive diagnostic fields.

Implementation approach:

- Keep `funnelHealthService.calculate()` available as compatibility fallback.
- Introduce a route-local or module-local view model adapter that maps `BusinessState` into the existing health response shape.
- Preserve the `data` top-level response key.
- Do not touch Funnel OS, `FunnelOperatingCard`, or funnel next-action selection.

Acceptance checks:

- Existing funnel health API tests continue to pass.
- Response fields used by current consumers are present.
- No dashboard imports of `BusinessStateService`.

Risk: Low, if response compatibility is preserved.

## Approved Candidate 2: Social Setup GET Readiness Route

File: `src/app/api/v1/social-setup/route.ts`

Current source:

- `socialSetupService.getSetup(user.id)`
- `socialSetupService.getReadiness(user.id)`

Current GET response:

```ts
NextResponse.json({ data: setup, readiness })
```

Business State mapping:

- `BusinessState.readiness` can provide normalized readiness.
- `BusinessState.bottlenecks` can provide social-domain missing setup blockers.

Implementation approach:

- Limit cutover to GET only.
- Keep PUT unchanged because it is a write path.
- Keep `data: setup` unchanged.
- Replace or augment only `readiness` through a Social Readiness view model adapter.
- Preserve the existing readiness response shape expected by `SocialSetupWizard`.

Acceptance checks:

- GET `/api/v1/social-setup` response still includes `data` and `readiness`.
- PUT `/api/v1/social-setup` remains untouched.
- Social setup generation route remains untouched.

Risk: Low for GET only. Medium or higher if PUT/generation is included, so those are blocked.

## Approved Candidate 3: Traffic Engine GET Readiness Route

File: `src/app/api/v1/traffic-engine/route.ts`

Current source:

- `trafficEngineService.get(user.id)`

Current response:

```ts
NextResponse.json({ data: await trafficEngineService.get(user.id) })
```

Business State mapping:

- `BusinessState.readiness` can provide normalized traffic readiness.
- `BusinessState.bottlenecks` can provide traffic-domain missing items.
- `BusinessState.opportunities` can provide traffic-domain suggestions only if additive and non-recommendation-owning.

Implementation approach:

- Limit cutover to GET only.
- Keep traffic generation route unchanged because it creates recommendations and can notify mission progress.
- Preserve the `data` top-level response key and existing `readiness` fields used by `TrafficDashboard`.
- Use `trafficEngineService.get()` as compatibility fallback if the view model cannot preserve shape.

Acceptance checks:

- GET `/api/v1/traffic-engine` still returns a dashboard-compatible `data` payload.
- POST `/api/v1/traffic-engine/generate` remains untouched.
- No mission progress side effects are introduced.

Risk: Low for GET only. High if generation or recommendations are touched, so those are blocked.

## Required ViewModel Rules

Each view model adapter must:

- accept `BusinessState`
- return the existing route response shape or a strictly additive extension
- avoid recommendation ownership
- avoid next-action ownership
- include source/fallback diagnostics only under additive diagnostic fields
- keep missing source handling explicit

Each view model adapter must not:

- infer Journey stage
- compute dashboard mission
- call AI Advisor
- mutate mission progress
- write to database
- delete existing source service code

## P2-005 Suggested Steps

1. Add view model adapter files under `src/modules/business-state/view-models/`.
2. Add tests for each adapter against representative `BusinessState` fixtures.
3. Wire only the three approved GET routes to `BusinessStateService`.
4. Preserve response contracts with compatibility fallbacks.
5. Run `pnpm type-check`.
6. Run targeted API or unit tests for funnel health, social setup GET, and traffic engine GET.
7. Re-run import boundary check:

```bash
grep -RIn "BusinessStateService\\|businessStateService\\|getBusinessState" src --exclude-dir=node_modules --exclude-dir=.next
```

Expected result after P2-005:

- allowed imports in `src/modules/business-state/**`
- allowed imports in the three approved route files only
- no dashboard, journey, activation, AI, growth, mission write, or generation route imports

## Rollback Plan

If any compatibility check fails in P2-005:

1. Revert the route wiring only.
2. Keep view model adapters if they are unused and type-safe.
3. Restore route reads to the previous source services.
4. Do not change Dashboard, Journey, AI, Growth, or Mission during rollback.

## Exit Gate

Eligible for:

- `P2-005_BOUNDED_BUSINESS_STATE_CUTOVER_IMPLEMENTATION`

Not eligible for:

- Dashboard cutover
- Journey cutover
- AI COO cutover
- Activation cutover
- Growth Loop cutover
- Legacy retirement
- Source service retirement

## Success Criteria

- Only read-only consumers are included.
- No recommendation consumers are included.
- No next-action consumers are included.
- No dashboard consumers are included.
- No journey consumers are included.
- No AI consumers are included.
- No runtime behavior changes are made in P2-004.
