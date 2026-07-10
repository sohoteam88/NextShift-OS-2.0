# PHASE_8A_2D Business State Migration Plan Review

## Decision

`APPROVE AS MIGRATION DIRECTION, REJECT AS EXECUTION-READY PLAN`

## Why

This plan is aligned with the completed audit set and with the readiness decision:

- Business State is ready for migration planning
- high-risk dashboard and activation consumers should stay late-wave
- bounded domains should move before mixed orchestration surfaces

So the overall direction is correct.

But this document is still a phase skeleton, not an execution-ready migration plan.

## What The Plan Gets Right

### 1. It starts with bounded domains

Putting these earlier is correct:

- Funnel OS
- Business Intel
- Social Setup
- Traffic Engine

These are the cleanest first-wave domains because each has a relatively contained authority chain.

### 2. It keeps Dashboard and Activation out of first wave

This matches the audit evidence.

The highest-risk surfaces are still:

- `useDashboardMission()`
- `DashboardV4`
- `useActivation()`
- `ActivationDashboard`

Those should stay late-wave.

### 3. It names the correct retirement target

`missionEngineService` and legacy mission routes are correctly identified as retirement scope.

### 4. It separates the four Business State projections

The split into:

- `stage`
- `readiness`
- `bottlenecks`
- `opportunities`

is correct and matches the audit outputs.

## Why It Is Not Execution-Ready

### 1. Wave ordering is still too abstract

The plan says:

- Wave 1: bounded domains
- Wave 2: stage
- Wave 3: readiness
- Wave 4: bottlenecks
- Wave 5: opportunities

That is directionally fine, but not yet a safe execution sequence.

The missing part is consumer sequencing inside each wave.

For example:

- Funnel OS migration is not just “Wave 1”
- it needs:
  - projection contract
  - route adapter
  - UI consumer cutover
  - reference audit

The same problem exists for Business Intel, Social Setup, and Traffic Engine.

### 2. The plan does not define adapters

The readiness review already established required adapters, but this plan does not carry them forward explicitly.

That is a gap.

Examples that must be named in the plan:

- `missionService.getState() -> BusinessState.stage`
- `funnelHealthService -> BusinessState.readiness`
- `ceoAdvisorEngine.health -> BusinessState.readiness`
- `getNextJourneyAction() -> BusinessState.opportunities`

Without adapter definitions, “migration wave” is still conceptual.

### 3. It does not distinguish source migration from consumer migration

This is the biggest execution gap.

A safe plan needs separate tracks for:

1. source normalization
2. projection creation
3. bounded consumer migration
4. legacy retirement

Right now those are compressed into single wave labels.

### 4. Legacy mission retirement is placed too loosely

The plan names:

- `missionEngineService`
- legacy mission routes

as Phase 1 retirement targets.

That is broadly correct, but the condition is missing:

`retire only after all runtime consumers are cut over`

Without that rule, the plan is vulnerable to premature retirement.

### 5. It does not mention blockers already identified

The readiness review identified hard blockers:

- mixed mission/journey semantics
- proxy readiness semantics
- `useDashboardMission()` winner-selection logic
- `useActivation()` separate activation taxonomy
- heterogeneous bottleneck and opportunity shapes

A migration plan that does not explicitly track these blockers is incomplete.

## What Must Be Added Before Execution

### 1. Per-wave consumer list

Every wave needs named consumers.

Example:

- Wave 1A Funnel OS:
  - `/api/v1/funnel-os`
  - `useFunnelOS()`
  - `FunnelOperatingCard`
- Wave 1B Business Intel:
  - `/api/v1/business-intel`
  - `CEOAdvisorDashboard`
  - AI advisor consumers

### 2. Per-wave adapter contract

Every wave needs explicit source-to-projection mapping.

Example:

- `funnelProgressService.getProgress() -> BusinessState.stage`
- `funnelHealthService.evaluateActivity() -> BusinessState.readiness`
- `funnelProgressService.bottleneck -> BusinessState.bottlenecks`
- `funnelHealthService.getActivityNextAction() -> BusinessState.opportunities`

### 3. Retirement gates

Every retirement target needs the same rule:

- consumer migration complete
- reference audit complete
- `0 runtime references`
- `pnpm type-check`
- `pnpm build`

### 4. Explicit blocker register

The plan should carry forward the blockers already known, not rediscover them later.

## Recommended Revision

The next version of this plan should be structured as:

1. Wave 1A: Funnel OS
2. Wave 1B: Business Intel
3. Wave 1C: Social Setup
4. Wave 1D: Traffic Engine
5. Wave 2A: Stage projection
6. Wave 2B: Legacy mission retirement bridge
7. Wave 3A: Readiness normalization
8. Wave 4A: Bottleneck normalization
9. Wave 5A: Opportunity normalization
10. Last wave: Dashboard and Activation cutover

That would be much closer to implementation-ready sequencing.

## Final Assessment

This plan is correct as a migration direction.

It is not yet detailed enough to run as the actual implementation plan.

The right judgment is:

`APPROVE AS MIGRATION DIRECTION, REJECT AS EXECUTION-READY PLAN`
