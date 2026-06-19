# ADR-020 Tactical vs Strategic Recommendation Rule Review

Status: Approved With Conditions

Category: Authority Decision

Architecture Review Board Item: `ARB-005`

Affected layers:

- Journey
- AI COO
- Growth Loop

Affected consumers:

- AI Coach
- CEO Advisor
- DashboardV4
- AiRecommendationPanel
- Workforce
- Growth Loop
- Funnel Health
- CRM Advisor

Reviewed input:

- `/Users/stevenmacmini/Desktop/ADR-020 Tactical vs Strategic Recommendation Rule/ADR-020 Tactical vs Strategic Recommendation Rule.md`

Related evidence:

- `audit/ai-coo-migration-readiness-review.md`
- `audit/ai-coo-conflict-report.md`
- `audit/ai-coo-read-write-authority-map.md`
- `audit/ai-coo-consumer-risk-report.md`
- `audit/journey-authority-migration-readiness-review.md`
- `audit/growth-loop-conflict-report.md`
- `audit/growth-loop-migration-readiness-review.md`
- `audit/PHASE_9A_MIGRATION_GOVERNANCE_RULES.md`
- `audit/PHASE_9C_ARCHITECTURE_REVIEW_BOARD.md`

Runtime evidence checked:

- `src/modules/journey/utils/getNextJourneyAction.ts`
- `src/app/api/v1/ai/coach/recommend/route.ts`
- `src/modules/dashboard/components/AICoachCard.tsx`
- `src/modules/dashboard/components/AiRecommendationPanel.tsx`
- `src/modules/dashboard/hooks/useDashboardMission.ts`
- `src/modules/business-intelligence/ceoAdvisorEngine.ts`
- `src/app/api/v1/business-intel/route.ts`

## Review Verdict

`APPROVE AS AUTHORITY DECISION, WITH TERMINOLOGY AND IMPLEMENTATION CONDITIONS`

ADR-020 correctly resolves the tactical vs strategic recommendation authority split:

```text
Tactical Recommendation is owned by Journey Authority.
Canonical source: JourneyState.nextAction.

Strategic Recommendation is owned by AI COO.
Canonical source: COOPlan.recommendations.
```

This is the correct direction because current runtime recommendations are fragmented across tactical coach routes, CEO Advisor, local dashboard rules, funnel health, CRM/WhatsApp engines, growth roadmap, and other sidecar systems.

## Architecture Review Outcome

Outcome:

`Approve With Conditions`

Meaning:

- migration planning may separate tactical next action from strategic recommendation
- AI Coach must become a tactical next-action consumer
- CEO Advisor must become a strategic recommendation consumer
- DashboardV4 must display tactical and strategic outputs separately
- Growth Loop may expose recommendation inputs only
- `AiRecommendationPanel` remains a retirement candidate
- implementation cannot begin until follow-up contract and adapter PRs land

## Decision

Approved authority split:

```text
JourneyState.nextAction
  owns Tactical Recommendation

COOPlan.recommendations
  owns Strategic Recommendation
```

Canonical questions:

```text
Tactical: What should I do next?
Strategic: What should the business focus on?
```

Precedence rule:

```text
Strategic wins planning.
Tactical wins immediate user-facing next action.
```

## Required Terminology Clarification

ADR-020 says:

```text
Tactical wins execution.
```

This is approved only with a narrowed interpretation.

Approved meaning:

```text
Tactical wins the immediate user-facing CTA / next step.
```

Not approved meaning:

```text
Tactical owns Agent Runtime execution dispatch.
```

Agent Runtime execution remains governed by Agent Runtime and AI COO execution-plan adapters. ADR-020 does not authorize changes to `/api/v1/ai-workforce/execute`, agent selection, execution branch precedence, plan gating, or executor behavior.

## Current Runtime Authority

Current recommendation authority is fragmented.

Evidence:

- AI Coach route emits tactical `actionHref` and operational next work.
- `ai-coach-service` and `useDashboardMission()` provide a separate dashboard coach path.
- `AiRecommendationPanel.generateRecommendations()` is a local dashboard recommendation engine.
- `ceoAdvisorEngine` emits business-level actions, agent recommendations, automation recommendations, and strategic opportunities.
- funnel health, CRM engines, WhatsApp engines, revenue activation, and growth roadmap can all generate adjacent next-action guidance.
- AI COO conflict report confirms there is no single runtime conflict rule; the active surface decides the winner.

