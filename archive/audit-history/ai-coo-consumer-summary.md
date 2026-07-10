# AI COO Consumer Summary

Status: P4-003 consumer audit
Authority: AI COO
Final Decision: READY FOR BOUNDED CUTOVER

No consumer cutover was performed. No runtime behavior was changed.

## Summary

Current AI COO-like consumption is split across four active clusters:

- CEO Advisor strategic recommendation consumers
- AI Coach tactical recommendation consumers
- Dashboard local recommendation consumers
- Workforce assignment/delegation/runtime consumers

No runtime consumer currently reads `COOPlanService`.

## Recommendation Consumers

Strategic recommendation consumers:

- `GET /api/v1/business-intel`
- `CEOAdvisorDashboard`
- `CEOModePage`

Tactical recommendation consumers:

- `GET /api/v1/ai/coach/recommend`
- `AICoachCard`
- `/ai/coach`
- `ai-coach-service`
- `useDashboardMission()`

Legacy/local dashboard recommendation consumers:

- `AiRecommendationPanel`
- `DashboardV4` through `useDashboardMission()`

Finding:

- Strategic and tactical recommendations are not yet separated by canonical contract at consumer level.
- ADR-020 requires AI COO to own strategic recommendation only.

## Assignment Consumers

Current assignment sources and consumers:

- `getAgentsForMissionStage()` for stage assignment
- `agentManager.getRecommendedAgents()` for plan-filtered stage assignment
- `orchestrateForGoal()` for explicit-goal assignment plus execution
- `ceoAdvisorEngine.agentRecommendations` for business-opportunity assignment hints
- `WorkforceDashboard` and `/api/v1/ai-workforce` for assignment display
- `/api/v1/ai-workforce/execute` for assignment-driven execution

Finding:

- Assignment remains split across journey stage, explicit goal, and business opportunity.
- ADR-021 requires AI COO to own assignment planning, while Agent Runtime keeps execution dispatch.

## Delegation Consumers

Current delegation consumers:

- `WorkforceDashboard`
- `/api/v1/ai-workforce/execute`
- `workforce-orchestrator`
- `agentManager.executeMultiAgent()`
- `CEOAdvisorDashboard` as a strategic delegation hint display

Finding:

- Delegation is currently tightly coupled to execution in Workforce.
- AI COO adapters may describe delegation plans, but Agent Runtime still owns execution.

## Blocked Consumers

The following are not eligible for immediate cutover:

- `DashboardV4`
- `AiRecommendationPanel`
- AI Coach route/page/card/service
- `CEOAdvisorDashboard`
- `WorkforceDashboard`
- `agentManager`
- `workforce-orchestrator`
- `/api/v1/ai-workforce`
- `/api/v1/ai-workforce/execute`

## Bounded Cutover Candidate

Only one bounded candidate was found:

- `src/app/api/v1/business-intel/route.ts`

Reason:

- read-only route
- non-dashboard
- non-runtime
- no Agent Runtime execution dispatch
- can be planned as a response-compatible wrapper around `COOPlanService`

Required cutover constraints:

- preserve the current `CEOReport` response shape
- do not modify `CEOAdvisorDashboard`
- do not modify `ceoAdvisorEngine`
- do not modify AI Coach consumers
- do not modify Workforce consumers
- do not modify Agent Runtime execution

## Exit Gate

Eligible for:

- `P4-004_BOUNDED_AI_COO_CUTOVER_PLAN.md`

Not eligible for:

- AI Coach cutover
- CEO Advisor UI cutover
- Dashboard cutover
- Workforce cutover
- Agent Runtime cutover
