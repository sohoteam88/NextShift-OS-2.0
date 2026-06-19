# AI COO Conflict Report

## Conflict Summary

AI COO conflicts are already active in runtime.

They appear in four areas:

- duplicate recommendation authorities
- duplicate delegation authorities
- duplicate assignment authorities
- duplicate routing authorities

## 1. Recommendation Conflicts

### Conflict A: coach route vs coach service

Sources:

- `/api/v1/ai/coach/recommend`
- `ai-coach-service`

Conflict:

- coach route recommends from current DB metrics and operational context
- coach service recommends from mission id and task completion

Runtime winner:

- `AICoachCard` and `/ai/coach` trust the route
- `DashboardV4` trust chain uses `ai-coach-service` through `useDashboardMission()`

### Conflict B: tactical coach vs CEO advisor

Sources:

- coach route/service
- `ceoAdvisorEngine`

Conflict:

- tactical coach recommends immediate next work
- CEO Advisor recommends strategic opportunities, agents, automations, and routes

Runtime winner:

- `/ai/coach` and coach cards trust tactical coach
- `/ceo-mode` trusts CEO Advisor

### Conflict C: dashboard legacy recommendation panel vs all other coach systems

Source:

- `AiRecommendationPanel.generateRecommendations()`

Conflict:

- local rule-based onboarding/journey recommendations can differ from both tactical and strategic AI advice

Runtime winner:

- legacy panel wins inside its own rendered dashboard surface

## 2. Delegation Conflicts

### Conflict A: CEO recommended agent vs workforce orchestration

Sources:

- `ceoAdvisorEngine.agentRecommendations`
- `workforce-orchestrator.orchestrateForGoal()`

Conflict:

- CEO Advisor suggests which agent should help
- workforce orchestrator actually chooses a workflow chain

Runtime winner:

- CEO mode wins in strategic display
- workforce orchestrator wins in actual delegated execution

### Conflict B: explicit orchestration vs default stage-based execution

Sources:

- `orchestrateForGoal()`
- default branch in `/api/v1/ai-workforce/execute`

Conflict:

- one delegation strategy is goal-keyword driven
- one delegation strategy is mission-stage driven

Runtime winner:

- if request includes `goal + multi`, explicit orchestration wins
- otherwise default stage-based recommended execution wins

## 3. Assignment Conflicts

### Conflict A: stage-based assignment vs goal-based assignment

Sources:

- `agent-registry.getAgentsForMissionStage()`
- `workforce-orchestrator.orchestrateForGoal()`

Conflict:

- stage-based assignment chooses agents from journey stage
- goal-based assignment chooses agents from keyword intent

Runtime winner:

- workforce state screen trusts stage-based assignment
- multi-goal execution trusts goal-based assignment

### Conflict B: business-opportunity assignment vs workforce assignment

Sources:

- `ceoAdvisorEngine.agentRecommendations`
- `agentManager.getRecommendedAgents()`

Conflict:

- CEO mode assigns agents from bottlenecks/opportunities
- workforce state assigns agents from stage

Runtime winner:

- CEO dashboard shows business-opportunity assignment
- workforce UI shows stage-based assignment

## 4. Routing Conflicts

### Conflict A: user-facing CTA route vs execution route

Sources:

- coach route `actionHref`
- CEO Advisor `actions[].route`
- recommendation panel `route`
- workforce execution dispatch

Conflict:

- one routing system decides where the user clicks
- another routing system decides which agent code path executes

Runtime winner:

- UI surfaces trust their own CTA route hints
- workforce execution route trusts execution dispatch logic

### Conflict B: single-agent routing vs multi-agent routing

Sources:

- `agentManager.executeAgent()`
- `agentManager.executeMultiAgent()`
- `workforce-orchestrator.orchestrateForGoal()`

Conflict:

- direct single-agent execution
- direct stage-based multi-agent execution
- goal-based orchestrated multi-agent execution

Runtime winner:

- `agentId` request path wins for explicit single-agent execution
- `goal + multi` wins for explicit multi-agent orchestration
- default branch wins otherwise

## 5. Read Surface Conflict Matrix

| Surface | Recommendation Winner | Delegation Winner | Assignment Winner | Routing Winner |
| --- | --- | --- | --- | --- |
| `DashboardV4` | `ai-coach-service` | n/a | n/a | mission/dashboard CTA route |
| `AICoachCard` | coach route | n/a | n/a | coach route `actionHref` |
| `/ai/coach` | coach route | n/a | n/a | coach route `actionHref` |
| `AiRecommendationPanel` | local recommendation engine | n/a | n/a | local rule route |
| `CEOAdvisorDashboard` | `ceoAdvisorEngine` | CEO strategic delegation hints | CEO strategic assignment | CEO action route hints |
| `WorkforceDashboard` | none primary | workforce execute route | `agentManager.getWorkforceState()` | workforce execute route |
| `/api/v1/ai-workforce/execute` | none primary | orchestration or default execution branch | stage-based or goal-based assignment | execution dispatcher |

## Final Conflict Judgment

There is no single runtime conflict rule for AI COO.

The actual current rule is:

`the current surface and entrypoint decide which AI authority wins`

That means AI COO today has:

- duplicate recommendation chains
- duplicate delegation chains
- duplicate assignment chains
- duplicate routing modes