Current runtime state:

```text
NO CANONICAL TACTICAL VS STRATEGIC RECOMMENDATION RULE
```

## Target Authority

### Tactical Recommendation

Owner:

```text
Journey Authority
```

Source:

```text
JourneyState.nextAction
```

Purpose:

```text
Immediate user-facing next step.
```

Characteristics:

- immediate
- actionable
- single step
- route/CTA oriented
- user-facing

Examples:

- post content
- follow up lead
- publish funnel
- configure WhatsApp

### Strategic Recommendation

Owner:

```text
AI COO
```

Source:

```text
COOPlan.recommendations
```

Purpose:

```text
Business-level focus and resource allocation.
```

Characteristics:

- cross-domain
- multi-step
- business-level
- planning-oriented
- delegation/assignment-aware

Examples:

- improve CRM
- build recruitment funnel
- increase lead flow
- automate followup

### Growth Loop Role

Growth Loop owns:

```text
recommendation inputs
```

Growth Loop does not own:

```text
final tactical or strategic recommendation
```

Growth Loop may expose facts, readiness, trend, and signal inputs that Journey and AI COO consume through adapters.

## Alternatives Review

### Alternative A: CEO Advisor Owns All Recommendations

Decision:

`Rejected`

Reason:

CEO Advisor is strategic. It can guide business focus, but it should not own immediate Journey next action.

### Alternative B: AI Coach Owns All Recommendations

Decision:

`Rejected`

Reason:

AI Coach is tactical. It can guide next user action, but it should not own business-wide planning.

### Alternative C: Growth Loop Owns Recommendations

Decision:

`Rejected`

Reason:

Growth Loop is read-only and signal-oriented. It may provide recommendation inputs, but cannot own final recommendations.

### Alternative D: Dashboard Chooses Recommendation Winner

Decision:

`Rejected`

Reason:

Dashboard is a consumer, not an authority. DashboardV4 is explicitly last-wave and must display tactical and strategic recommendations separately.

## Migration Impact Assessment

Impact:

`Cross-Layer`

Affected waves:

- Phase 3 Journey
- Phase 4 AI COO
- Phase 6 Growth Loop
- late-wave DashboardV4 cutover

Affected PR types:

- Contract PR
- Adapter PR
- Consumer Cutover PR
- Authority Audit PR
- later Retirement PR

Command-boundary impact:

`None for this ADR`

Reason:

Recommendations are read-time projections. ADR-020 does not authorize command writes or Agent Runtime execution behavior changes.

High-risk consumer impact:

`Yes`

Affected high-risk consumers:

- DashboardV4
- `useDashboardMission`
- `AiRecommendationPanel`
- CEOAdvisorDashboard
- AICoachCard
- `/ai/coach`
- WorkforceDashboard
- `/api/v1/ai-workforce/execute` if execution routing is touched

## Consumer Rules

### AI Coach

Target rule:

```text
AI Coach consumes JourneyState.nextAction.
```

AI Coach may present tactical guidance. It may not own strategic recommendations.

### CEO Advisor

Target rule:

```text
CEO Advisor consumes COOPlan.recommendations.
```

CEO Advisor may present strategic guidance. It may not own immediate Journey nextAction.

### DashboardV4

Target rule:

```text
DashboardV4 displays Strategic Recommendation and Tactical Next Action separately.
```

Blocked:

- merging them into one recommendation
- choosing a winner locally
- first-wave DashboardV4 cutover

### AiRecommendationPanel

Target rule:

```text
AiRecommendationPanel is a retirement candidate.
```

It should not be promoted into a canonical recommendation authority.

### Workforce

Target rule:

```text
Workforce consumes AI COO assignment/delegation/execution plan.
```

ADR-020 does not change Agent Runtime execution dispatch.

### Growth Loop

Target rule:

```text
Growth Loop exposes recommendation inputs only.
```

Growth Loop cannot own tactical or strategic recommendation winner.

## Write / Command Impact

Approved:

```text
Recommendation is projection-only.
```

Not approved:

- new recommendation persistence writer
- Agent Runtime execution behavior changes
- `/api/v1/ai-workforce/execute` branch changes
- Growth Loop recommendation writer
- Dashboard recommendation authority

AI COO read/write authority audit confirms recommendation authority is currently a read-time issue, not a persistence-write issue.

## Retirement Impact

Retirement candidates after migration:

