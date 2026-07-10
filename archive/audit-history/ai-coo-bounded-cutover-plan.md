# AI COO Bounded Cutover Plan

Status: P4-004 consumer cutover planning
Authority: AI COO
Work type: planning only
Runtime changes: none

## Objective

Define the first bounded AI COO consumer migration without changing runtime behavior in P4-004.

The first migration must validate this path:

```text
COOPlanService
  -> COOPlan
  -> BusinessIntelViewModel
  -> GET /api/v1/business-intel
  -> same response
```

## Approved Candidate

Only approved target:

- `GET /api/v1/business-intel`
- File: `src/app/api/v1/business-intel/route.ts`

## Cutover Decision

Proceed to P4-005 with a bounded read-only route cutover plan.

This does not approve AI Coach, CEO Advisor UI, Dashboard, Workforce, Agent Runtime, assignment execution, delegation execution, or legacy recommendation retirement.

## Explicitly Blocked

- `DashboardV4`
- `AiRecommendationPanel`
- AI Coach route/page/card/service
- `CEOAdvisorDashboard`
- `WorkforceDashboard`
- `agentManager`
- `workforce-orchestrator`
- `GET /api/v1/ai-workforce`
- `POST /api/v1/ai-workforce/execute`
- Agent Runtime execution dispatch
- source service retirement

## Target Flow

Current:

```text
ceoAdvisorEngine
  -> business-intel route
  -> CEOReport response
```

Target:

```text
COOPlanService
  -> COOPlan
  -> BusinessIntelViewModelAdapter
  -> business-intel route
  -> same CEOReport response
```

## Current Response Contract

The route currently returns:

```ts
{
  data: {
    summary: string;
    health: BusinessHealth;
    bottlenecks: Bottleneck[];
    opportunities: GrowthOpportunity[];
    actions: NextBestAction[];
    risks: BusinessRisk[];
    forecast: BusinessForecast;
    agentRecommendations: string[];
    automationRecommendations: string[];
  };
}
```

P4-005 must preserve this response shape for `CEOAdvisorDashboard`.

## P4-005 Implementation Boundary

P4-005 may add:

- `src/modules/ai-coo/view-models/BusinessIntelViewModelAdapter.ts`
- focused adapter tests if practical
- route-level wiring in `src/app/api/v1/business-intel/route.ts`
- a read-reduction report

P4-005 may import `COOPlanService` only in:

- `src/app/api/v1/business-intel/route.ts`
- `src/modules/ai-coo/**`
- approved tests for the route or view model

P4-005 must not import `COOPlanService` into:

- `src/modules/business-intelligence/components/CEOAdvisorDashboard.tsx`
- `src/app/(auth)/ceo-mode/page.tsx`
- Dashboard components or hooks
- AI Coach route/page/card/service
- Workforce components
- `agentManager`
- `workforce-orchestrator`
- `/api/v1/ai-workforce`
- `/api/v1/ai-workforce/execute`

## ViewModel Rules

`BusinessIntelViewModelAdapter` must:

- accept `COOPlan`
- return the existing `CEOReport` shape
- preserve top-level `data`
- map strategic `COORecommendation[]` to `actions`
- map `COOAssignment[]` to `agentRecommendations`
- preserve current report compatibility for `health`, `bottlenecks`, `opportunities`, `risks`, `forecast`, and `automationRecommendations`
- use explicit compatibility fallback where `COOPlan` does not yet carry enough fields

The adapter must not:

- execute assignments
- execute delegations
- dispatch agents
- call `agentManager.executeAgent`
- call `agentManager.executeMultiAgent`
- call `orchestrateForGoal`
- write to agent memory
- mutate database state
- compute tactical next actions
- change dashboard behavior

## Compatibility Strategy

Because `CEOReport` contains fields that are not fully represented in `COOPlan` yet, P4-005 should use a compatibility input.

Recommended function shape:

```ts
toBusinessIntelViewModel(plan: COOPlan, fallback: CEOReport): CEOReport
```

Allowed compatibility behavior:

- use `fallback.health`
- use `fallback.bottlenecks`
- use `fallback.opportunities`
- use `fallback.risks`
- use `fallback.forecast`
- use `fallback.automationRecommendations`
- derive `summary`, `actions`, and `agentRecommendations` from `COOPlan` only when response compatibility is preserved

This keeps the first cutover bounded to read authority validation instead of forcing a full CEO Advisor schema migration.

## Route Rules

The route may continue to:

- authenticate with `requireAuthApi`
- return `NextResponse.json({ data })`
- use `ceoAdvisorEngine.generateCEOReport()` as compatibility fallback

The route must:

- call `cooPlanService.getCOOPlan(user.id)` for the approved AI COO read
- pass the returned `COOPlan` through `BusinessIntelViewModelAdapter`
- preserve current `CEOReport` response fields

The route must not:

- call any Agent Runtime execution function
- write agent memory
- change request method behavior
- add POST behavior
- change CEO Advisor dashboard imports

## Acceptance Checks

P4-005 must verify:

- `GET /api/v1/business-intel` still returns `data`
- `data.summary` exists
- `data.health` exists
- `data.bottlenecks` exists
- `data.opportunities` exists
- `data.actions` exists
- `data.risks` exists
- `data.forecast` exists
- `data.agentRecommendations` exists
- `data.automationRecommendations` exists
- route remains read-only
- no assignment execution occurs
- no delegation execution occurs
- no workforce route changes occur
- no dashboard imports of `COOPlanService`

## Required Verification

Run:

```bash
pnpm type-check
grep -RIn "COOPlanService\|cooPlanService\|getCOOPlan" src --exclude-dir=node_modules --exclude-dir=.next
grep -n "executeAgent\|executeMultiAgent\|orchestrateForGoal\|agentMemoryService\|\\.create\|\\.update\|\\.upsert\|\\.delete" src/app/api/v1/business-intel/route.ts src/modules/ai-coo/view-models/BusinessIntelViewModelAdapter.ts
```

Expected import boundary after P4-005:

- `src/modules/ai-coo/**`
- `src/app/api/v1/business-intel/route.ts`
- approved tests only

Expected forbidden execution/write grep:

- no matches in the approved route or view model adapter

## Rollback Plan

If response compatibility fails in P4-005:

1. Revert only `src/app/api/v1/business-intel/route.ts`.
2. Keep `BusinessIntelViewModelAdapter` only if unused and type-safe.
3. Restore direct route call to `ceoAdvisorEngine.generateCEOReport(user.id, user.tenantId)`.
4. Do not touch CEO Advisor UI, Dashboard, AI Coach, Workforce, Agent Runtime, `agentManager`, or `workforce-orchestrator`.

## Success Criteria

- One read-only route is included.
- `CEOReport` response compatibility is preserved.
- No assignment execution is introduced.
- No delegation execution is introduced.
- No workforce behavior changes are introduced.
- No dashboard dependency is introduced.
- No AI Coach migration is introduced.
- No Agent Runtime migration is introduced.
- No runtime behavior changes are made in P4-004.

## Exit Gate

Eligible for:

- `P4-005_BOUNDED_AI_COO_CUTOVER_IMPLEMENTATION.md`

Not eligible for:

- AI Coach cutover
- CEO Advisor UI cutover
- Dashboard cutover
- Workforce cutover
- Agent Runtime cutover
- recommendation system retirement
- source service retirement
