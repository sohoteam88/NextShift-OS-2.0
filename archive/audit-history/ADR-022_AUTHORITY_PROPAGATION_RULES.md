# ADR-022 Authority Propagation Rules

## Status

Accepted

## Context

C2 identified authority-chain drift across:

Interview Authority -> Business State -> Journey -> AI COO -> Agent Runtime -> Growth Loop

C2A repaired the critical runtime chain through Agent Runtime. This ADR freezes the propagation rules introduced by C2A so future implementation work does not reintroduce local derivation, ambiguous precedence, or duplicate fallback behavior.

## Decision

Authority propagation must follow a strict upstream-to-downstream consumption chain:

1. Interview Authority is the source of profile, audience, and business context.
2. Business State consumes Interview Authority and produces business stage, readiness, bottlenecks, and opportunities.
3. Journey consumes Business State for stage context only. Journey retains ownership of Journey next action.
4. AI COO consumes JourneyState. AI COO may not re-derive Journey from raw `userProgress`.
5. Agent Runtime consumes COOAssignment. Runtime may not replace COO assignments with local default assignments unless no COO assignments exist.

## Business State -> Journey Context Boundary

Business State may influence:

- `JourneyState.stage`
- stage conservatism when readiness is low
- stage conservatism when high-severity bottlenecks exist

Business State may not choose:

- `JourneyState.nextAction`
- Journey mission list
- Journey milestone completion
- Journey revenue progress

Journey remains the authority for:

- next action
- milestone projection
- mission projection
- revenue progression projection

Implementation rule:

`JourneyStateAssembler` must pass Business State context into `JourneyProgressionAdapter`. `JourneyProgressionAdapter` may map `businessStage`, `readiness`, and `bottlenecks` to `JourneyStage`, but must not mutate or bypass Journey-owned outputs.

## Journey -> AI COO Consumption Contract

AI COO must consume:

- `JourneyState.stage`
- `JourneyState.milestones`
- `JourneyState.nextAction`
- `JourneyState.revenueProgress`

AI COO may use JourneyState to:

- set strategic focus
- create journey-derived recommendations
- choose assignment context
- explain priority and expected outcome

AI COO may not:

- read `userProgress.currentStageId` as its primary journey source
- infer Journey next action independently
- ignore JourneyState when generating COOPlan

Fallback rule:

Raw `userProgress` may only be used if `JourneyStateService` is unavailable or returns fallback state. The fallback must be marked in the resulting DTO metadata.

## COOAssignment Precedence Over Runtime Default Assignment

Runtime assignment precedence is:

1. Direct user execution request, only inside execute routes.
2. Explicit goal execution request, only inside execute routes.
3. `COOPlan.assignments`, for RuntimeState pending assignments.
4. Runtime default stage assignment, only when COO assignments are absent.

RuntimeState must consume `COOAssignment[]` as the source for `pendingAssignments`.

RuntimeState may not:

- generate local stage assignments when COO assignments exist
- discard COO assignment IDs
- change execution behavior during state assembly
- trigger agent execution while assembling RuntimeState

Compatibility adapter rule:

`COOAssignment` must be adapted into `RuntimeAssignment` while preserving:

- source assignment ID
- objective
- recommended agents
- execution mode
- reasoning
- fallback/confidence metadata

## Fallback Rules

Fallbacks must be explicit and narrow.

Business State -> Journey fallback:

- If Business State context is missing, Journey may fall back to `userProgress + JOURNEY_MAP`.
- The fallback source must remain visible in metadata.

Journey -> AI COO fallback:

- If JourneyState is unavailable, AI COO may fall back to stage data from existing persistence.
- The COOPlan must not claim authoritative Journey consumption when using fallback.

AI COO -> Runtime fallback:

- If `COOPlan.assignments` is empty, Runtime may use the existing default stage assignment.
- If COO assignments exist, runtime default assignments must not be mixed in unless explicitly marked as supplemental in a later ADR.

Runtime -> Growth Loop fallback:

- Runtime execution result propagation to Growth Loop is deferred.
- Existing `agent_memory` behavior remains a compatibility fallback until C3 defines canonical growth-signal ingestion.

## Conflict Resolution Rules

When upstream and downstream projections disagree, upstream authority wins within its declared boundary.

Conflict matrix:

| Conflict | Winner | Reason |
| --- | --- | --- |
| Business State stage vs Journey raw progress stage | Business State for `JourneyState.stage` only | Business State owns runtime business readiness context. |
| Business State next action suggestion vs Journey next action | Journey | Journey owns next-action sequencing. |
| Journey stage vs COO local stage derivation | Journey | AI COO consumes Journey; it may not re-derive Journey. |
| COO assignment vs Runtime default stage assignment | COO assignment | Runtime default assignment is fallback only. |
| Runtime result vs Growth Loop score | Deferred | C3 must define canonical growth-signal ingestion. |

Tie-breaking:

- Prefer confirmed DTOs over derived DTOs.
- Prefer derived DTOs over fallback DTOs.
- Prefer newer generated timestamps only within the same authority source.
- Do not merge conflicting authorities silently; carry source/fallback metadata forward.

## Consequences

Positive:

- Removes ambiguity in C2A authority propagation.
- Prevents Runtime from hiding COO assignment drift.
- Keeps Journey next-action ownership intact while still allowing Business State to influence stage context.
- Makes future C3 regression tests deterministic.

Tradeoffs:

- COOPlan now depends on JourneyStateService.
- RuntimeState now depends on COOPlanService.
- Growth Loop remains intentionally incomplete until C3 because Runtime -> Growth Loop was deferred by C2A.

## Verification Expectations

C3 regression tests should prove:

- Changing Business State context changes `JourneyState.stage`.
- Changing JourneyState changes COO strategic focus and assignment context.
- COO assignments appear in RuntimeState pending assignments.
- Runtime default stage assignment appears only when COO assignments are absent.

## Related Artifacts

- `audit/authority-chain-validation.md`
- `audit/authority-chain-breakpoints.md`
- `audit/authority-chain-scorecard.md`
- `audit/c2a-remediation-report.md`
- `audit/c2a-authority-chain-retest.md`
