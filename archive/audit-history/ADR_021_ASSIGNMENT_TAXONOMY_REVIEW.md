# ADR-021 Assignment Taxonomy Review

Status: Approved With Conditions

Category: Authority Decision

Architecture Review Board Item: `ARB-004`

Affected layers:

- AI COO
- Agent Runtime
- Journey

Reviewed input:

- `/Users/stevenmacmini/Desktop/ADR-021_ASSIGNMENT_TAXONOMY.md/ADR-021_ASSIGNMENT_TAXONOMY.md.md`

Related evidence:

- `audit/ai-coo-migration-readiness-review.md`
- `audit/ai-coo-conflict-report.md`
- `audit/ai-coo-read-write-authority-map.md`
- `audit/agent-runtime-migration-readiness-review.md`
- `audit/agent-runtime-conflict-report.md`
- `audit/agent-runtime-read-write-authority-map.md`
- `audit/PHASE_9A_MIGRATION_GOVERNANCE_RULES.md`
- `audit/PHASE_9C_ARCHITECTURE_REVIEW_BOARD.md`

Runtime evidence checked:

- `src/modules/ai/services/agent-registry.ts`
- `src/modules/ai/services/agent-manager.ts`
- `src/modules/ai/services/workforce-orchestrator.ts`
- `src/app/api/v1/ai-workforce/execute/route.ts`
- `src/modules/ai/components/WorkforceDashboard.tsx`

## Review Verdict

`APPROVE AS AUTHORITY DECISION, WITH EXECUTION-SEPARATION CONDITIONS`

ADR-021 correctly identifies the active unresolved assignment problem:

```text
Who decides which agent should do the work?
```

The current runtime has three assignment sources:

- Stage Assignment
- Goal Assignment
- Opportunity Assignment

The approved decision is:

```text
AI COO owns canonical assignment taxonomy and assignment plan.
Agent Runtime owns execution dispatch of the selected plan.
```

Stage, goal, and opportunity become assignment bases inside one taxonomy. They must not remain independent competing authorities.

## Architecture Review Outcome

Outcome:

`Approve With Conditions`

Meaning:

- migration planning may define a canonical `COOAssignment` contract
- AI COO owns assignment decision semantics
- Agent Runtime consumes assignment plans and executes them
- current Agent Runtime execution branch behavior must remain unchanged during adapter migration
- no execution behavior change is approved by this ADR

## Current Runtime Authority

Current assignment authority is fragmented.

Evidence:

- `getAgentsForMissionStage()` maps Journey stage to agent IDs.
- `agentManager.getRecommendedAgents()` filters stage-based agents by plan availability.
- `workforce-orchestrator.orchestrateForGoal()` maps explicit goal keywords to agent chains.
- `ceoAdvisorEngine.agentRecommendations` creates business-opportunity assignment suggestions.
- `WorkforceDashboard` displays stage/plan-derived workforce recommendations.
- `/api/v1/ai-workforce/execute` chooses execution branch by request shape:
  - `goal && multi`
  - `agentId`
  - default stage-based recommendation

Current runtime state:

```text
NO CANONICAL ASSIGNMENT TAXONOMY
```

The current winner is surface-local or request-shape-local.

## Target Authority

Canonical authority:

```text
AI COO
```

Canonical contract:

```ts
type AssignmentBasis =
  | "journey_stage"
  | "explicit_goal"
  | "business_opportunity";

interface COOAssignment {
  basis: AssignmentBasis;
  source: string;
  scope: "user" | "tenant" | "team" | "platform";
  confidence: "confirmed" | "derived" | "inferred" | "fallback";
  fallback: string | "none";
  objective: string;
  recommendedAgents: AgentId[];
  reasoning: string[];
  executionMode: "single_agent" | "multi_agent" | "advisory_only";
}
```

Required owner boundary:

```text
AI COO decides the assignment plan.
Agent Runtime executes the selected assignment plan.
```

## Assignment Taxonomy

### 1. Stage Assignment

Basis:

```text
journey_stage
```

Source examples:

- `JourneyState.progression`
- `currentStageId`
- `getAgentsForMissionStage()`
- `agentManager.getRecommendedAgents()`

Question answered:

```text
Which agents fit the user's current Journey stage?
```

Role:

- default assignment basis
- onboarding/progression-aware
- useful for workforce state and default recommendations

Restriction:

Stage assignment must not override an explicit user goal or approved strategic opportunity in contexts where those are active.

### 2. Goal Assignment

Basis:

```text
explicit_goal
```

Source examples:

- user-entered goal
- `workforce-orchestrator.orchestrateForGoal()`
- `goal + multi` execution request

Question answered:

```text
Which agents fit this explicit user objective?
```

Role:

