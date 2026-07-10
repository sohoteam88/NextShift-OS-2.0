# PHASE 9C Architecture Review Board

Status: Architecture Governance

Purpose: establish the central decision authority for V7 migration.

All unresolved architecture decisions must be reviewed here before they can affect migration execution.

Inputs:

- `audit/V7_GLOBAL_MIGRATION_BLUEPRINT.md`
- `audit/PHASE_9A_MIGRATION_GOVERNANCE_RULES.md`
- `audit/PHASE_9B_EXECUTION_CONTROL_CENTER.md`
- completed Phase 8A readiness reviews

## Review Board Decision

V7 migration now has a central Architecture Review Board.

The board owns decisions that cannot be resolved inside normal migration PRs:

- authority decisions
- command boundary decisions
- retirement decisions
- wave exception decisions
- unresolved ownership decisions

No implementation PR may resolve these implicitly.

## Board Mandate

The Architecture Review Board exists to prevent migration drift.

It decides:

- which source is canonical
- which source is transitional
- which source must stay domain-owned
- which source may be retired
- when command boundaries may change
- whether an unresolved blocker is approved, rejected, or deferred

It does not:

- implement code
- perform consumer cutover
- bypass governance rules
- approve direct rewrites
- approve DashboardV4-first migration

## Decision Categories

### 1. Authority Decisions

Authority decisions answer:

```text
Who owns this truth?
```

Examples:

- Business Mode Authority
- Revenue Journey Ownership
- Growth Resolver
- Assignment Taxonomy
- Tactical vs Strategic Recommendation Rule
- Business State Opportunity Collapse Rule
- Growth Loop Scope Resolver

Required output:

- ADR record
- target authority
- upstream dependencies
- downstream consumers
- migration-impact assessment

### 2. Command Boundary Decisions

Command boundary decisions answer:

```text
Who is allowed to write or execute this?
```

Examples:

- Followup ownership
- Invite consumption ownership
- Runtime execution ownership
- Automation lead/activity side effects
- Mission progress writes
- BrandProfile writes
- Franchise metadata writes

Required output:

- ADR record
- current writer
- proposed writer or preserved writer
- behavior-change assessment
- rollback/restore path
- migration-impact assessment

### 3. Retirement Decisions

Retirement decisions answer:

```text
Can this legacy authority be removed?
```

Examples:

- `missionEngineService`
- `missionStages.ts`
- `AiRecommendationPanel`
- `metadata.brand_profile`
- legacy `/api/mission/*`
- metadata-backed agent memory
- duplicate dashboard recommendation rules

Required output:

- ADR record or retirement outcome
- reference audit
- consumer migration evidence
- adapter status
- checks run
- migration-impact assessment

### 4. Wave Exception Decisions

Wave exception decisions answer:

```text
May this work happen outside the normal wave order?
```

Examples:

- cross-wave adapter dependency
- urgent compatibility bridge
- architecture-only planning ahead of implementation wave
- audit-only PR for locked wave

Required output:

- exception reason
- affected wave
- affected authority
- runtime behavior impact
- approval or rejection

### 5. Governance Violation Decisions

Governance violation decisions answer:

```text
Did this PR violate migration law, and what happens next?
```

Examples:

- consumer cutover without adapter
- adapter missing source/scope/confidence/fallback
- Growth Loop write attempt
- Agent Runtime behavior change inside adapter PR
- DashboardV4 first-wave migration
- `useDashboardMission` authority expansion

Required output:

- violation classification
- blocked PR scope
- required reclassification
- migration-impact assessment

## Decision Status

| Status | Meaning | Migration Effect |
| --- | --- | --- |
| Proposed | decision request filed but not reviewed | no implementation allowed |
| Under Review | board is actively reviewing evidence | implementation remains blocked |
| Approved | decision accepted with documented outcome | implementation may proceed inside approved scope |
| Rejected | decision denied | implementation must not proceed |
| Deferred | decision intentionally postponed | dependent work remains blocked or must use transitional adapter |

## Required Decision Record

