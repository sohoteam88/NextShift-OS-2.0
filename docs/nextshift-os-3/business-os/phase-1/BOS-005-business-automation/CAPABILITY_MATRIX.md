# BOS-005 Capability Matrix

## Purpose

This matrix maps Business Automation capabilities to their Business OS role, source context, and documentation purpose.

## Matrix

| Capability | Business OS Role | Source Context | BOS-005 Use |
| --- | --- | --- | --- |
| Scheduler | Time and recurrence boundary | Workflow plan, automation policy, and future runtime schedule needs | Defines when automation may run or recur. |
| Trigger Engine | Condition and event intake boundary | Workflow state, workspace context, and future event signals | Defines documented conditions that can start, pause, resume, or stop automation. |
| Rule Engine | Business guardrail boundary | Decision policies, workflow approvals, member/business context, and automation governance | Defines eligibility, restriction, escalation, and policy boundaries. |
| Automation Pipeline | Ordered automation execution model | Approved workflow intent and workspace-aware action context | Defines how business actions are sequenced before runtime automation exists. |
| Background Jobs | Deferred work boundary | Long-running, asynchronous, retryable, or scheduled automation expectations | Defines future worker and job expectations without implementing them. |
| Automation Governance | Control and accountability boundary | Human approval, auditability, ownership, retry, pause, cancellation, and policy context | Defines how automation remains governable and reviewable. |
| Workflow-to-Automation Handoff | Workflow execution transition boundary | BOS-003 workflow plan, lifecycle state, approval checkpoints, retry, and recovery expectations | Defines when a workflow can become an automation candidate. |
| Workspace-aware Automation Context | Workspace continuity boundary | BOS-004 active workspace context, session state, and handoff expectations | Defines how automation context remains visible and recoverable in the workspace. |

## Consolidation Rule

BOS-005 may reference planned or existing workflow, workspace, memory, event, rule, schedule, trigger, and job concepts, but it must not change lifecycle truth recorded by AI Workflow, Workspace Experience, Business Memory, Event Platform, or capability owners.

## Readiness for Downstream Capabilities

BOS-005 is ready for BOS-006 and BOS-007 when the automation matrix gives memory and event documentation clear inputs for automation context, governance, scheduling, triggering, rules, pipeline state, background work, and event-readiness boundaries.
