# HOTFIX-003 Priority History Dedup

## Problem

Priority Engine accepted recent priority context, but Mission Engine Authority did not pass mission history into it. Deduplication existed in code but was not active.

The result was repetitive priority recommendations such as `Create Lead Magnet` being recommended repeatedly after the user had already completed it.

## Decision

Mission Engine Authority is responsible for loading recent priority history and passing it into Priority Engine.

Priority Engine must not query storage directly.

## History Source

Preferred source:

- `auditLog.action = mission.decision.projected`

Default recency window:

- 7 days

Required metadata:

- `priorityAction`
- `missionType`
- `bottleneck`
- `completionStatus`

## Dedup Rule

If a candidate action appears in recent priority history, apply a penalty only when:

- the previous action was completed
- the previous bottleneck is no longer the current bottleneck

Default penalty:

- 30 points

Do not immediately reject repeated candidates. The same action may still be correct when the bottleneck remains unresolved.

## Resolution Check

| History State | Current Bottleneck | Penalty |
| --- | --- | --- |
| Completed and bottleneck changed | Resolved | Apply full penalty |
| Completed and same bottleneck remains | Not resolved | No penalty |
| Not completed | Not resolved | No penalty |
| No history | N/A | No penalty |

## Audit Logging

When a dedup penalty is applied, Mission Engine Authority emits:

- `priority.dedup.applied`

Metadata:

- `action`
- `baseScore`
- `penalty`
- `finalScore`
- `reason`

## Dashboard Rule

Dashboard must not display:

- history penalties
- priority scores
- dedup calculations

Dashboard displays only:

- priority
- reason
- expected outcome
- urgency

## Acceptance Criteria

- Mission Engine loads recent priority history from audit logs.
- Mission Engine passes structured priority history into Priority Engine.
- Priority Engine applies the 30 point penalty only when the prior action completed and resolved the bottleneck.
- Bottleneck reality overrides dedup when the same bottleneck remains unresolved.
- Dedup audit log is generated when a penalty is applied.
- Tests cover completed/resolved, completed/unresolved, not completed, no history, and history retrieval.
