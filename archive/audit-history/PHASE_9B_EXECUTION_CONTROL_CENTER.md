# PHASE 9B Execution Control Center

Status: Program Management

Purpose: convert the V7 Migration Blueprint and Governance Rules into a controlled execution program.

Inputs:

- `audit/V7_GLOBAL_MIGRATION_BLUEPRINT.md`
- `audit/PHASE_9A_MIGRATION_GOVERNANCE_RULES.md`

This document is execution-control only. It does not authorize implementation work outside the approved migration sequence.

## Program Control Decision

V7 migration execution may proceed only through controlled waves and classified PRs.

Approved execution chain:

```text
Blueprint
  -> Governance
  -> Wave
  -> Authority
  -> PR
  -> Audit
```

No work is valid unless it is traceable through that chain.

## Program Structure

| Phase | Authority | Status | Primary Objective | Execution Mode |
| --- | --- | --- | --- | --- |
| Phase 1 | Interview Authority | Pending | establish profile, audience, and business-context projections | contract + adapter first |
| Phase 2 | Business State | Locked Until Phase 1 Gate | establish stage, readiness, bottleneck, and opportunity projections | contract + adapter first |
| Phase 3 | Journey | Locked Until Phase 2 Gate | establish progression, milestones, missions, and next-action projections | contract + adapter first |
| Phase 4 | AI COO | Locked Until Phase 3 Gate | establish recommendation, delegation, assignment, and routing plan | contract + adapter first |
| Phase 5 | Agent Runtime | Locked Until Phase 4 Gate | wrap execution, routing, lifecycle, memory, and tool execution | wrapping only |
| Phase 6 | Growth Loop | Locked Until Phase 5 Gate | establish read-only growth projection across five growth domains | read-only adapter first |

## Authority Chain

All execution must preserve the canonical dependency chain:

```text
Interview Authority
  -> Business State
  -> Journey
  -> AI COO
  -> Agent Runtime
  -> Growth Loop
```

Downstream work may not start until its required upstream adapter surface exists, unless the PR is explicitly marked as architecture-only planning.

## Allowed Work Types

Only these PR types are allowed in migration execution:

1. Contract PR
2. Adapter PR
3. Consumer Cutover PR
4. Retirement PR
5. Authority Audit PR

### Contract PR

Purpose:

- define canonical projection shape
- define source/scope/confidence/fallback fields
- define shared terms and allowed states

Allowed:

- types
- DTOs
- interfaces
- architecture docs
- sample contract fixtures

Blocked:

- consumer cutover
- source retirement
- runtime behavior changes
- command-boundary changes

Required review:

- Architecture

### Adapter PR

Purpose:

- wrap current sources behind canonical contracts
- preserve runtime behavior
- expose source, scope, confidence, and fallback

Allowed:

- read adapters
- compatibility bridges
- dual-read diagnostics with unchanged runtime behavior
- adapter tests

Blocked:

- changing command/write ownership
- changing Agent Runtime execution behavior
- retiring legacy source
- cutting over high-risk mixed consumers

Required review:

- Architecture

### Consumer Cutover PR

Purpose:

- move approved consumers from legacy source to canonical adapter/projection

Allowed:

- bounded read-only consumer cutover
- module-specific dashboard cutover after adapter gate
- mixed consumer cutover only in approved late wave

Blocked:

- DashboardV4 first-wave cutover
- `useDashboardMission` authority expansion
- direct legacy source replacement without adapter
- Growth Loop write behavior

Required review:

- Architecture
- QA

### Retirement PR

Purpose:

- remove or archive legacy authority after runtime references reach zero

Allowed only after:

- consumer references = 0
- compatibility adapter stable
- regression checks pass
- authority audit is complete

Blocked:

- deleting active runtime references
- deleting adapters before all consumers move
- retiring domain writers that still own facts

Required review:

- Authority Audit

### Authority Audit PR

Purpose:

- verify references, consumer migration, adapter status, and retirement readiness

Allowed:

- reference scans
- authority maps
- consumer inventories
- retirement readiness reports

Blocked:

