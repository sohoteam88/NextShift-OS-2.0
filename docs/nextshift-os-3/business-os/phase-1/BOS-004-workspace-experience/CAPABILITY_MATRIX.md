# BOS-004 Capability Matrix

## Purpose

This matrix maps Workspace Experience capabilities to their Business OS role, source context, and documentation purpose.

## Matrix

| Capability | Business OS Role | Source Context | BOS-004 Use |
| --- | --- | --- | --- |
| Workspace Runtime | Active work container | Business OS Phase 1 capability model | Defines how Business OS work is represented as a unified workspace. |
| Workspace Context | Shared context boundary | BOS-001 business context, BOS-002 decision context, BOS-003 workflow context | Defines which context must be available to the active workspace. |
| Workspace Switching | Multi-workspace continuity boundary | Business identity, workspace context, and session state | Defines expectations for switching between workspaces without losing active context. |
| Session Recovery | Interrupted-work recovery boundary | Workspace runtime, workflow state, and workspace memory | Defines how a resumed session should restore useful workspace state. |
| Personalization | Member and business adaptation boundary | Identity, business profile, preferences, and workspace usage context | Defines how the workspace may adapt without changing source-of-truth records. |
| Workspace Memory | Context continuity boundary | BOS-006 Business Memory and workspace session history | Defines what memory signals later memory implementation must consume. |
| Workspace Composition | Unified experience boundary | BOS-001 through BOS-008 | Defines how Business OS capabilities are presented as one workspace experience. |

## Consolidation Rule

BOS-004 may reference planned or existing workspace, identity, workflow, automation, memory, and event concepts, but it must not change lifecycle truth recorded by Business Foundation, Decision Intelligence, AI Workflow, Business Automation, Business Memory, Event Platform, or capability owners.

## Readiness for Downstream Capabilities

BOS-004 is ready for BOS-005 and BOS-006 when the workspace matrix gives automation and memory documentation clear inputs for active workspace context, switching, session recovery, personalization, and memory handoff boundaries.