- `AiRecommendationPanel`
- dashboard local recommendation rules
- funnel local recommendation rules
- duplicated tactical/strategic CTA route generation
- recommendation-only logic that claims canonical next action without consuming Journey or AI COO projections

Not approved for retirement yet:

- `AiRecommendationPanel`
- `ai-coach-service`
- AI coach route
- `ceoAdvisorEngine`
- funnel health recommendations
- CRM/WhatsApp recommendation engines

Retirement requires:

- adapter stability
- consumer migration
- zero runtime references where applicable
- authority audit
- regression checks

## Required Follow-Up PRs

### P3-003: Journey Tactical Adapter

Create:

```text
JourneyState.nextAction
```

Required:

- source/scope/confidence/fallback
- route/CTA semantics
- immediate next-step semantics
- no strategic business planning responsibility
- no DashboardV4 cutover

### P4-002: AI COO Recommendation Adapter

Create:

```text
COOPlan.recommendations
```

Required:

- strategic recommendation shape
- tactical-vs-strategic distinction
- route/action distinction
- CEO Advisor as strategic source adapter
- no Agent Runtime execution behavior change

### P4-003: AI Coach Tactical Consumer Adapter

Move tactical coach consumers toward:

```text
JourneyState.nextAction
```

Required:

- preserve current tactical coach user experience during transition
- do not let AI Coach become strategic authority

### P4-004: CEO Advisor Strategic Consumer Adapter

Move CEO surfaces toward:

```text
COOPlan.recommendations
```

Required:

- preserve strategic recommendations
- do not let CEO Advisor own tactical nextAction

### Late-Wave Dashboard Recommendation Split

Display:

```text
Strategic Recommendation
Tactical Next Action
```

separately.

Required:

- no local merge
- no local winner selection
- DashboardV4 remains late-wave

### Retirement Audit: Local Recommendation Rules

Audit:

- `AiRecommendationPanel`
- dashboard local recommendation rules
- funnel local recommendation rules

Required:

- classify runtime references
- identify replacement authority
- retire only after zero-reference authority audit

## Approval Conditions

ADR-020 is approved with these conditions:

1. `JourneyState.nextAction` must exist before tactical recommendation consumer cutover.
2. `COOPlan.recommendations` must exist before strategic recommendation consumer cutover.
3. DashboardV4 must display tactical and strategic outputs separately.
4. DashboardV4 cannot be an early-wave migration target.
5. `AiRecommendationPanel` must remain a retirement candidate, not a canonical authority.
6. Growth Loop may expose recommendation inputs only.
7. Agent Runtime execution behavior cannot change under this ADR.
8. "Tactical wins execution" means immediate user-facing next action only, not Agent Runtime dispatch.
9. Adapter outputs must expose `source`, `scope`, `confidence`, and `fallback`.
10. Retirement requires authority audit and zero runtime references.

## Governance Checks

| Rule | Result | Notes |
| --- | --- | --- |
| Rule 1: No layer bypasses upstream authority | PASS | Tactical maps to Journey; strategic maps to AI COO. |
| Rule 2: No consumer cutover before adapter exists | PASS WITH CONDITION | P3-003 and P4-002 must land first. |
| Rule 4: DashboardV4 last-wave migration | PASS | Dashboard may display both later, not choose early. |
| Rule 5: `useDashboardMission` consumer only | PASS | It must not own recommendation precedence. |
| Rule 6: Growth Loop read-only | PASS | Growth Loop owns inputs only. |
| Rule 7: Agent Runtime behavior unchanged | PASS WITH CONDITION | "execution" language is narrowed to CTA/nextAction only. |
| Rule 9: Adapter source/scope/confidence/fallback | PASS WITH CONDITION | Must be enforced in adapters. |
| Rule 10: Retirement requires Authority Audit | PASS | Retirement is not approved here. |

## Board Outcome

ARB-005 status:

```text
Approved With Conditions
```

Decision:

```text
Tactical Recommendation is owned by Journey Authority.
Strategic Recommendation is owned by AI COO.
```

Canonical sources:

```text
JourneyState.nextAction
COOPlan.recommendations
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

ADR-020 resolves the tactical vs strategic recommendation rule at the architecture level.

It does not authorize direct implementation, DashboardV4 cutover, local recommendation retirement, Growth Loop recommendation ownership, or Agent Runtime execution changes.

The next valid actions are P3-003 Journey Tactical Adapter and P4-002 AI COO Recommendation Adapter.