- implementation changes mixed into audit PR
- runtime behavior changes

Required review:

- Architecture
- Authority owner

## Forbidden Work Types

These are not allowed inside migration execution PRs:

- direct rewrite
- dashboard-first migration
- command-boundary changes
- execution behavior changes
- mixed-wave PRs
- Growth Loop write ownership
- Business State or Journey absorbing domain writers
- retirement without authority audit
- consumer cutover without adapter
- adapter without source/scope/confidence/fallback

## PR Classification Matrix

| PR Type | Allowed | Requires Review | May Touch Runtime Behavior | May Retire Legacy | Notes |
| --- | --- | --- | --- | --- | --- |
| Contract | Yes | Architecture | No | No | establishes shape only |
| Adapter | Yes | Architecture | No | No | must preserve current behavior |
| Consumer Cutover | Yes | Architecture + QA | Display/read behavior only | No | bounded consumers before mixed consumers |
| Retirement | Yes | Authority Audit | Removal only after zero references | Yes | must include reference audit |
| Authority Audit | Yes | Architecture + Authority Owner | No | No | evidence-only |
| Command Boundary | No | ADR Required | Yes | No | separate decision required |
| Direct Rewrite | No | Not allowed | Yes | Maybe | prohibited |
| Mixed Wave | No | Program exception required | Unknown | Unknown | prohibited by default |

## Wave Gate Rule

Wave N cannot begin until Wave N-1 passes all required gates:

- adapter audit
- consumer audit
- authority audit

This gate applies to runtime migration. Architecture-only planning may continue, but implementation PRs remain locked.

## Wave Gates

### Phase 1 Gate: Interview Authority

Phase 1 may start immediately.

Phase 1 passes when:

- `InterviewProfileSnapshot` contract exists
- `AudienceSnapshot` contract exists
- `BusinessContextSnapshot` contract exists
- `BrandInterview` and `BrandProfile` adapters exist
- legacy metadata compatibility adapter exists
- onboarding metadata side-channel is tracked
- business mode remains explicitly unresolved or has a separate authority decision
- bounded Interview consumers are audited

Blocked exits:

- business mode silently absorbed
- legacy metadata retired before zero references
- onboarding metadata treated as canonical without decision

### Phase 2 Gate: Business State

Phase 2 begins only after Phase 1 gate passes.

Phase 2 passes when:

- `BusinessState.stage` contract exists
- `BusinessState.readiness` contract exists
- `BusinessState.bottlenecks` contract exists
- `BusinessState.opportunities` contract exists
- mission, funnel, social, traffic, and CEO adapters exist
- Dashboard and Activation remain out of first cutover
- bounded Business State consumers are audited

Blocked exits:

- Business State writes domain data
- readiness proxy becomes permanent authority
- `useDashboardMission` becomes Business State resolver

### Phase 3 Gate: Journey

Phase 3 begins only after Phase 2 gate passes.

Phase 3 passes when:

- `JourneyState.progression` contract exists
- `JourneyState.milestones` contract exists
- `JourneyState.missions` contract exists
- `JourneyState.nextAction` contract exists
- `missionService` adapter exists
- `JOURNEY_MAP` milestone adapter exists
- `getNextJourneyAction()` adapter exists
- legacy mission bridge exists
- Journey page and route consumers are audited

Blocked exits:

- legacy mission chain retired before dashboard/activation/AI references are moved
- activation taxonomy absorbed without adapter
- revenue journey sidecar treated as resolved without decision

### Phase 4 Gate: AI COO

Phase 4 begins only after Phase 3 gate passes.

Phase 4 passes when:

- tactical recommendation adapter exists
- strategic recommendation adapter exists
- delegation adapter exists
- assignment adapter exists
- routing plan separates CTA routing from execution routing
- AI Coach and CEO Mode adapter consumers are audited
- Dashboard AI remains out of first cutover

Blocked exits:

- tactical and strategic recommendation merged without rule
- `AiRecommendationPanel` promoted into canonical authority
- `ai-workforce/execute` behavior changed

### Phase 5 Gate: Agent Runtime

