# HOTFIX-007 Real Completion Verification

Version: V8

Status: P0 Hotfix

Owner: AI COO System

## Depends On

- COO-001B State Validation Engine PRD
- COO-005 Mission Generator V2 PRD
- COO-005 Mission Generator V2 Audit 2026-06-22

## Problem

Mission Generator V2 defines `completionChecks`, `successCriteria`, and `missionCompletion`, but completion can still be falsely inferred from journey mission status.

That creates a false completion signal:

1. User marks mission completed.
2. Journey status becomes completed.
3. Mission appears complete even when the required business capability is still missing.

Example: a lead magnet mission requires:

- `leadMagnet.exists`
- `leadMagnet.published`
- `cta.active`

The mission must not complete unless those checks are verified against business evidence.

## Objective

Make mission completion provable.

A mission is complete only when required completion checks pass. It is not complete because a user clicked complete or because a journey status says completed.

## Core Principle

Completion must be verified, not declared.

## Completion Verification Engine

Add `MissionCompletionVerifier`.

Purpose:

- Validate mission completion checks against real business signals.
- Return progress and failed checks.
- Prevent status-driven false completion.

Inputs:

- Mission Plan
- Completion Checks
- Business State
- Bottleneck Signal Set
- Validation source availability

Output:

```ts
interface MissionCompletionResult {
  completed: boolean;
  completionPercentage: number;
  passedChecks: string[];
  failedChecks: string[];
  nextRequiredCheck: string | null;
}
```

## Completion Rule

Mission complete only if all required checks pass.

Progress formula:

```text
passedChecks / totalChecks * 100
```

Example:

- `leadMagnet.exists`: pass
- `leadMagnet.published`: pass
- `cta.active`: fail

Result:

- `completed`: false
- `completionPercentage`: 66
- `nextRequiredCheck`: `cta.active`

## Verification Examples

Lead magnet mission:

- `leadMagnet.exists`: `leadMagnet.id != null` or equivalent signal
- `leadMagnet.published`: lead magnet is published
- `cta.active`: CTA route or contact method is active

Funnel mission:

- `landingPage.published`
- `thankYouPage.published`
- `leadRoute.active`

Traffic mission:

- `trafficSource.active`
- `tracking.active`

Customer mission:

- customer evidence exists, such as `customerCount > 0`

Healthy business mission:

- bottleneck remains `BUSINESS_HEALTHY`

System mission:

- signal sources are available
- required metrics are resolved

## Dashboard Behavior

Dashboard displays verifier output only. It does not validate checks locally.

Dashboard must show:

- Progress percentage
- Passed check count
- Remaining check count
- Next required check
- Verification status

## Mission Authority Rule

Mission Authority consumes `MissionCompletionResult`.

Mission Authority does not manually decide completion from journey status.

If journey status says completed but verification fails, Mission Authority must not emit `COMPLETED`.

## Audit Logging

Audit metadata stores:

- Mission ID
- Completion percentage
- Passed checks
- Failed checks
- Next required check
- Verification status
- Verification timestamp
- Full completion result

## Mission Lifecycle

Supported lifecycle states:

- `PENDING`
- `ACTIVE`
- `VERIFYING`
- `COMPLETED`
- `BLOCKED`

`VERIFYING` means verification sources are unavailable or still being evaluated.

`BLOCKED` means verification ran and required checks remain failed.

## Acceptance Criteria

- Mission completion is based on completion checks.
- Mission completion is not based on journey status.
- `MissionCompletionVerifier` exists.
- Dashboard shows verification progress.
- Audit metadata stores verification results.
- Verification source failure returns `VERIFYING`, not completed.
- Type-check passes.
- Build passes.

## Success Metrics

- False completion rate target: 0%
- Completion accuracy target: 100%
- Mission verification coverage target: 100%

