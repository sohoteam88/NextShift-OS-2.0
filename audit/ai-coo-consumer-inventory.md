# AI COO Consumer Inventory

Status: P4-003 consumer audit
Authority: AI COO
Scope: runtime consumers of strategic recommendations, assignments, and delegations.

No consumer cutover was performed. No runtime behavior was changed.

## Inventory

| File Path | Consumer Name | Consumer Type | Reads Recommendation | Reads Assignment | Reads Delegation | Generates Recommendation | Generates Assignment | Generates Delegation | Current Source | Chooses Local Winner | Migration Risk | Early Cutover Candidate | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `src/app/api/v1/business-intel/route.ts` | `GET /api/v1/business-intel` | CEO | Yes | Yes | No | Yes | Yes | No | `ceoAdvisorEngine.generateCEOReport()` | Yes | Medium | Yes | Read-only API gateway for CEO report. It invokes the current strategic source and returns actions, opportunities, agent recommendations, and automation recommendations. Candidate only for a bounded response-compatible route cutover plan. |
| `src/modules/business-intelligence/components/CEOAdvisorDashboard.tsx` | `CEOAdvisorDashboard` | CEO | Yes | Yes | Yes | No | No | No | `/api/v1/business-intel` | No | High | No | Displays executive summary, health recommendations, bottleneck/risk recommendations, opportunities, next best actions, agent recommendations, automation recommendations, and route CTAs. Blocked as CEO Advisor UI. |
| `src/app/(auth)/ceo-mode/page.tsx` | `CEOModePage` | CEO | Yes | Yes | Yes | No | No | No | `CEOAdvisorDashboard` | No | Low | No | Page shell only. Real migration risk is in `CEOAdvisorDashboard` and `GET /api/v1/business-intel`. |
| `src/modules/business-intelligence/ceoAdvisorEngine.ts` | `ceoAdvisorEngine.generateCEOReport()` | CEO | Yes | Yes | Yes | Yes | Yes | Yes | Internal business metrics, brand context, opportunity ranking, agent hints | Yes | High | No | Strategic source of record today. Generates health recommendations, bottlenecks, opportunities, actions, risks, agent recommendations, automation recommendations, and routes. Source must be wrapped, not replaced, until later cutover. |
| `src/app/api/v1/ai/coach/recommend/route.ts` | `GET /api/v1/ai/coach/recommend` | Coach | Yes | No | No | Yes | No | No | Local Prisma metrics and route-local rule order | Yes | High | No | Generates tactical recommendation and CTA from overdue followups, daily actions, leads, content, and funnels. ADR-020 says tactical next action belongs to Journey, not AI COO strategic planning. |
| `src/modules/dashboard/components/AICoachCard.tsx` | `AICoachCard` | Coach | Yes | No | No | No | No | No | `/api/v1/ai/coach/recommend` plus local fixed action fallbacks | Yes | Medium | No | Displays tactical coach recommendation and adds fixed local actions. Blocked as AI Coach/dashboard surface. |
| `src/app/(auth)/ai/coach/page.tsx` | `AICoachPage` | Coach | Yes | No | No | No | No | No | `/api/v1/ai/coach/recommend` | No | Medium | No | Display page for tactical coach route. Blocked as AI Coach surface. |
| `src/modules/ai-coach/ai-coach-service.ts` | `getAICoachAdvice()` | Coach | Yes | No | No | Yes | No | No | Static mission-aware advice table | Yes | High | No | Generates mission-context advice and `nextBestAction` text. Used by dashboard mission chain. Tactical/mission advice is not strategic AI COO recommendation. |
| `src/modules/dashboard/hooks/useDashboardMission.ts` | `useDashboardMission()` | Dashboard | Yes | No | No | Yes | No | No | `getNextJourneyAction()`, `getCurrentMission()`, `getAICoachAdvice()` | Yes | High | No | Builds dashboard mission and AI coach message locally. Mixes Journey next action, mission engine, and AI coach advice. Dashboard remains blocked. |
| `src/modules/dashboard/components/DashboardV4.tsx` | `DashboardV4` | Dashboard | Yes | No | No | No | No | No | `useDashboardMission()` | No | High | No | Displays next action and AI coach message from dashboard hook. Blocked as Dashboard consumer. |
| `src/modules/dashboard/components/AiRecommendationPanel.tsx` | `AiRecommendationPanel` | Dashboard | Yes | No | No | Yes | No | No | Local `generateRecommendations(completedChecks)` rule engine | Yes | High | No | Independent dashboard recommendation engine based on mission completed checks. Retirement candidate later, but not eligible for cutover here. |
| `src/modules/ai/components/WorkforceDashboard.tsx` | `useWorkforce()` | Workforce | No | Yes | No | No | No | No | `/api/v1/ai-workforce` | No | High | No | Reads available and recommended agents. Blocked as Workforce UI. |
| `src/modules/ai/components/WorkforceDashboard.tsx` | `useExecute()` | Workforce | No | Yes | Yes | No | No | No | `/api/v1/ai-workforce/execute` | No | High | No | Triggers execution requests. Not a safe read-only cutover surface. |
| `src/modules/ai/components/WorkforceDashboard.tsx` | `WorkforceDashboard` | Workforce | Yes | Yes | Yes | No | No | No | `/api/v1/ai-workforce`, `/api/v1/ai-workforce/execute`, `AGENT_REGISTRY` | Yes | High | No | Displays recommended agents, lets user choose direct agent execution, and launches multi-agent goal execution. Blocked. |
| `src/app/(auth)/ai-workforce/page.tsx` | `WorkforcePage` | Workforce | No | Yes | Yes | No | No | No | `WorkforceDashboard` | No | Low | No | Page shell only. Risk sits in `WorkforceDashboard` and workforce routes. |
| `src/app/api/v1/ai-workforce/route.ts` | `GET /api/v1/ai-workforce` | Workforce | No | Yes | No | No | Yes | No | `agentManager.getWorkforceState()` | Yes | High | No | Read-only route, but it owns assignment visibility by calling `agentManager.getWorkforceState()`. Blocked until Workforce migration wave. |
| `src/app/api/v1/ai-workforce/execute/route.ts` | `POST /api/v1/ai-workforce/execute` | Delegation | Yes | Yes | Yes | Yes | Yes | Yes | `orchestrateForGoal()`, `agentManager.executeAgent()`, `agentManager.getRecommendedAgents()`, `agentManager.executeMultiAgent()` | Yes | High | No | Runtime execution boundary. Chooses between goal+multi, direct agent, and default stage-based execution. Must remain blocked. |
| `src/modules/ai/services/agent-manager.ts` | `agentManager.getRecommendedAgents()` | Assignment | No | Yes | No | No | Yes | No | `getAgentsForMissionStage()` plus `getAgentsForPlan()` | Yes | High | No | Stage assignment filtered by plan availability. Assignment source, not a consumer cutover candidate. |
| `src/modules/ai/services/agent-manager.ts` | `agentManager.getWorkforceState()` | Assignment | No | Yes | No | No | Yes | No | `getRecommendedAgents()` | Yes | High | No | Produces available/recommended workforce state. |
| `src/modules/ai/services/agent-manager.ts` | `agentManager.executeMultiAgent()` | Delegation | Yes | Yes | Yes | Yes | Yes | Yes | Agent executors | Yes | High | No | Executes delegated agents and emits recommendations from reports. Execution remains Agent Runtime-owned. |
| `src/modules/ai/services/agent-registry.ts` | `getAgentsForMissionStage()` | Assignment | No | Yes | No | No | Yes | No | Static stage-to-agent map | Yes | High | No | Stage assignment source under ADR-021. Wrap only through adapter until cutover. |
| `src/modules/ai/services/workforce-orchestrator.ts` | `orchestrateForGoal()` | Delegation | Yes | Yes | Yes | Yes | Yes | Yes | Local goal keyword rules plus `agentManager.executeMultiAgent()` | Yes | High | No | Explicit-goal assignment and delegation source, but it also executes. Not safe for consumer cutover. |

