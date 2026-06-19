# AI COO Read Reduction Report

Status: P4-005 bounded cutover implementation
Authority: AI COO

## Scope

Only this read-only route was cut over:

- `GET /api/v1/business-intel`

## Before

| Route | Direct strategic source |
| --- | --- |
| `GET /api/v1/business-intel` | `ceoAdvisorEngine.generateCEOReport(user.id, user.tenantId)` |

The route returned the CEO Advisor report directly as the response authority.

## After

| Route | AI COO read | View model adapter | Compatibility fallback |
| --- | --- | --- | --- |
| `GET /api/v1/business-intel` | `cooPlanService.getCOOPlan(user.id)` | `toBusinessIntelViewModel` | `ceoAdvisorEngine.generateCEOReport(user.id, user.tenantId)` |

The route now reads `COOPlan` and maps it through the business-intel view model adapter before returning the response.

## Compatibility Boundary

`CEOReport` currently contains fields that are not fully represented in `COOPlan`:

- `health`
- `bottlenecks`
- `opportunities`
- `risks`
- `forecast`
- `automationRecommendations`

For P4-005, `ceoAdvisorEngine.generateCEOReport()` remains in the route as a compatibility fallback for those fields. This is intentional and was approved by the P4-004 plan.

The fallback is not a license to migrate CEO Advisor UI, Dashboard, AI Coach, Workforce, or Agent Runtime.

## Preserved Response Contract

The route still returns:

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

## COOPlan-Owned Fields

The view model now maps:

- `COOPlan.recommendations` to `CEOReport.actions`
- `COOPlan.assignments` to `CEOReport.agentRecommendations`

The remaining CEO report fields are preserved through the compatibility fallback until a later AI COO migration expands the canonical plan contract.

## Preserved Boundaries

P4-005 did not modify:

- `CEOAdvisorDashboard`
- Dashboard components or hooks
- AI Coach route/page/card/service
- Workforce components
- `agentManager`
- `workforce-orchestrator`
- `/api/v1/ai-workforce`
- `/api/v1/ai-workforce/execute`
- Agent Runtime execution dispatch

## Verification

Commands run:

```bash
pnpm type-check
grep -RIn "COOPlanService\|cooPlanService\|getCOOPlan" src --exclude-dir=node_modules --exclude-dir=.next
grep -n "executeAgent\|executeMultiAgent\|orchestrateForGoal\|agentMemoryService\|\.create\|\.update\|\.upsert\|\.delete" src/app/api/v1/business-intel/route.ts src/modules/ai-coo/view-models/BusinessIntelViewModelAdapter.ts
grep -RIn "COOPlanService\|cooPlanService\|getCOOPlan" src/modules/dashboard src/modules/ai-coach src/modules/ai src/modules/business-intelligence/components src/app/'(auth)' src/app/api/v1/ai-workforce 2>/dev/null
```

Results:

- Type-check passed.
- `COOPlanService/getCOOPlan` references are limited to `src/modules/ai-coo/**` and `src/app/api/v1/business-intel/route.ts`.
- No execution or write functions were found in the approved route or view model adapter.
- Blocked consumers have no `COOPlanService/getCOOPlan` references.
