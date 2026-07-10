# BOS-005 Business Automation

Version: v1.0
Status: Released

## Purpose

BOS-005 Business Automation defines the documentation foundation for governed automation inside Business OS Phase 1.

This capability converts workflow plans and workspace context into documented automation boundaries for scheduling, triggers, rules, pipelines, background jobs, and automation governance before runtime implementation begins.

## Scope

BOS-005 covers:

- Scheduler
- Trigger Engine
- Rule Engine
- Automation Pipeline
- Background Jobs
- Automation Governance
- Workflow-to-Automation handoff
- Workspace-aware automation context

## Documentation Set

- [Planning](PLANNING.md)
- [Documentation Implementation Contract](DOCUMENTATION_IMPLEMENTATION_CONTRACT.md)
- [Execution Task](EXECUTION_TASK.md)
- [Architecture](ARCHITECTURE.md)
- [Capability Matrix](CAPABILITY_MATRIX.md)
- [Dependency Model](DEPENDENCY_MODEL.md)
- [Implementation Status](IMPLEMENTATION_STATUS.md)
- [Requirements Verification](REQUIREMENTS_VERIFICATION.md)
- [Audit Report](AUDIT_REPORT.md)
- [Release Decision](RELEASE_DECISION.md)
- [Release Notes](RELEASE_NOTES.md)
- [Next Phase Handoff](NEXT_PHASE_HANDOFF.md)

## Foundation Rule

BOS-005 depends on BOS-003 for workflow plans, lifecycle states, approval checkpoints, retry, recovery, and event handoff expectations. It depends on BOS-004 for active workspace context, session continuity, workspace-originated action context, and human workspace handoff boundaries.

BOS-005 must not replace workflow lifecycle truth, workspace lifecycle truth, source business records, memory records, or event records.

## Downstream Handoff

BOS-005 prepares BOS-006 Business Memory and BOS-007 Event Platform by defining automation context, governance boundaries, background work expectations, and event-readiness signals that later capabilities can consume.

## Next Phase

BOS-006 Business Memory.