## Category Findings

### CEO Advisor Consumers

- `GET /api/v1/business-intel` is the only bounded early candidate because it is read-only, non-dashboard, and non-runtime.
- `CEOAdvisorDashboard` must remain blocked because it is a UI consumer rendering recommendations, opportunities, assignments, delegation hints, and route CTAs.
- `ceoAdvisorEngine` is a source, not a cutover consumer.

### AI Coach Consumers

- `GET /api/v1/ai/coach/recommend` generates tactical recommendation locally.
- `AICoachCard` and `/ai/coach` consume the tactical coach route.
- `ai-coach-service` generates mission advice locally and feeds dashboard.
- ADR-020 keeps tactical next action outside AI COO strategic recommendation ownership.

### Dashboard Consumers

- `DashboardV4` consumes `useDashboardMission()`.
- `useDashboardMission()` locally combines Journey, mission, evolution, and AI Coach advice.
- `AiRecommendationPanel` generates local rule-based recommendations.
- Dashboard does choose local winners and remains blocked.

### Workforce Consumers

- `WorkforceDashboard` reads workforce state and triggers execution.
- `GET /api/v1/ai-workforce` exposes assignment state from `agentManager`.
- `POST /api/v1/ai-workforce/execute` is runtime dispatch, not AI COO planning.
- Workforce remains blocked.

### Assignment Consumers

- `getAgentsForMissionStage()` owns stage assignment mapping today.
- `agentManager.getRecommendedAgents()` owns plan-filtered stage assignment today.
- `orchestrateForGoal()` owns explicit-goal agent selection today, but also executes.
- `ceoAdvisorEngine.agentRecommendations` owns business-opportunity assignment hints today.

### Delegation Consumers

- `workforce-orchestrator` delegates by goal keywords and then executes through `agentManager.executeMultiAgent()`.
- `WorkforceDashboard` consumes delegation by triggering `/api/v1/ai-workforce/execute`.
- `CEOAdvisorDashboard` shows delegation hints through recommended agents and `/ai-workforce` CTAs.
