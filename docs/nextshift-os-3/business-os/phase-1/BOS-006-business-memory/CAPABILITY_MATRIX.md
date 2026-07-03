# BOS-006 Capability Matrix

## Purpose

This matrix maps Business Memory capabilities to their Business OS role, source context, and documentation purpose.

## Matrix

| Capability | Business OS Role | Source Context | BOS-006 Use |
| --- | --- | --- | --- |
| Business Memory | Persistent business knowledge boundary | Business profile, operations, decisions, workflows, and automation context | Defines reusable business context without replacing source records. |
| Customer Memory | Customer relationship memory boundary | CRM, interactions, preferences, history, segmentation, and customer context | Defines what customer knowledge may be remembered and governed. |
| Brand Memory | Brand identity and expression memory boundary | Business profile, content, campaigns, positioning, voice, and offers | Defines persistent brand knowledge for future AI-assisted work. |
| Workflow Memory | Workflow learning and continuity boundary | Workflow plans, approvals, retries, recovery, completion, and failure outcomes | Defines memory signals created by workflow execution history. |
| Workspace Memory | Workspace continuity boundary | Workspace sessions, switching, personalization, recovery, and active context | Defines memory signals created by workspace use. |
| Automation Memory | Automation history and governance boundary | Scheduler, triggers, rules, automation pipeline, background jobs, approvals, and recovery | Defines memory signals created by automated business work. |
| Memory Governance | Control and trust boundary | Ownership, retention, privacy, correction, auditability, and source-of-truth constraints | Defines how remembered knowledge remains governed. |
| Event Platform Readiness | Event handoff boundary | Memory changes, state changes, retention signals, and governance signals | Defines what future event documentation can consume from memory. |

## Consolidation Rule

BOS-006 may reference planned or existing business, customer, brand, workflow, workspace, automation, memory, and event concepts, but it must not change lifecycle truth recorded by those capabilities or their source records.

## Readiness for Downstream Capabilities

BOS-006 is ready for BOS-007 and BOS-008 when the memory matrix gives event and integration documentation clear inputs for memory context, ownership, governance, retention, correction, memory signals, and cross-capability integration boundaries.
