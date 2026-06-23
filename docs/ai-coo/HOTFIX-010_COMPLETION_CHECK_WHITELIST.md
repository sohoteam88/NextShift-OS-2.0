# HOTFIX-010 Completion Check Whitelist

Version: V8

Status: P0 Security Hotfix

Owner: AI COO System

## Depends On

- HOTFIX-007 Real Completion Verification
- EXEC-001 Mission Execution Workspace PRD
- EXEC-001 Mission Execution Workspace Audit 2026-06-22

## Problem

The Mission Workspace step-completion API accepts `check_key` from user input.

Current endpoint:

```text
POST /api/v1/mission/complete-check
```

If the API accepts arbitrary keys, users can self-declare progress or inject capability-style completion checks.

This violates HOTFIX-007: mission completion must be proven, not declared.

## Objective

Restrict completion updates to active mission-approved workspace check keys only.

Users may complete steps. Users may not define completion criteria.

## New Component

`MissionCheckRegistry`

Purpose:

- Generate valid workspace step check keys from the active MissionPlan.
- Validate user-submitted `check_key`.
- Reject arbitrary and cross-mission keys.
- Keep workspace progress separate from mission completion checks.

Registry contract:

```ts
interface MissionCheckRegistry {
  missionType: MissionType;
  allowedChecks: string[];
}
```

## Validation Rule

Before accepting a check:

1. Resolve current Mission Authority.
2. Build the allowed check registry for the active MissionPlan.
3. Accept only if `check_key` exists in the registry.
4. Reject everything else with `400 INVALID_CHECK_KEY`.

Invalid response:

```json
{
  "error": {
    "code": "INVALID_CHECK_KEY",
    "message": "The supplied check does not belong to the active mission."
  }
}
```

## Mission Type Isolation

Checks may only belong to the current mission type and active mission plan.

Example:

- Current mission: `LEAD_MAGNET`
- Accepted: `workspace.step.lead_magnet.3.leadMagnet_publish`
- Rejected: `workspace.step.funnel.3.funnel_route`
- Rejected: `positioning_completed`

## Completion Check Separation

Workspace checks track user step progress.

Completion checks verify business capability.

These must never be mixed:

- Workspace: `workspace.step.lead_magnet.3.leadMagnet_publish`
- Completion: `leadMagnet.published`

`MissionCompletionVerifier` must never trust `workspace.step.*`.

## Security Rule

Forbidden for user-submitted workspace progress:

- Direct updates to business state
- Direct updates to mission completion
- Direct updates to verification status
- Arbitrary writes to capability completion checks

Users may only update active mission workspace progress.

## Audit Logging

Log:

- `completion_check.accepted`
- `completion_check.rejected`

Fields:

- `missionId`
- `missionType`
- `checkKey`
- `result`
- `timestamp`

## Dashboard Rule

Dashboard must not expose allowed checks, registry internals, or validation rules.

Dashboard displays only:

- Step progress
- Completion percentage
- Verification status

## Acceptance Criteria

- `MissionCheckRegistry` exists.
- API validates check keys.
- Cross-mission checks are rejected.
- Arbitrary checks are rejected.
- Workspace checks are separated from completion checks.
- `MissionCompletionVerifier` ignores `workspace.step.*`.
- Audit logs are generated.
- Type-check passes.
- Build passes.

