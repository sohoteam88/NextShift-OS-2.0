# BOS-003 Dependency Model

## Purpose

This document defines the dependency model for AI Workflow.

## Dependency Principle

AI Workflow must operate from documented decision context. It cannot plan, approve, retry, recover, or hand off workflow execution without the decision output provided by BOS-002.

## Dependency Chain

```text
BOS-002 Decision Intelligence
  -> BOS-003 AI Workflow
  -> BOS-005 Business Automation
  -> BOS-007 Event Platform
```

## Dependency Roles

| Dependency | Provides | Consumed By |
| --- | --- | --- |
| BOS-002 Decision Intelligence | Recommended action, rationale, priority, opportunity context, decision policy boundary, and execution-readiness signal | BOS-003 AI Workflow |
| Workflow Engine | Workflow planning and orchestration boundary | Workflow Templates, Multi-step Workflow, Business Automation |
| Workflow Templates | Reusable workflow patterns | Workflow Engine, Business Automation, Workspace Experience |
| State Machine | Workflow lifecycle states and transitions | Human Approval, Retry and Recovery, Event Driven Workflow |
| Human Approval | Review and approval checkpoints | Workflow Engine, Automation, Audit |
| Retry and Recovery | Failure handling expectations | Workflow Engine, Automation, Event Platform |
| Event Driven Workflow | Event handoff boundary | BOS-007 Event Platform |

## Downstream Dependencies

BOS-005 Business Automation depends on BOS-003 for:

- Workflow plan
- Workflow template
- State and transition expectations
- Approval checkpoints
- Retry and recovery expectations

BOS-007 Event Platform depends on BOS-003 for:

- Event handoff points
- Workflow state signals
- Failure and recovery signals
- Completion signals

## Boundary

This dependency model is documentation-only. It does not introduce dependency injection, package dependencies, runtime wiring, event contracts, database relationships, queues, background jobs, or API requirements.
