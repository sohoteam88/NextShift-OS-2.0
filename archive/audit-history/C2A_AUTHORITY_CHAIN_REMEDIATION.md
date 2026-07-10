# C2A Authority Chain Remediation

## Trigger

C2 final decision: NOT READY FOR C3.

## Objective

Repair authority-chain propagation so one user action can move coherently through:

Interview Authority -> Business State -> Journey -> AI COO -> Agent Runtime -> Growth Loop

## Remediation 1: Business State Drives Journey

Problem:

`JourneyStateAssembler` passes Business State into `adaptJourneyProgression()`, but the adapter ignores the context.

Required change:

- Remove `void context`.
- Make Journey progression consider `businessStage`, readiness, and bottlenecks.
- Preserve `userProgress + JOURNEY_MAP` as fallback, not the only source.

Acceptance:

- Business State stage/readiness changes affect JourneyState output.

## Remediation 2: JourneyState Drives COOPlan

Problem:

`COOPlanAssembler` reads `userProgress.currentStageId` directly.

Required change:

- `COOPlanAssembler` must call `journeyStateService.getJourneyState(userId)`.
- COO recommendations and assignments must include Journey stage, milestones, next action, and revenue progress context.
- Direct `userProgress.currentStageId` reads should be fallback only.

Acceptance:

- Journey next action changes cause COO plan context and assignment basis to change.

## Remediation 3: COOAssignment Drives RuntimeAssignment

Problem:

Runtime never consumes `COOPlan.assignments`.

Required change:

- Add a COO-to-runtime assignment adapter.
- `RuntimeStateAssembler` should call `cooPlanService.getCOOPlan(userId)`.
- Runtime pending assignments should be derived from COO assignments first, with default stage assignment as fallback.

Acceptance:

- A COO assignment appears in Runtime pending assignments without recomputation drift.

## Remediation 4: RuntimeResult Emits Growth Signals

Problem:

Agent execution writes to `metadata.agent_memory`, but Growth Loop does not consume it.

Required change:

- Add canonical runtime result persistence or activity event creation when agents execute.
- Include execution reporting in Growth Loop signal input.
- Add a Growth Loop adapter for runtime execution results.

Acceptance:

- Running an agent updates Growth Loop activity/execution signal state.

## Remediation 5: Drift Reduction Audit

Problem:

Recommendation, readiness, assignment, and growth scoring logic remains duplicated across modules.

Required change:

- Inventory local duplicate logic.
- Mark each duplicate as authority, adapter, or fallback.
- Remove or demote non-authority duplicates after the chain cutover.

Acceptance:

- C2 scorecard reaches at least 4 on all links before C3.
