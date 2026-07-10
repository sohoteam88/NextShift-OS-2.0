# PHASE_8A_3D Journey Migration Plan Review

## Decision

`APPROVE AS MIGRATION DIRECTION, REJECT AS EXECUTION-READY PLAN`

## Why

This plan is directionally correct.

It follows the audit evidence in the right order:

1. modern journey source first
2. next-action consolidation second
3. legacy mission retirement bridge before direct deletion
4. dashboard and activation as adapter waves, not first-wave source authority
5. AI as an adapter wave, not a new authority
6. revenue journey deferred until ownership is decided

That sequence is coherent with the actual runtime split documented in:

- `journey-authority-source-summary.md`
- `journey-authority-consumer-risk-report.md`
- `journey-authority-precedence-report.md`
- `journey-authority-conflict-report.md`

## What The Plan Gets Right

### 1. Wave 1A is correct

`journey-map.ts` and `missionService` are the strongest modern progression/milestone chain.

Starting with:

- `JourneyState.progression`
- `JourneyState.milestones`

is the correct first move.

### 2. Wave 1B is correctly separated

`getNextJourneyAction()` is the strongest current base resolver for next action, but it is not identical to dashboard or activation CTA behavior.

Promoting it into `JourneyState.nextAction` as a distinct wave is correct.

### 3. Legacy mission is treated as retirement scope, not canonical input

That matches the audit.

The legacy chain:

- `missionEngineService`
- `missionStages.ts`
- `/api/mission/*`

is a duplicate runtime path and should be retired, not promoted.

### 4. Dashboard and activation are correctly modeled as adapters

This is the most important correct choice in the plan.

Both:

- `useDashboardMission()`
- `useActivation()`

are mixed wrappers today. They should consume `JourneyState`, not define it.

### 5. Revenue journey is correctly postponed

The current repo evidence does not justify forcing revenue journey inside Journey yet.

Keeping Wave `4A` as an ownership-resolution step is the right call.

## Why It Is Not Execution-Ready

### 1. Waves are still domain labels, not PR slices

The plan says:

- Wave 1A
- Wave 1B
- Wave 2A
- Wave 2B
- Wave 3A
- Wave 3B
- Wave 4A

But each wave is still too broad to execute safely.

It does not yet define:

- exact files per wave
- first consumer cutover per wave
- adapter boundary per wave
- retirement gate per wave

### 2. Mission projection is underspecified

The plan says `JourneyState` owns missions, but it does not yet say how mission truth will be normalized across:

- dashboard `getCurrentMission()`
- `DAY_MISSIONS`
- `missionEngineService.getCurrentMission()`

This is the most fragmented projection in the audit and needs explicit collapse rules.

### 3. Dashboard wave is too compressed

`useDashboardMission()` is not the only dashboard migration surface.

The real dashboard cluster includes:

- `useDashboardMission()`
- `DashboardV4`
- downstream dashboard panels consuming mission state
- AI coach messaging inside dashboard output

So `Wave 2B` needs a named consumer inventory, not only a hook label.

### 4. Activation wave is too compressed

`useActivation()` and `activation-service` are not just one adapter.

They include:

- day-based progression
- day mission mapping
- activation score
- activation level
- activation completion gating in dashboard

That is enough surface area that `Wave 3A` needs its own internal cut sequence.

### 5. AI adapter wave is underspecified

The plan correctly identifies:

- `ai-coach-service`
- AI workforce routing

But it does not yet distinguish two different contracts:

- advisory narrative next-action
- direct stage-based workforce routing

Those are not the same migration target.

### 6. Retirement timing is still too high-level

The retirement targets are broadly correct, but the plan does not define the hard gate for each one:

- zero runtime references?
- route-level redirect or deletion?
- bridge removal after consumer audit?

Without that, retirement remains directional rather than executable.

## Required Additions Before Execution

To become implementation-ready, this plan still needs:

1. Named consumers per wave
2. Exact file scope per wave
3. Adapter contract per wave
4. Explicit mission-collapse rule
5. Explicit next-action precedence rule after cutover
6. Retirement gate for each legacy target
7. Separate handling for:
   - dashboard AI advice
   - AI workforce routing
   - activation taxonomy

## Recommended Interpretation

This document is good enough to act as:

`phase-level migration direction`

It is not yet good enough to act as:

`implementation-ready execution plan`

The next step should be a more granular execution document that turns each wave into PR-sized work with named consumers, adapters, and retirement proofs.
