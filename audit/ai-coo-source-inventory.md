# AI COO Source Inventory

Scope: current runtime sources that contribute to orchestration, delegation, assignment, recommendations, or AI decision routing.

| File Path | Source Name | Authority Role | Read Path | Write Path | Active Status | Migration Risk |
| --- | --- | --- | --- | --- | --- | --- |
| `src/modules/ai-coach/ai-coach-service.ts` | `getAICoachAdvice()` / `getNextBestAction()` | Recommendation | `useDashboardMission()`, dashboard AI coaching copy | none; read-time only | Active | High |
| `src/app/api/v1/ai/coach/recommend/route.ts` | `AI Coach Recommend Route` | Recommendation, Routing | `AICoachCard`, `/ai/coach` page | none; computes recommendation response from DB metrics | Active | High |
| `src/modules/dashboard/components/AICoachCard.tsx` | `AICoachCard recommendation stack` | Recommendation | dashboard card on `/dashboard` | none | Active | Medium |
| `src/app/(auth)/ai/coach/page.tsx` | `AI Coach Page` | Recommendation | `/ai/coach` surface | none | Active | Medium |
| `src/modules/dashboard/components/AiRecommendationPanel.tsx` | `AiRecommendationPanel.generateRecommendations()` | Recommendation, Routing | legacy dashboard recommendation panel | none; rule-based only | Active | High |
| `src/modules/business-intelligence/ceoAdvisorEngine.ts` | `ceoAdvisorEngine.generateCEOReport()` | Recommendation, Delegation, Assignment, Routing | `/api/v1/business-intel`, `CEOAdvisorDashboard` | none; read-time decision engine | Active | High |
| `src/app/api/v1/business-intel/route.ts` | `Business Intel Route` | Recommendation | `CEOAdvisorDashboard` via `/ceo-mode` | none | Active | Medium |
| `src/modules/business-intelligence/components/CEOAdvisorDashboard.tsx` | `CEOAdvisorDashboard` | Recommendation, Delegation | `/ceo-mode` executive AI surface | none | Active | Medium |
| `src/modules/ai/services/agent-registry.ts` | `AGENT_REGISTRY` / `getAgentsForMissionStage()` | Assignment, Routing | `agentManager`, `WorkforceDashboard`, `ai-workforce` routes | static registry only | Active | High |
| `src/modules/ai/services/agent-manager.ts` | `agentManager.getRecommendedAgents()` | Assignment, Routing | `/api/v1/ai-workforce`, `/api/v1/ai-workforce/execute` | none; derives agent selection | Active | High |
| `src/modules/ai/services/agent-manager.ts` | `agentManager.getWorkforceState()` | Assignment | `/api/v1/ai-workforce`, `WorkforceDashboard` | none | Active | High |
| `src/modules/ai/services/agent-manager.ts` | `agentManager.executeAgent()` | Routing | `/api/v1/ai-workforce/execute`, `executeMultiAgent()` | dispatches execution to agent executors | Active | High |
| `src/modules/ai/services/agent-manager.ts` | `agentManager.executeMultiAgent()` | Delegation, Routing | `workforce-orchestrator`, `/api/v1/ai-workforce/execute` | orchestrates multi-agent execution and recommendation aggregation | Active | High |
| `src/modules/ai/services/workforce-orchestrator.ts` | `orchestrateForGoal()` | Delegation, Assignment, Routing | `/api/v1/ai-workforce/execute` when `goal + multi` | chooses agent chain, then invokes `executeMultiAgent()` | Active | High |
| `src/app/api/v1/ai-workforce/route.ts` | `AI Workforce State Route` | Assignment | `WorkforceDashboard` | none; reads stage and plan then returns available/recommended agents | Active | Medium |
| `src/app/api/v1/ai-workforce/execute/route.ts` | `AI Workforce Execute Route` | Delegation, Assignment, Routing | `WorkforceDashboard` and any POST client | executes single-agent, multi-agent, or default recommended-agent path; writes memory via `agentMemoryService.remember()` | Active | High |
| `src/modules/ai/components/WorkforceDashboard.tsx` | `WorkforceDashboard` | Delegation, Assignment | `/ai-workforce` surface | triggers `/api/v1/ai-workforce/execute` | Active | Medium |
| `src/modules/ai/agents/brand-strategist.ts` | `executeBrandStrategist()` | Routing target | `agentManager.executeAgent()` | returns report only | Active | Low |
| `src/modules/ai/agents/content-director.ts` | `executeContentDirector()` | Routing target | `agentManager.executeAgent()` | returns report only | Active | Low |
| `src/modules/ai/agents/video-producer.ts` | `executeVideoProducer()` | Routing target | `agentManager.executeAgent()` | returns report only | Active | Low |
| `src/modules/ai/agents/funnel-architect.ts` | `executeFunnelArchitect()` | Routing target | `agentManager.executeAgent()` | returns report only | Active | Low |
| `src/modules/ai/agents/traffic-strategist.ts` | `executeTrafficStrategist()` | Routing target | `agentManager.executeAgent()` | returns report only | Active | Low |
| `src/modules/ai/agents/sales-coach.ts` | `executeSalesCoach()` | Routing target | `agentManager.executeAgent()` | returns report only | Active | Low |
| `src/modules/ai/agents/crm-manager.ts` | `executeCRMManager()` | Routing target | `agentManager.executeAgent()` | returns report only | Active | Low |
| `src/modules/ai/agents/ceo-advisor.ts` | `executeCEOAdvisor()` | Routing target | `agentManager.executeAgent()` | returns report only | Active | Low |

## Excluded From AI COO Inventory

These sources produce recommendations, but they are domain validators rather than orchestration/delegation authorities:

- `brand-intelligence` recommendation projections
- `socialSetupValidator`
- `trafficGenerators`
- `contentValidator`
- `funnel-health-service`
- `lead-magnet` recommendation generators
- `whatsappEngines`

They remain relevant downstream consumers or signal providers, but they do not currently answer the AI COO authority question:

`Who should do the work? What should be delegated? Which agent should execute?`
