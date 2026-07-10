# AI COO Precedence Report

Scope: current runtime precedence only.

Main result:

`AI COO does not have one global precedence chain today.`

Precedence is determined by projection and by surface.

## 1. Recommendations

### Primary Source

No single global primary exists.

Current surface winners are:

- dashboard coach card and `/ai/coach`: `/api/v1/ai/coach/recommend`
- dashboard mission coaching: `ai-coach-service`
- legacy dashboard recommendation panel: `AiRecommendationPanel.generateRecommendations()`
- `/ceo-mode`: `ceoAdvisorEngine.generateCEOReport()`

### Secondary Source

Secondary recommendation sources are surface-adjacent alternatives:

- `ai-coach-service` is secondary relative to the coach route on dashboard pages that render `AICoachCard`
- `ceoAdvisorEngine` is secondary relative to tactical coach surfaces when the question is “what should I do right now?”
- `AiRecommendationPanel` is secondary to both because it is a local rule engine on a legacy dashboard path

### Fallback Source

Local rule-based recommendation systems:

- `AiRecommendationPanel.generateRecommendations()`
- tactical coach copy from `ai-coach-service`

These survive because they do not need strategic AI planning or workforce state.

### Conflict Rule

Current runtime rule is:

- each recommendation surface trusts its own source
- tactical coach surfaces do not defer to CEO mode
- CEO mode does not defer to tactical coach route
- legacy dashboard recommendation panel does not defer to either

So if recommendation authorities disagree, the winner is whichever recommendation source the page already calls.

## 2. Delegations

### Primary Source

`workforce-orchestrator.orchestrateForGoal()`

Why:

- it is the strongest explicit goal-to-agent delegation path
- it chooses a multi-agent chain from the requested objective

### Secondary Source

`ceoAdvisorEngine`

Why:

- it recommends which agent should be involved
- it does not actually execute the delegation plan

### Fallback Source

Default stage-based execution branch in `/api/v1/ai-workforce/execute`

- `agentManager.getRecommendedAgents()`
- `recommended.slice(0, 2)`
- `agentManager.executeMultiAgent()`

Why:

- it still produces delegated work even when no explicit goal-based orchestration is requested

### Conflict Rule

Current delegation precedence is:

1. explicit goal-based orchestration
2. default stage-based recommended execution
3. CEO strategic recommendation as advisory input only

That means CEO Advisor does not win execution delegation. It only suggests.

## 3. Assignments

### Primary Source

`agentManager.getRecommendedAgents()` + `agent-registry.getAgentsForMissionStage()`

Why:

- this is the main runtime assignment path exposed by `/api/v1/ai-workforce`
- it powers recommended agents in workforce state

### Secondary Source

`workforce-orchestrator.orchestrateForGoal()`

Why:

- it assigns agents from goal keyword categories rather than mission stage

### Fallback Source

`ceoAdvisorEngine.agentRecommendations`

Why:

- it still assigns agent names from opportunity/bottleneck analysis
- but it does not own workforce state or execution dispatch

### Conflict Rule

Assignment precedence depends on the entry path:

- workforce state screen trusts stage-based assignment
- multi-goal execution trusts keyword-goal assignment
- CEO mode trusts business-opportunity assignment

So assignment precedence is not system-wide. It is entrypoint-specific.

## 4. Routing

### Primary Source

Two routing primaries exist, depending on routing type:

- execution routing: `agentManager.executeAgent()` / `executeMultiAgent()`
- user-facing CTA routing: surface-level route hints from coach route, CEO Advisor, or recommendation panel

### Secondary Source

`workforce-orchestrator.orchestrateForGoal()`

Why:

- it chooses multi-agent execution routing before handing off to `executeMultiAgent()`

### Fallback Source

Static route hints:

- `/api/v1/ai/coach/recommend` action hrefs
- `AiRecommendationPanel` local routes
- `ceoAdvisorEngine.actions[].route`

### Conflict Rule

Current runtime routing precedence is split:

1. execution route handlers decide execution dispatch
2. product surfaces decide CTA route hints

There is no cross-surface reconciliation between:

- “which product route should the user open?”
- “which agent execution path should the system run?”

## Strongest Current COO Chain

The strongest current AI COO-like execution chain is:

`agent-registry -> agentManager.getRecommendedAgents() / executeAgent() / executeMultiAgent() -> workforce-orchestrator -> /api/v1/ai-workforce/execute -> WorkforceDashboard`

This is the cleanest current path for:

- assignment
- delegation
- execution routing

The strongest strategic recommendation chain is:

`ceoAdvisorEngine -> /api/v1/business-intel -> CEOAdvisorDashboard`

The strongest tactical recommendation chain is:

`/api/v1/ai/coach/recommend -> AICoachCard / /ai/coach`

## Final Precedence Judgment

By projection:

| Projection | Effective Winner |
| --- | --- |
| Recommendation | surface-based: coach route, coach service, CEO Advisor, and legacy recommendation panel each win on their own surfaces |
| Delegation | `orchestrateForGoal()` for explicit multi-goal execution; stage-based default branch otherwise |
| Assignment | `agentManager.getRecommendedAgents()` on workforce state, `orchestrateForGoal()` on multi-goal execution, `ceoAdvisorEngine` on CEO mode |
| Routing | execution routing belongs to workforce runtime; CTA routing belongs to each recommendation surface |

So the current runtime answer is:

`precedence is surface-based and entrypoint-based, not system-based`
