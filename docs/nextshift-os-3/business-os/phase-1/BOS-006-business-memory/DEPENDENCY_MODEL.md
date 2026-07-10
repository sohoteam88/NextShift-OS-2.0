# BOS-006 Dependency Model

## Purpose

This document defines the dependency model for Business Memory.

## Dependency Principle

Business Memory must operate from documented business, workflow, workspace, and automation context. It cannot govern or expose persistent memory safely without source boundaries from upstream Business OS capabilities.

## Dependency Chain

```text
BOS-001 Business Foundation
  -> BOS-002 Decision Intelligence
  -> BOS-003 AI Workflow
  -> BOS-004 Workspace Experience
  -> BOS-005 Business Automation
  -> BOS-006 Business Memory
  -> BOS-007 Event Platform
  -> BOS-008 Business OS Integration
```

## Dependency Roles

| Dependency | Provides | Consumed By |
| --- | --- | --- |
| BOS-001 Business Foundation | Business profile, CRM, content, campaign, forecast, analytics, and business brain context | Business Memory, Customer Memory, Brand Memory |
| BOS-002 Decision Intelligence | Recommended action, rationale, priority, opportunity context, and policy boundaries | Business Memory and future learning context |
| BOS-003 AI Workflow | Workflow plans, approval checkpoints, retry, recovery, completion, and failure context | Workflow Memory |
| BOS-004 Workspace Experience | Session state, switching, personalization, recovery, and active workspace context | Workspace Memory |
| BOS-005 Business Automation | Automation context, history, governance signals, background job context, and recovery context | Automation Memory and Memory Governance |
| Memory Governance | Ownership, retention, correction, auditability, and source-of-truth boundaries | All memory capabilities |
| BOS-007 Event Platform | Future event publication and consumption model | Event Platform Readiness |

## Downstream Dependencies

BOS-007 Event Platform depends on BOS-006 for:

- Memory state signals
- Memory governance signals
- Memory change boundaries
- Retention and correction signals
- Cross-capability memory event context

BOS-008 Business OS Integration depends on BOS-006 for:

- Shared memory boundaries
- Cross-capability memory context
- Memory ownership and governance expectations
- Integration-ready business, customer, brand, workflow, workspace, and automation memory context

## Boundary

This dependency model is documentation-only. It does not introduce dependency injection, package dependencies, runtime wiring, storage contracts, vector schemas, retention jobs, memory services, event contracts, database relationships, queues, background jobs, or API requirements.
