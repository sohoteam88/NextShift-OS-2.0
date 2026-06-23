# HOTFIX-015 Activation Drop-Off Engine

Version: V8

Status: P0 Growth Hotfix

Owner: Product Growth Team

## Depends On

- PRODUCT-004 Activation Engine PRD
- PRODUCT-004 Activation Engine Audit 2026-06-22

## Problem

The Activation Engine detected drop-off too early.

Users who were actively progressing could be incorrectly classified as stalled.

Example:

- User signed up 5 minutes ago.
- Current step is `AI_INTERVIEW`.
- Old result: interview drop-off.
- Correct result: user is still inside the expected completion window.

## Root Cause

Old logic treated:

`Not Completed -> Dropoff`

Correct logic:

`Not Completed -> Grace Period -> Dropoff`

## Objective

Only classify users as dropped off when they exceed the allowed completion window.

## Core Principle

In progress is not dropped off.

## Activation States

- `ACTIVE`
- `ON_TRACK`
- `AT_RISK`
- `DROPPED_OFF`
- `ACTIVATED`

## State Definitions

- `ON_TRACK`: user is within the expected completion window.
- `AT_RISK`: user is approaching the drop-off threshold.
- `DROPPED_OFF`: user exceeded the threshold.
- `ACTIVATED`: user reached first value.

## Activation Timeline Matrix

| Step | Grace Period |
| --- | --- |
| `SIGNUP` | 6 hours |
| `AI_INTERVIEW` | 24 hours |
| `BUSINESS_ANALYSIS` | 24 hours |
| `FIRST_MISSION` | 48 hours |
| `FIRST_ASSET` | 72 hours |
| `FIRST_OUTCOME` | 7 days |
| `ACTIVATED` | No drop-off |

## Risk Thresholds

- `ON_TRACK`: 0% to 75% of grace period.
- `AT_RISK`: greater than 75% through 100% of grace period.
- `DROPPED_OFF`: exceeded grace period.

Example for `AI_INTERVIEW`:

- 12 hours -> `ON_TRACK`
- 20 hours -> `AT_RISK`
- 25 hours -> `DROPPED_OFF`

## Drop-Off Engine Contract

Input:

- Current step
- Created at
- Last activity
- Current time

Output:

```ts
interface ActivationDropOffRisk {
  state: 'ON_TRACK' | 'AT_RISK' | 'DROPPED_OFF' | 'ACTIVATED';
  riskLevel: string;
  hoursRemaining: number | null;
}
```

## Last Activity Rule

Drop-off timer resets when meaningful activity occurs.

Examples:

- Answer interview question
- Generate asset
- Open mission workspace
- Approve asset
- Start mission

Rule: last meaningful activity wins.

## Intervention Rules

`ON_TRACK`:

- No intervention.

`AT_RISK`:

- Soft reminder.
- Examples: in-app prompt, mission reminder, progress reminder.

`DROPPED_OFF`:

- Recovery intervention.
- Examples: email, reactivation prompt, AI COO re-engagement mission.

## Notification Frequency

Maximum one intervention per activation stage per 24 hours.

Purpose: prevent spam.

## Dashboard Rule

Display:

- Current activation state
- Hours remaining
- Next milestone

Do not display:

- Drop-off risk score
- Internal thresholds

## AI COO Risk Detector

Rules:

- `ON_TRACK` -> no risk.
- `AT_RISK` -> monitor.
- `DROPPED_OFF` -> recovery action.

## Audit Logging

Store:

- `activation.state.changed`
- `activation.at_risk`
- `activation.dropoff`
- `activation.recovered`

Fields:

- User
- Step
- State
- Timestamp
- Hours since activity

## Test Cases

- `AI_INTERVIEW`, 5 hours -> `ON_TRACK`
- `AI_INTERVIEW`, 20 hours -> `AT_RISK`
- `AI_INTERVIEW`, 25 hours -> `DROPPED_OFF`
- `FIRST_MISSION`, 36 hours -> `ON_TRACK`
- `FIRST_MISSION`, 50 hours -> `DROPPED_OFF`
- Meaningful user activity occurs -> timer resets

## Acceptance Criteria

- Grace periods implemented.
- `AT_RISK` state exists.
- `ON_TRACK` state exists.
- Drop-off only after threshold.
- Meaningful activity resets timer.
- Notification throttling exists.
- Type-check passes.
- Build passes.

## Success Metrics

- False Drop-Off Rate target: less than 5%
- Activation Intervention Accuracy target: 90%
- Notification Spam Rate target: 0%
- Activation Rate target: +15%

## Final Principle

A user is not dropped off because they are unfinished.

A user is dropped off because they stopped progressing.

The Activation Engine should measure momentum, not impatience.
