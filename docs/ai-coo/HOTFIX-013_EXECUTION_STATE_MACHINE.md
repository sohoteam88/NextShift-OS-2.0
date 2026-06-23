# HOTFIX-013 Execution State Machine

Version: V8  
Status: P1 Hardening  
Owner: AI Workforce System

## Depends On

- EXEC-004 Autonomous Execution
- EXEC-004 Autonomous Execution Audit

## Problem

Autonomous Execution Queue supported execution statuses, but transition validation was not enforced. The queue trusted callers to move states correctly.

Example: `COMPLETED -> EXECUTING` was technically possible but architecturally invalid.

## Objective

Convert execution status into a strict state machine. Only valid transitions are allowed. Invalid transitions are rejected before execution persistence.

## Execution States

- `queued`
- `executing`
- `completed`
- `failed`
- `blocked`
- `cancelled`

The existing internal `approved` state remains supported for compatibility with approval projection, but terminal states still cannot be reopened.

## Allowed Transitions

| From | To |
| --- | --- |
| queued | approved, executing, blocked, cancelled |
| approved | executing, blocked, cancelled |
| executing | completed, failed, blocked, cancelled |
| blocked | queued, cancelled |
| failed | queued, cancelled |
| completed | none |
| cancelled | none |

## Forbidden Examples

- `completed -> executing`
- `completed -> queued`
- `completed -> failed`
- `cancelled -> executing`
- `cancelled -> queued`
- `blocked -> completed`
- `failed -> completed`

## Component

`ExecutionStateMachine` owns transition validation:

```ts
interface ExecutionTransition {
  from: ExecutionStatus;
  to: ExecutionStatus;
}
```

Queue transitions call the state machine before audit persistence. Invalid transitions throw `INVALID_EXECUTION_TRANSITION` with `{ from, to }` details.

## Audit Logging

Every transition attempt writes:

- `execution.transition.allowed`
- `execution.transition.rejected`

Audit metadata stores:

- executionId
- from
- to
- result
- timestamp

## Retry Rules

`failed -> queued` is allowed for user-requested retry.

`blocked -> queued` is allowed when approval or required conditions are resolved.

## Completion Rules

`completed` is terminal. No retries, reopening, or reactivation. Create a new execution instead.

## Cancellation Rules

`cancelled` is terminal. No reactivation. Create a new execution instead.

## Acceptance Criteria

- ExecutionStateMachine exists.
- Allowed transitions are enforced.
- Forbidden transitions are rejected.
- Audit logging exists.
- Queue uses state machine.
- Type-check passes.
- Build passes.

## Final Principle

Execution state is not a suggestion. Execution state is a contract.