Every board decision must create an ADR-style record.

Minimum record shape:

```markdown
# ADR-XXX: <Decision Title>

Status: Proposed | Under Review | Approved | Rejected | Deferred

Date:

Category:

Affected Layer:

Affected Authority:

## Context

## Decision

## Current Runtime Authority

## Target Authority

## Alternatives Considered

## Migration Impact

## Consumer Impact

## Write/Command Impact

## Retirement Impact

## Required Follow-Up PRs

## Governance Checks

## Final Outcome
```

## Decision Intake Process

1. Identify unresolved architecture decision.
2. Classify category:
   - Authority Decision
   - Command Boundary Decision
   - Retirement Decision
   - Wave Exception Decision
   - Governance Violation Decision
3. Create ADR draft with evidence.
4. Link related audit artifacts.
5. Review against Phase 9A governance rules.
6. Review against Phase 9B execution control gates.
7. Assign status.
8. Publish outcome.
9. Update migration wave or PR scope.

## Required Evidence

Every decision request must include:

- source authority evidence
- consumer evidence
- precedence evidence
- read/write authority evidence
- affected migration wave
- affected PR type
- runtime behavior impact
- rollback or containment plan if behavior can change

Evidence may come from:

- source inventory
- consumer inventory
- precedence report
- conflict report
- read/write authority map
- migration readiness review
- global blueprint
- governance rules
- execution control center

## Board Approval Rules

### Authority Decision Approval

Approve only if:

- current authority is identified
- target authority is identified
- upstream dependency is clear
- downstream consumers are known
- adapter path is defined
- fallback behavior is defined

Reject if:

- target authority bypasses upstream layer
- ownership is inferred without audit evidence
- decision would make a local wrapper permanent authority

### Command Boundary Approval

Approve only if:

- current writer is identified
- target writer is justified
- behavior change is explicit
- rollback path exists
- regression scope is defined

Reject if:

- command ownership changes inside adapter PR
- Growth Loop becomes writer
- Business State or Journey absorbs domain writers without separate command-boundary ADR
- Agent Runtime execution behavior changes without runtime ADR

### Retirement Approval

Approve only if:

- runtime references are zero
- adapter is stable or no longer needed
- consumers have migrated
- checks pass
- restore path is known

Reject if:

- active runtime references remain
- retirement would remove factual domain writer
- authority audit is missing

### Wave Exception Approval

Approve only if:

- exception is architecture-only or adapter-only
- no runtime behavior changes
- no consumer cutover occurs before adapter
- locked wave remains implementation-locked

Reject if:

- exception attempts direct rewrite
- exception moves DashboardV4 early
- exception mixes multiple implementation waves

## Standing Decision Queue

| ID | Decision | Category | Layer | Status | Blocks |
| --- | --- | --- | --- | --- | --- |
| ARB-001 | Business Mode Authority | Authority Decision | Interview Authority / Business State | Proposed | complete Interview and Business State projection closure |
| ARB-002 | Revenue Journey Ownership | Authority Decision | Journey / Business State / Growth Loop | Proposed | Journey final projection and dashboard revenue cutover |
| ARB-003 | Growth Resolver | Authority Decision | Growth Loop | Proposed | Growth Loop mixed consumer cutover |
| ARB-004 | Assignment Taxonomy | Authority Decision | AI COO / Agent Runtime | Proposed | AI COO assignment contract |
| ARB-005 | Tactical vs Strategic Recommendation Rule | Authority Decision | AI COO | Proposed | dashboard AI and CEO recommendation cutover |
| ARB-006 | Followup Ownership | Command Boundary Decision | Growth Loop / CRM | Proposed | retention command-boundary review |
| ARB-007 | Invite Consumption Ownership | Command Boundary Decision | Growth Loop / Member | Proposed | referral command-boundary review |
| ARB-008 | Runtime Execution Ownership | Command Boundary Decision | AI COO / Agent Runtime | Proposed | Agent Runtime behavior changes |
| ARB-009 | `missionEngineService` Retirement | Retirement Decision | Journey / Business State | Deferred | legacy mission retirement |
| ARB-010 | `AiRecommendationPanel` Retirement | Retirement Decision | AI COO / Growth Loop | Deferred | dashboard recommendation retirement |
| ARB-011 | `metadata.brand_profile` Retirement | Retirement Decision | Interview Authority | Deferred | legacy metadata retirement |
| ARB-012 | Agent Runtime Memory Persistence | Command Boundary Decision | Agent Runtime | Proposed | durable memory replacement |
| ARB-013 | Automation Side-Effect Boundary | Command Boundary Decision | Growth Loop / Automation | Proposed | automation consumer and command review |
| ARB-014 | Platform vs Team vs Franchise Growth Scope | Authority Decision | Growth Loop | Proposed | expansion projection cutover |

