# ADR-016 V7 System Architecture Review

## Verdict

Direction is correct.

This ADR is coherent with the V7 stack already proposed across:

- [V7_1_INTERVIEW_AUTHORITY_PRD_REVIEW.md](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/audit/V7_1_INTERVIEW_AUTHORITY_PRD_REVIEW.md)
- [V7_2_BUSINESS_STATE_ENGINE_PRD_REVIEW.md](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/audit/V7_2_BUSINESS_STATE_ENGINE_PRD_REVIEW.md)
- [V7_3_DYNAMIC_JOURNEY_ENGINE_PRD_REVIEW.md](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/audit/V7_3_DYNAMIC_JOURNEY_ENGINE_PRD_REVIEW.md)
- [V7_4_AI_COO_ORCHESTRATION_PRD_REVIEW.md](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/audit/V7_4_AI_COO_ORCHESTRATION_PRD_REVIEW.md)
- [V7_5_AGENT_RUNTIME_PRD_REVIEW.md](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/audit/V7_5_AGENT_RUNTIME_PRD_REVIEW.md)
- [V7_6_AUTONOMOUS_GROWTH_LOOP_PRD_REVIEW.md](/Users/stevenmacmini/Documents/Codex/2026-06-05/skills/NextShift-OS-2.0/audit/V7_6_AUTONOMOUS_GROWTH_LOOP_PRD_REVIEW.md)

It is the right top-level architecture.

My conclusion:

`APPROVE AS CANONICAL DIRECTION, BUT DO NOT TREAT THIS ADR AS IMPLEMENTATION-READY WITHOUT STRONGER MIGRATION AND CONTRACT RULES`

## What This ADR Gets Right

### 1. It finally defines the full stack as one system

The strongest move in this ADR is that it stops treating NextShift as a set of tools and instead defines one layered operating system:

```text
Interview Authority
-> Business State Engine
-> Journey Engine
-> AI COO
-> Agent Runtime
-> Growth Loop
```

That is the correct abstraction.

It matches the actual cleanup pattern already proven in V6:

- one question
- one authority
- one downstream contract

This is the right architecture law for V7.

### 2. The six questions are the right six questions

These are the correct system questions:

1. who are you
2. where is the business now
3. what should happen next
4. who should do the work
5. how is the work executed
6. what should improve next

That sequencing is coherent.

It also fixes a long-running problem in this repo: recommendation, mission, execution, and advisory logic have historically overlapped.

This ADR gives each one a clean home.

### 3. The prohibition rules are correct

The most important sentence in the whole document is:

```text
No layer may bypass another layer.
No layer may redefine another layer’s authority.
```

That must stay absolute.

Without that rule, the V7 stack collapses back into fragmented domain logic.

### 4. The domain rule is correct

This is one of the best parts of the ADR:

```text
Domains are execution consumers.
```

That is exactly the correction this repo has needed.

Brand, Content, Leads, Sales, and Team should not each reinvent:

- user truth
- business truth
- mission truth
- delegation truth

They should consume canonical projections.

That matches the architectural lessons already established during V6 consolidation.

## Why This ADR Matters In This Codebase

This repository has already lived through the failure mode this ADR is trying to prevent.

The earlier V6 audits showed repeated authority splitting across:

- mission logic
- evolution / unlock logic
- CRM surfaces
- team surfaces
- brand surfaces
- AI guidance

That is why this ADR matters.

It is not abstract architecture theater.
It is a direct response to real fragmentation already found in production code.

## Main Architectural Strength

The strongest idea here is that the stack is question-driven rather than feature-driven.

That matters because feature-driven systems inevitably drift into duplicate authority:

- one module computes readiness
- another module computes next action
- another module recommends priorities
- another module delegates execution

This ADR stops that by making every layer answer exactly one class of question.

That is the right foundation.

## Main Risks

### 1. `BusinessDigitalTwin` is currently too thin

The ADR defines:

```ts
interface BusinessDigitalTwin {
  authority: InterviewAuthority
  state: BusinessState
  journey: JourneyState
}
```

Directionally this is right, but as written it is too thin for the rest of the stack.

At minimum, the runtime architecture will need to distinguish:

- authoritative state
- derived state
- execution context
- optimization feedback context