Phase 5 begins only after Phase 4 gate passes.

Phase 5 passes when:

- `AgentRuntime.execution` contract exists
- `AgentRuntime.routing` contract exists
- `AgentRuntime.lifecycle` minimum contract exists
- `AgentRuntime.memory` adapter exists
- `AgentRuntime.toolExecution` contract exists
- `POST /api/v1/ai-workforce/execute` is wrapped without behavior change
- direct `agentId`, goal orchestration, and stage fallback behavior are verified unchanged
- workforce read consumers are audited

Blocked exits:

- execution branch precedence changed
- memory persistence replaced
- plan gating changed
- executor behavior changed

### Phase 6 Gate: Growth Loop

Phase 6 begins only after Phase 5 gate passes.

Phase 6 passes when:

- `GrowthLoop.acquisition` read contract exists
- `GrowthLoop.activation` read contract exists
- `GrowthLoop.retention` read contract exists
- `GrowthLoop.referral` read contract exists
- `GrowthLoop.expansion` read contract exists
- domain fact adapters exist
- scope is explicit for user, team, tenant, platform, and advisory signals
- bounded growth consumers are audited
- Growth Loop remains read-only

Blocked exits:

- Growth Loop writes leads, funnels, followups, invites, runtime, content, mission, franchise, or automation side-effect data
- DashboardV4 cutover happens before bounded consumers
- platform/team/franchise scope is collapsed into one global metric

## Program Board

| Item | Phase | Work Type | Status | Required Gate | Owner Role |
| --- | --- | --- | --- | --- | --- |
| P9B-001 | Global | Authority Audit | Complete when this document lands | N/A | Architecture |
| P1-001 | Interview | Contract PR | Pending | Phase 1 open | Architecture |
| P1-002 | Interview | Adapter PR | Pending | P1-001 | Architecture |
| P1-003 | Interview | Consumer Cutover PR | Pending | P1-002 + consumer audit | Architecture + QA |
| P1-004 | Interview | Authority Audit PR | Pending | P1-003 | Authority Audit |
| P2-001 | Business State | Contract PR | Locked | Phase 1 gate | Architecture |
| P2-002 | Business State | Adapter PR | Locked | P2-001 | Architecture |
| P2-003 | Business State | Consumer Cutover PR | Locked | P2-002 + consumer audit | Architecture + QA |
| P2-004 | Business State | Authority Audit PR | Locked | P2-003 | Authority Audit |
| P3-001 | Journey | Contract PR | Locked | Phase 2 gate | Architecture |
| P3-002 | Journey | Adapter PR | Locked | P3-001 | Architecture |
| P3-003 | Journey | Consumer Cutover PR | Locked | P3-002 + consumer audit | Architecture + QA |
| P3-004 | Journey | Authority Audit PR | Locked | P3-003 | Authority Audit |
| P4-001 | AI COO | Contract PR | Locked | Phase 3 gate | Architecture |
| P4-002 | AI COO | Adapter PR | Locked | P4-001 | Architecture |
| P4-003 | AI COO | Consumer Cutover PR | Locked | P4-002 + consumer audit | Architecture + QA |
| P4-004 | AI COO | Authority Audit PR | Locked | P4-003 | Authority Audit |
| P5-001 | Agent Runtime | Contract PR | Locked | Phase 4 gate | Architecture |
| P5-002 | Agent Runtime | Adapter PR | Locked | P5-001 | Architecture |
| P5-003 | Agent Runtime | Consumer Cutover PR | Locked | P5-002 + behavior verification | Architecture + QA |
| P5-004 | Agent Runtime | Authority Audit PR | Locked | P5-003 | Authority Audit |
| P6-001 | Growth Loop | Contract PR | Locked | Phase 5 gate | Architecture |
| P6-002 | Growth Loop | Adapter PR | Locked | P6-001 | Architecture |
| P6-003 | Growth Loop | Consumer Cutover PR | Locked | P6-002 + consumer audit | Architecture + QA |
| P6-004 | Growth Loop | Authority Audit PR | Locked | P6-003 | Authority Audit |