- execution-intent assignment
- user-objective-first
- can cross Journey stage when the user explicitly asks for a different goal

Restriction:

Goal assignment may inform Agent Runtime execution, but it must be wrapped through the COO assignment contract before canonical consumer cutover.

### 3. Opportunity Assignment

Basis:

```text
business_opportunity
```

Source examples:

- `COOPlan.recommendations`
- `ceoAdvisorEngine.agentRecommendations`
- business bottlenecks
- strategic growth opportunities

Question answered:

```text
Which agents should support the most important business opportunity?
```

Role:

- strategic planning assignment
- CEO/COO surface assignment
- multi-step and business-level

Restriction:

Opportunity assignment is planning authority. It does not directly change Agent Runtime execution dispatch without an execution plan adapter.

## Context Precedence Rule

The canonical taxonomy does not choose one assignment basis globally.

It chooses by context:

| Context | Assignment Basis Winner | Reason |
| --- | --- | --- |
| explicit user execution goal | `explicit_goal` | user has declared the objective |
| strategic planning / CEO / COO surface | `business_opportunity` | planning is driven by business priority |
| default workforce recommendation | `journey_stage` | no explicit goal or opportunity has been selected |
| fallback with missing context | `journey_stage` or first available plan-safe agent | safest existing runtime fallback |

This replaces the current implicit request-shape and surface-local behavior with one explicit taxonomy.

## Authority Boundary

### AI COO Owns

- assignment taxonomy
- assignment basis selection
- assignment reasoning
- recommended agent set
- strategic vs tactical assignment context
- assignment plan consumed by workforce surfaces

### Agent Runtime Owns

- execution request handling
- executor dispatch
- runtime branch preservation during adapter migration
- execution results
- memory/report persistence through current adapter
- tool execution output

### Journey Owns

- Journey progression and stage context used by stage assignment

### Growth Loop Does Not Own

- agent assignment
- execution dispatch
- final recommendation winner

Growth Loop may expose signals that AI COO uses as assignment inputs.

## Alternatives Review

### Alternative A: Stage Assignment Wins Globally

Decision:

`Rejected`

Reason:

Stage assignment is a good default but fails when a user gives an explicit goal or when a strategic opportunity requires a different agent chain.

### Alternative B: Goal Assignment Wins Globally

Decision:

`Rejected`

Reason:

Goal assignment captures explicit execution intent but does not provide stable workforce planning or strategic opportunity assignment.

### Alternative C: Opportunity Assignment Wins Globally

Decision:

`Rejected`

Reason:

Opportunity assignment is strategic and planning-oriented. It should not override explicit user execution intent.

### Alternative D: Agent Runtime Owns Assignment

Decision:

`Rejected`

Reason:

Agent Runtime should execute assignment plans. If it also owns assignment reasoning, execution dispatch remains the authority, preserving the current branch-order problem.

### Alternative E: Dashboard Owns Assignment

Decision:

`Rejected`

Reason:

Dashboard is a consumer and is explicitly last-wave. It may display assignments but must not choose assignment authority.

## Migration Impact Assessment

Impact:

`Cross-Layer`

Affected waves:

- Phase 3 Journey
- Phase 4 AI COO
- Phase 5 Agent Runtime
- late-wave Dashboard/Workforce consumer cutover

Affected PR types:

- Contract PR
- Adapter PR
- Consumer Cutover PR
- Authority Audit PR
- possible later Command Boundary ADR if execution behavior changes

Command-boundary impact:

`Potential`

Reason:

This ADR defines assignment planning ownership. It does not approve changes to Agent Runtime execution dispatch. If later work changes `/api/v1/ai-workforce/execute` branch precedence, plan gates, direct `agentId` behavior, or executor selection, that requires a separate command-boundary decision.

High-risk consumer impact:

- WorkforceDashboard
- `/api/v1/ai-workforce`
- `/api/v1/ai-workforce/execute`
- CEOAdvisorDashboard
- DashboardV4
- `useDashboardMission`

## Consumer Impact

### WorkforceDashboard

Target:

```text
Consume COOAssignment for assignment display.
```

Condition:

Must preserve current request-shape behavior during adapter migration.

### `/api/v1/ai-workforce`

Target:

```text
Expose assignment/lifecycle state through Agent Runtime adapter.
```

Condition:

May consume COOAssignment once Agent Runtime read adapter exists.

### `/api/v1/ai-workforce/execute`

Target:

```text
Eventually consumes AI COO execution plan.
```

Condition:

No behavior change under this ADR. Branch order remains unchanged during adapter migration.

### CEOAdvisorDashboard

Target:

```text
Consumes opportunity assignments as strategic assignment display.
```

Condition:

CEO Advisor does not become final assignment authority.

## Write / Command Impact