Also, the naming is slightly off:

- `authority: InterviewAuthority` reads like a service, not a snapshot
- downstream layers need projections, not authority objects

The safer shape is closer to:

- `interview: InterviewProfileSnapshot`
- `businessState: BusinessStateSnapshot`
- `journeyState: JourneyStateSnapshot`

Otherwise this central object will stay conceptual instead of becoming a real runtime contract.

### 2. The ADR says "Accepted" before the migration contract is fully locked

As architecture direction, acceptance is fine.

As implementation law, it is still early.

This ADR still depends on unresolved details already surfaced in the V7 reviews:

- V7.1 source precedence and fact-vs-derived separation
- V7.2 boundary between diagnosis and mission
- V7.3 mission authority absorption from `missionService`
- V7.4 relationship with current AI coach and orchestration surfaces
- V7.5 absorption path for `ai-workforce`
- V7.6 signal-only boundaries and metric adapters

So "Accepted" is safe only if it means:

- accepted as target architecture

not:

- accepted as implementation-complete operating rule

### 3. The migration examples are right, but still too compressed

This section is correct:

```text
Mission Service -> Journey Engine
AI Coach Priorities -> AI COO
ai-workforce -> Agent Runtime
Business Recommendations -> Growth Loop
```

But each arrow hides a large migration problem.

For example:

- `missionService` is not just mission display logic; it is current progression persistence
- AI Coach is not only priorities; it is also explanation UX and recommendation surfaces
- `ai-workforce` is not only runtime execution; it already includes orchestration behavior
- business recommendations exist in several modules, not one place

So the ADR is right on destination, but too compact on transition mechanics.

### 4. Domain execution-consumer rule still needs enforcement machinery

The ADR says domains must consume canonical truths.

That is correct.

But this repo already showed that declarations alone do not hold.

If this rule is meant to survive implementation, the system will eventually need:

- projection-only import boundaries
- adapter ownership rules
- route consumer audits
- test coverage for authority discipline

Without those, the ADR remains a good statement of intent but not a durable runtime constraint.

## What Must Be Tightened

### 1. Replace abstract authority names with projection contracts in the central object

The ADR should make clear that downstream layers consume snapshots and plans, not authority services.

For example:

```ts
interface BusinessDigitalTwin {
  interview: InterviewProfileSnapshot
  businessState: BusinessStateSnapshot
  journeyState: JourneyStateSnapshot
}
```

Then V7.4, V7.5, and V7.6 can consume stable contracts instead of conceptual authorities.

### 2. Add a formal migration rule for "source -> projection -> consumers -> retirement"

The ADR currently says legacy systems must be absorbed.

That is correct, but the actual law should be stronger:

1. identify current authority
2. define canonical projection
3. migrate consumers
4. verify zero runtime references
5. retire legacy authority

That pattern already worked in V6 evolution consolidation.
It should be made explicit here.

### 3. Define the first-wave runtime stack

The full six-layer stack is valid, but implementation should declare a first-wave runtime order:

1. Interview Authority
2. Business State Engine
3. Journey Engine
4. AI COO
5. Agent Runtime
6. Growth Loop

That order is implied, but it should be explicit as a build sequence too.

Otherwise teams will try to implement upper layers before the lower contracts are stable.

### 4. Clarify that domains may own execution data, but not cross-domain truth

The current wording is good but can be misread.

Domains should still own domain execution data:

- content outputs
- leads
- deals
- team members

What they may not own is:

- identity truth
- business diagnosis truth
- mission truth
- delegation truth

That distinction matters, otherwise the "domains are execution consumers" line can become too blunt.

## Final Judgment

This ADR is the correct V7 north star.

It is coherent with the earlier V7 reviews, and it expresses the right system law:

- one question
- one authority
- one downstream contract

That is the right architectural correction for this codebase.

My final judgment:

`APPROVE AS CANONICAL ARCHITECTURE`

But with one important qualifier:

this ADR is ready to govern direction, not yet detailed enough to govern implementation by itself.

It still needs:

- stronger projection contracts
- clearer migration mechanics
- enforcement rules for consumers

Without those, the architecture is correct, but the repo can still drift while claiming compliance.
