# AI COO Consumer Risk Report

Status: P4-003 consumer audit
Authority: AI COO

No consumer cutover was performed. No runtime behavior was changed.

## Risk Rules Applied

Low risk:

- read-only display shell
- no recommendation ownership
- no assignment ownership
- no delegation ownership

Medium risk:

- displays recommendations
- does not generate them
- does not execute or dispatch work

High risk:

- generates recommendations
- generates assignments
- generates delegations
- chooses local winners
- drives dashboard behavior
- influences runtime execution

## High-Risk Consumers

### `src/app/api/v1/ai-workforce/execute/route.ts`

Risk: High

Reasons:

- runtime execution boundary
- chooses between explicit multi-goal orchestration, direct single-agent execution, and default stage-based execution
- writes execution reports to agent memory
- calls `orchestrateForGoal()`, `agentManager.executeAgent()`, `agentManager.getRecommendedAgents()`, and `agentManager.executeMultiAgent()`

Decision:

- Blocked.
- Must not consume `COOPlanService` in P4.
- Any execution behavior change belongs to Agent Runtime governance.

### `src/modules/ai/components/WorkforceDashboard.tsx`

Risk: High

Reasons:

- reads assignment state through `/api/v1/ai-workforce`
- triggers delegation/execution through `/api/v1/ai-workforce/execute`
- lets the user choose direct agent execution
- displays recent agent reports and recommendations

Decision:

- Blocked.
- Not an early cutover candidate.

### `src/modules/business-intelligence/components/CEOAdvisorDashboard.tsx`

Risk: High

Reasons:

- displays strategic recommendations, opportunities, bottlenecks, risks, next best actions, agent recommendations, automation recommendations, and route CTAs
- consumes the full CEO report contract
- changing it would change CEO Advisor behavior

Decision:

- Blocked as CEO Advisor UI.
- May later consume a response-compatible route that is already adapted to `COOPlan`.

### `src/modules/business-intelligence/ceoAdvisorEngine.ts`

Risk: High

Reasons:

- generates the current strategic recommendation source
- generates business-opportunity assignment hints through `agentRecommendations` and `agentRecommended`
- generates route CTAs

Decision:

- Source should remain wrapped by adapters.
- Not a consumer cutover candidate.

### `src/app/api/v1/ai/coach/recommend/route.ts`

Risk: High

Reasons:

- generates tactical recommendations locally from live metrics
- chooses local winner through ordered route logic
- owns CTA path for immediate action

Decision:

- Blocked.
- Tactical recommendation belongs to Journey authority per ADR-020.

### `src/modules/dashboard/hooks/useDashboardMission.ts`

Risk: High

Reasons:

- locally composes Journey next action, mission state, evolution state, and AI Coach advice
- creates dashboard AI coach message
- chooses dashboard action state

Decision:

- Blocked as Dashboard consumer.

### `src/modules/dashboard/components/AiRecommendationPanel.tsx`

Risk: High

Reasons:

- local `generateRecommendations()` rule engine
- independent dashboard recommendation authority
- chooses local route CTAs from `completedChecks`

Decision:

- Blocked.
- Later retirement candidate, not a cutover candidate.

### `src/modules/ai/services/agent-manager.ts`

Risk: High

Reasons:

- owns plan-filtered stage assignment through `getRecommendedAgents()`
- owns workforce state projection through `getWorkforceState()`
- owns execution dispatch helpers

Decision:

- Blocked.
- Agent Runtime and Assignment governance must handle later migration.

### `src/modules/ai/services/workforce-orchestrator.ts`

Risk: High

Reasons:

- maps explicit goals to agent chains
- calls `agentManager.executeMultiAgent()`
- returns execution reports and recommended actions

Decision:

- Blocked.
- Delegation adapter can mirror planning semantics, but runtime function cannot be cut over here.

## Medium-Risk Consumers

### `src/modules/dashboard/components/AICoachCard.tsx`

Risk: Medium

Reasons:

- consumes tactical coach route
- displays local fixed fallback actions in addition to fetched recommendation
- dashboard surface

Decision:

- Blocked by AI Coach and Dashboard rules.

### `src/app/(auth)/ai/coach/page.tsx`

Risk: Medium

Reasons:

- display page for `/api/v1/ai/coach/recommend`
- consumes tactical recommendation and business snapshot

Decision:

- Blocked as AI Coach consumer.

### `src/app/api/v1/business-intel/route.ts`

Risk: Medium

Reasons:

- read-only API route
- not dashboard and not runtime dispatch
- currently delegates generation to `ceoAdvisorEngine`
- returns CEO report shape used by `CEOAdvisorDashboard`

Decision:

- Only early bounded cutover candidate.
- Candidate requires response compatibility and must not modify `CEOAdvisorDashboard` or `ceoAdvisorEngine`.

## Low-Risk Consumers

### `src/app/(auth)/ceo-mode/page.tsx`

Risk: Low

Reason:

- page shell around `CEOAdvisorDashboard`

Decision:

- Not a direct cutover target.

### `src/app/(auth)/ai-workforce/page.tsx`

Risk: Low

Reason:

- page shell around `WorkforceDashboard`

Decision:

- Not a direct cutover target.

## Blocked Consumer List

Must remain blocked until later wave approval:

- `DashboardV4`
- `AiRecommendationPanel`
- AI Coach surfaces
- `CEOAdvisorDashboard`
- `WorkforceDashboard`
- `agentManager`
- `workforce-orchestrator`
- `/api/v1/ai-workforce/execute`

## Early Cutover Candidate

Candidate:

- `src/app/api/v1/business-intel/route.ts`

Why:

- read-only
- non-dashboard
- non-runtime
- no execution dispatch
- can potentially call `COOPlanService` and adapt back to the existing `CEOReport` response shape

Constraints:

- must preserve `CEOReport` response compatibility
- must not change `CEOAdvisorDashboard`
- must not change `ceoAdvisorEngine`
- must not change AI Coach
- must not change Workforce
- must not change Agent Runtime
