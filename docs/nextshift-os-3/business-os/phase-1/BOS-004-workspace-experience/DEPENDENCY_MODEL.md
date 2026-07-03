# BOS-004 Dependency Model

## Purpose

This document defines the dependency model for Workspace Experience.

## Dependency Principle

Workspace Experience must operate from documented business, decision, workflow, user, and session context. It cannot provide a coherent workspace model without the upstream capability context established by BOS-001, BOS-002, and BOS-003.

## Dependency Chain

```text
BOS-001 Business Foundation
  -> BOS-002 Decision Intelligence
  -> BOS-003 AI Workflow
  -> BOS-004 Workspace Experience
  -> BOS-005 Business Automation
  -> BOS-006 Business Memory
```

## Dependency Roles

| Dependency | Provides | Consumed By |
| --- | --- | --- |
| BOS-001 Business Foundation | Business profile, CRM, content, campaign, forecast, analytics, and business brain context | BOS-004 Workspace Context |
| BOS-002 Decision Intelligence | Recommended action, rationale, priority, opportunity context, and decision policy boundary | BOS-004 Workspace Context and Workspace Composition |
| BOS-003 AI Workflow | Workflow plan, lifecycle state, approval checkpoints, retry, recovery, and event handoff expectations | BOS-004 Session Recovery and Workspace Composition |
| Workspace Runtime | Active workspace container boundary | Workspace Context, Workspace Switching, Session Recovery |
| Workspace Context | Shared active context model | Personalization, Workspace Switching, Session Recovery, Business Automation |
| Workspace Switching | Multi-workspace transition expectations | Session Recovery and Workspace Memory |
| Session Recovery | Restoration expectations for interrupted workspace sessions | Workspace Runtime, Workspace Memory, AI Workflow |
| Personalization | Member and business adaptation boundaries | Workspace Runtime and Workspace Context |
| Workspace Memory | Continuity signals and memory handoff boundaries | BOS-006 Business Memory |

## Downstream Dependencies

BOS-005 Business Automation depends on BOS-004 for:

- Active workspace context
- Workspace-originated action context
- Session state expectations
- Human workspace handoff boundaries
- Workflow visibility expectations

BOS-006 Business Memory depends on BOS-004 for:

- Workspace memory boundaries
- Session continuity signals
- Personalization context
- Workspace switching context
- Recovery context

## Boundary

This dependency model is documentation-only. It does not introduce dependency injection, package dependencies, runtime wiring, storage contracts, memory schemas, session persistence, UI state management, event contracts, database relationships, queues, background jobs, or API requirements.
