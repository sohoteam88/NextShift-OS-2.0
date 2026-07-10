# PHASE_8A_2E Business State Execution Plan Review

## Decision

`APPROVE AS EXECUTION DIRECTION, REJECT AS IMPLEMENTATION-READY PLAN`

## Why

This version is materially better than `2D`.

It now includes the pieces that were missing before:

- named waves
- named source groups
- named projection adapters
- named first-wave consumers
- blocker register
- explicit late-wave handling for Dashboard and Activation

So this is no longer just migration direction. It is a real execution plan.

But it is still not implementation-ready, because it has not yet reached PR-by-PR execution granularity.

## What Improved From 2D

### 1. Wave 1 is now properly scoped

This is the biggest improvement.

The plan now names concrete first-wave units:

- Wave 1A Funnel OS
- Wave 1B Business Intel
- Wave 1C Social Setup
- Wave 1D Traffic Engine

That matches the audit evidence and the migration-readiness review.

### 2. Adapter mapping is now explicit

This was a major gap in `2D`, and it is now mostly fixed.

Examples now present:

- `funnelProgressService -> BusinessState.stage`
- `funnelHealthService -> BusinessState.readiness`
- `funnelProgressService.bottleneck -> BusinessState.bottlenecks`
- `funnelHealthService.nextAction -> BusinessState.opportunities`
- `ceoAdvisorEngine.health -> readiness`
- `socialSetupValidator -> readiness`
- `trafficEngineService / calculateReadiness -> readiness/opportunities`

That is the right execution shape.

### 3. Late-wave consumers are correctly protected

The plan keeps these out of early waves:

- `useDashboardMission()`
- `DashboardV4`
- `useActivation()`
- `ActivationDashboard`

That is correct.

### 4. The blocker register is now carried forward

This is also correct and necessary:

- mixed mission/journey semantics
- proxy readiness semantics
- dashboard winner-selection logic
- activation taxonomy
- heterogeneous bottleneck formats
- heterogeneous opportunity formats

## Why It Is Still Not Implementation-Ready

### 1. Wave 2A to Wave 5A are still projection labels, not execution slices

Wave 1 is much stronger than the rest.

But these are still too abstract:

- Wave 2A Stage Normalization
- Wave 3A Readiness Normalization
- Wave 4A Bottleneck Normalization
- Wave 5A Opportunity Normalization

They say what should exist, but not:

- which concrete adapter file is created first
- which route or hook moves first
- which consumer proves the projection works

So the plan is uneven: Wave 1 is near-executable, later waves are not.

### 2. Retirement gates are incomplete and inconsistent

Only Wave 1A explicitly names:

- all consumers migrated
- reference audit complete
- `0 runtime references`

That same gate structure must apply to:

- `missionEngineService`
- legacy mission routes
- duplicated readiness wrappers
- duplicated opportunity wrappers

Without universal retirement gates, this is still a planning document, not an execution contract.

### 3. Legacy mission retirement is still underspecified

`Wave 2B Legacy Mission Retirement Bridge` is directionally correct, but too thin.

It still needs:

- exact consumer list
- exact bridge contract
- exact exit criteria

At minimum it should name:

- `/api/mission/current`
- `/api/mission/complete`
- `/api/mission/mode`
- `MissionCard`

Right now it only names the source.

### 4. Dashboard and Activation cutover are still placeholders

The plan correctly moves them to the end, but “Dashboard Cutover” and “Activation Cutover” are still headings, not execution plans.

Those sections still need:

- adapter contract
- consumer list
- sequencing inside the cluster
- exit criteria

This matters because those are the highest-risk consumers in the whole Business State migration.

### 5. Opportunity normalization still lacks authority ordering

The plan correctly lists the sources, but it still does not define the canonical merge order for:

- journey actions
- mission actions
- funnel actions
- CEO opportunities

That is still a real blocker. Opportunity migration is not only adapter work; it also needs priority law.

## What Must Be Added Before Implementation Starts

### 1. Turn each later wave into PR-sized slices

Example:

- Wave 2A-1: `missionService -> BusinessState.stage` adapter
- Wave 2A-2: `funnelProgressService -> BusinessState.stage` adapter
- Wave 2A-3: first bounded stage consumer cutover

The same pattern should be applied to Readiness, Bottlenecks, and Opportunities.

### 2. Add per-wave exit criteria

Each wave should end with:

- adapters created
- named consumers migrated
- reference audit completed
- `pnpm type-check`
- `pnpm build`
- retirement decision explicit

### 3. Add exact legacy mission consumer inventory

This is required before `Wave 2B` can be considered executable.

### 4. Define canonical opportunity precedence

This is still missing and is required before `Wave 5A` can begin safely.

## Recommended Judgment By Section

| Section | Status | Reason |
| --- | --- | --- |
| Wave 1A Funnel OS | Near-ready | best specified wave in the plan |
| Wave 1B Business Intel | Directionally ready, needs exit criteria | consumer list exists, retirement and proof gates not yet explicit |
| Wave 1C Social Setup | Directionally ready, needs exit criteria | same issue |
| Wave 1D Traffic Engine | Directionally ready, needs exit criteria | same issue |
| Wave 2A Stage Normalization | Not implementation-ready | too abstract |
| Wave 2B Legacy Mission Bridge | Not implementation-ready | source named, consumer bridge not named |
| Wave 3A Readiness Normalization | Not implementation-ready | still projection-level only |
| Wave 4A Bottleneck Normalization | Not implementation-ready | still projection-level only |
| Wave 5A Opportunity Normalization | Not implementation-ready | precedence still unresolved |
| Dashboard Cutover | Not implementation-ready | placeholder |
| Activation Cutover | Not implementation-ready | placeholder |

## Final Assessment

This document successfully upgrades `2D` into a credible execution-direction plan.

It still stops one layer short of implementation-ready detail.

The correct judgment is:

`APPROVE AS EXECUTION DIRECTION, REJECT AS IMPLEMENTATION-READY PLAN`