## PR Traceability Requirements

Every migration PR must include this trace:

```text
Blueprint Section:
Governance Rule:
Wave:
Authority:
Work Type:
PR ID:
Consumers Changed:
Write Paths Changed:
Legacy References Remaining:
Checks Run:
Exit Gate Impact:
```

Missing traceability blocks merge.

## PR Template

```markdown
## Migration Classification

- Blueprint section:
- Governance rule(s):
- Wave:
- Authority:
- Work type:

## Scope

- Consumers changed:
- Adapters added or consumed:
- Legacy sources touched:
- Write paths touched:

## Behavior

- Runtime behavior changed: Yes/No
- If yes, why is this not a migration PR?
- Agent Runtime execution changed: Yes/No
- Growth Loop write behavior touched: Yes/No
- DashboardV4 touched: Yes/No
- useDashboardMission touched: Yes/No

## Adapter Requirements

- source exposed:
- scope exposed:
- confidence exposed:
- fallback exposed:

## Audits

- consumer audit:
- adapter audit:
- authority audit:
- reference scan:

## Checks

- type-check:
- tests:
- build:
- manual QA:
```

## Review Control

| Change Area | Required Reviewer | Blocks Merge If Missing |
| --- | --- | --- |
| Contract shape | Architecture | Yes |
| Adapter output | Architecture | Yes |
| Consumer cutover | Architecture + QA | Yes |
| Retirement | Authority Audit | Yes |
| DashboardV4 | Architecture + QA + Authority Audit | Yes |
| `useDashboardMission` | Architecture + Authority Audit | Yes |
| Growth Loop | Architecture + Authority Audit | Yes |
| Agent Runtime execution wrapper | Architecture + QA + Authority Audit | Yes |
| Command boundary | ADR required | Yes |

## Stop Conditions

Stop the PR and reclassify if any of these occur:

- a direct rewrite appears
- DashboardV4 is first-wave target
- a command-boundary change appears
- Agent Runtime execution behavior changes
- Growth Loop writes domain facts
- Business State or Journey absorbs a domain writer
- `useDashboardMission` becomes a resolver
- consumer cutover has no adapter
- retirement has nonzero runtime references
- a PR mixes multiple waves

## Audit Requirements

### Adapter Audit

Adapter audit must confirm:

- source is labelled
- scope is labelled
- confidence is labelled
- fallback is labelled
- runtime behavior is preserved
- legacy source is documented
- retirement condition exists if adapter wraps legacy authority

### Consumer Audit

Consumer audit must confirm:

- consumers changed are listed
- old read path is listed
- new read path is listed
- fallback behavior is listed
- high-risk consumers are not moved before wave approval
- DashboardV4 and `useDashboardMission` are explicitly flagged if touched

### Authority Audit

Authority audit must confirm:

- source authority before PR
- target authority after PR
- runtime reference status
- command/write ownership status
- remaining legacy references
- retirement eligibility

## Execution Status Definitions

| Status | Meaning |
| --- | --- |
| Pending | allowed to start when its gate opens |
| Locked | cannot start because upstream gate is incomplete |
| In Progress | PR or audit work active |
| Blocked | governance or dependency issue prevents progress |
| Ready For Review | implementation complete, awaiting required reviews |
| Complete | PR merged and required audits passed |
| Retired | legacy authority removed after zero runtime references |

## Success Criteria

Every migration PR is traceable to:

```text
Blueprint
  -> Governance
  -> Wave
  -> Authority
  -> PR
```

Program success means:

- all PRs are classified
- all wave gates are enforced
- all adapters are audited
- all consumer cutovers are audited
- all retirements require authority audit
- no forbidden work type is merged
- DashboardV4 is last-wave
- Growth Loop remains read-only
- Agent Runtime adapter migration preserves execution behavior
- final authority audit confirms no unintended legacy authority remains

## Final Control Judgment

PHASE 9B establishes the execution control center for V7 migration.

Execution may begin with Phase 1 only.

All later phases remain locked until the prior phase passes adapter audit, consumer audit, and authority audit.
