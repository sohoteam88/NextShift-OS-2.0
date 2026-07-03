# BOS-003 Capability Matrix

## Purpose

This matrix maps AI Workflow capabilities to their Business OS role, source context, and documentation purpose.

## Matrix

| Capability | Business OS Role | Source Context | BOS-003 Use |
| --- | --- | --- | --- |
| Workflow Engine | Workflow orchestration foundation | BOS-002 recommended action and decision policy boundary | Defines how decisions become governed workflow plans. |
| Workflow Templates | Reusable workflow pattern layer | Common Business OS actions and capability handoffs | Defines repeatable structures for multi-step work. |
| State Machine | Workflow lifecycle boundary | Governance, approval, retry, recovery, completion, and failure states | Defines valid workflow states and transitions. |
| Multi-step Workflow | Sequenced execution model | Workflow plan, required inputs, and dependencies | Defines ordered workflow steps before automation exists. |
| Human Approval | Review and approval boundary | Decision policies, AI role standards, and release governance | Defines where human confirmation is required. |
| Retry and Recovery | Resilience boundary | Workflow state, failure mode, and auditability expectations | Defines how failed or interrupted workflows should be documented. |
| Event Driven Workflow | Event handoff boundary | BOS-007 Event Platform and future event contracts | Defines what future event execution must consume from workflow documentation. |

## Consolidation Rule

BOS-003 may reference planned or existing workflow, event, and automation concepts, but it must not change the lifecycle truth recorded by Decision Intelligence, Automation, Event Platform, or capability owners.

## Readiness for Downstream Capabilities

BOS-003 is ready for BOS-005 and BOS-007 when the workflow matrix gives automation and event documentation clear inputs for workflow action, state, approval, retry, recovery, and event handoff boundaries.
