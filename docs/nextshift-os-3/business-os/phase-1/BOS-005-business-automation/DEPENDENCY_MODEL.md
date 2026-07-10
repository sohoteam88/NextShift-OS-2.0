# BOS-005 Dependency Model

## Purpose

This document defines the dependency model for Business Automation.

## Dependency Principle

Business Automation must operate from documented workflow and workspace context. It cannot schedule, trigger, govern, or hand off automation safely without the workflow model from BOS-003 and the workspace context model from BOS-004.

## Dependency Chain

```text
BOS-003 AI Workflow
  -> BOS-004 Workspace Experience
  -> BOS-005 Business Automation
  -> BOS-006 Business Memory
  -> BOS-007 Event Platform
```

## Dependency Roles

| Dependency | Provides | Consumed By |
| --- | --- | --- |
| BOS-003 AI Workflow | Workflow plan, lifecycle state, approval checkpoints, retry, recovery, and event handoff expectations | BOS-005 Workflow-to-Automation Handoff and Automation Governance |
| BOS-004 Workspace Experience | Active workspace context, session continuity, workspace-originated action context, and human workspace handoff boundaries | BOS-005 Workspace-aware Automation Context |
| Scheduler | Timing, recurrence, and run-window expectations | Trigger Engine, Automation Pipeline, Background Jobs |
| Trigger Engine | Start, pause, resume, stop, and event-intake conditions | Automation Pipeline, Rule Engine, Event Platform |
| Rule Engine | Business eligibility, guardrails, escalation, and policy boundaries | Scheduler, Trigger Engine, Automation Governance |
| Automation Pipeline | Ordered business automation steps and handoff boundaries | Background Jobs, Business Memory, Event Platform |
| Background Jobs | Deferred, long-running, asynchronous, and retryable work expectations | Automation Pipeline, Event Platform, Business Memory |
| Automation Governance | Approval, auditability, ownership, retry, pause, cancellation, and policy expectations | Scheduler, Trigger Engine, Rule Engine, Automation Pipeline |

## Downstream Dependencies

BOS-006 Business Memory depends on BOS-005 for:

- Automation context
- Automation history expectations
- Governance and approval signals
- Background job and recovery context
- Workspace-aware automation context

BOS-007 Event Platform depends on BOS-005 for:

- Automation trigger boundaries
- Automation state signals
- Background job signals
- Failure, retry, pause, cancellation, and completion signals
- Event-readiness boundaries

## Boundary

This dependency model is documentation-only. It does not introduce dependency injection, package dependencies, runtime wiring, storage contracts, memory schemas, event contracts, scheduler services, queues, workers, rule engines, trigger engines, database relationships, background jobs, or API requirements.