## Architecture Review Outcomes

Each board review must end with one of these outcomes:

| Outcome | Meaning | Required Next Step |
| --- | --- | --- |
| Approve As Proposed | requested decision may proceed | update execution plan and open scoped PR |
| Approve With Conditions | decision may proceed only with listed constraints | attach conditions to PR checklist |
| Reject | decision may not proceed | re-scope or abandon |
| Defer | decision postponed | keep adapter or blocker in place |
| Convert To ADR | topic needs formal ADR before work continues | create ADR |
| Convert To Authority Audit | evidence is insufficient | run audit before decision |
| Convert To Command Boundary Review | write/execute ownership is affected | stop implementation PR |

## Migration-Impact Assessment

Every outcome must classify impact:

| Impact | Meaning |
| --- | --- |
| None | no migration sequence impact |
| Local | affects one authority layer only |
| Cross-Layer | affects two or more layers |
| Wave Gate | blocks wave exit or next-wave entry |
| Command Boundary | affects write or execution ownership |
| Retirement | affects legacy deletion/removal |
| High-Risk Consumer | affects DashboardV4, `useDashboardMission`, AI recommendations, platform/team/franchise, automation, or Agent Runtime execution |

Required migration-impact fields:

- affected wave
- affected authority
- affected PR type
- consumers affected
- write paths affected
- adapters required
- retirements affected
- tests/checks required

## Board Meeting Checklist

Before review:

- decision category assigned
- ADR draft exists
- evidence links attached
- affected wave identified
- affected PR type identified
- governance rules checked

During review:

- confirm current authority
- confirm proposed authority
- confirm upstream dependency
- confirm write/command impact
- confirm consumer impact
- confirm retirement impact
- confirm fallback/adapter path

After review:

- status assigned
- migration-impact assessment recorded
- PR scope updated
- execution control board updated
- blockers updated

## Relationship To Phase 9B Execution Control

The Architecture Review Board controls decisions.

The Execution Control Center controls execution.

```text
Architecture Review Board
  decides unresolved authority, command, and retirement questions

Execution Control Center
  schedules approved work into waves and PR types
```

Execution Control may not proceed on blocked architecture decisions.

Architecture Review may not bypass execution gates.

## Stop Conditions

Stop migration execution and route to the board if:

- an authority owner is unclear
- a command/write boundary changes
- a runtime behavior changes
- a retirement target has nonzero runtime references
- a mixed consumer must move earlier than planned
- DashboardV4 is touched before late-wave approval
- `useDashboardMission` gains resolver behavior
- Growth Loop writes domain facts
- Agent Runtime execution branch behavior changes
- Business State or Journey absorbs a writer

## Success Criteria

The Architecture Review Board succeeds when:

- every unresolved decision has a status
- every approved decision has an ADR record
- every rejected decision blocks implementation
- every deferred decision has an adapter or blocker path
- every command-boundary change has explicit approval
- every retirement has authority audit evidence
- every migration-impact assessment is linked to execution control

## Final Board Judgment

PHASE 9C establishes the central architecture decision authority for V7 migration.

No unresolved authority, command boundary, or retirement decision may be resolved implicitly inside implementation PRs.

All such decisions must pass through this board before execution proceeds.