Approved:

```text
Assignment taxonomy is read/planning authority.
```

Not approved:

- execution branch changes
- plan-gating changes
- direct `agentId` behavior changes
- orchestrator keyword behavior changes
- new persistent assignment writer
- Agent Runtime lifecycle changes

AI COO assignment may be represented as a projection/plan. It is not yet a durable write model unless a later PR defines one.

## Retirement Impact

Retirement candidates after migration:

- stage-based assignment as independent authority
- goal keyword assignment as independent authority
- CEO opportunity assignment as independent authority
- entrypoint-specific assignment fallbacks
- duplicate assignment display paths

Not approved for retirement yet:

- `getAgentsForMissionStage()`
- `agentManager.getRecommendedAgents()`
- `workforce-orchestrator.orchestrateForGoal()`
- `ceoAdvisorEngine.agentRecommendations`
- `/api/v1/ai-workforce/execute` branch logic

Retirement requires:

- adapter stability
- consumer migration
- zero runtime references where applicable
- authority audit
- behavior verification

## Required Follow-Up PRs

### P4-004: AI COO Assignment Contract

Create:

```text
COOAssignment
```

Required:

- assignment basis
- source
- scope
- confidence
- fallback
- recommended agents
- reasoning
- execution mode
- no execution behavior change

### P4-005: Assignment Source Adapters

Wrap:

- Journey stage assignment
- explicit goal assignment
- business opportunity assignment

Required:

- preserve current source behavior
- identify source and confidence
- classify context precedence

### P5-002A: Agent Runtime Assignment Consumer Adapter

Allow Agent Runtime read surfaces to consume:

```text
COOAssignment
```

Required:

- no `/api/v1/ai-workforce/execute` branch change
- no plan-gating change
- no executor behavior change

### P5-003A: Execution Behavior Audit

Audit:

- `goal + multi`
- direct `agentId`
- default stage-based execution
- plan availability checks
- orchestrator keyword chains

Required:

- confirm behavior before any command-boundary proposal

### Late-Wave Workforce Consumer Cutover

Cut over:

- WorkforceDashboard assignment display
- CEOAdvisorDashboard assignment display
- Dashboard assignment display if present

Required:

- after COOAssignment contract and adapters are stable
- no direct runtime branch changes

## Approval Conditions

ADR-021 is approved with these conditions:

1. AI COO owns canonical assignment taxonomy.
2. Agent Runtime owns execution dispatch, not assignment reasoning.
3. Stage, goal, and opportunity are assignment bases under one `COOAssignment` contract.
4. Context precedence must be explicit.
5. Adapter output must expose `source`, `scope`, `confidence`, and `fallback`.
6. `/api/v1/ai-workforce/execute` behavior cannot change under this ADR.
7. Plan-gating behavior cannot change under this ADR.
8. Direct `agentId` behavior cannot change under this ADR.
9. Dashboard and Workforce consumers cannot become assignment authorities.
10. Retirement requires authority audit and behavior verification.

## Governance Checks

| Rule | Result | Notes |
| --- | --- | --- |
| Rule 1: No layer bypasses upstream authority | PASS | Agent Runtime consumes AI COO assignment plan once adapter exists. |
| Rule 2: No consumer cutover before adapter exists | PASS WITH CONDITION | COOAssignment must land before consumer cutover. |
| Rule 4: DashboardV4 last-wave migration | PASS | Dashboard cannot own assignment. |
| Rule 5: `useDashboardMission` consumer only | PASS | It must not resolve agent assignment. |
| Rule 7: Agent Runtime behavior unchanged | PASS WITH CONDITION | Execution branch behavior must remain unchanged. |
| Rule 9: Adapter source/scope/confidence/fallback | PASS WITH CONDITION | Required on assignment adapters. |
| Rule 10: Retirement requires Authority Audit | PASS | Retirement is not approved here. |

## Board Outcome

ARB-004 status:

```text
Approved With Conditions
```

Decision:

```text
AI COO owns canonical assignment taxonomy.
Agent Runtime owns execution dispatch.
```

Canonical source:

```text
COOAssignment
```

Canonical assignment bases:

```text
journey_stage
explicit_goal
business_opportunity
```

Migration impact:

```text
Cross-Layer
```

Implementation readiness:

```text
NOT READY UNTIL FOLLOW-UP CONTRACT AND ADAPTER PRs LAND
```

## Final Architecture Judgment

ADR-021 resolves assignment taxonomy at the architecture level.

It does not authorize direct implementation, Agent Runtime execution branch changes, plan-gating changes, direct-agent behavior changes, or retirement of current assignment helpers.

The next valid action is P4-004 AI COO Assignment Contract, followed by assignment source adapters and Agent Runtime consumer adapters.
