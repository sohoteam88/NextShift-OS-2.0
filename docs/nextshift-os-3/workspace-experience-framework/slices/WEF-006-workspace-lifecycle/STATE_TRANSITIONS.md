# Workspace Experience Framework (WEF) v1.0

# WEF-006 State Transitions

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex

**Project:** Workspace Experience Framework (WEF) v1.0  
**Slice:** WEF-006 Workspace Lifecycle  
**Lifecycle Phase:** Documentation Implementation

## Purpose

This document defines valid Workspace Lifecycle state transitions.

## Transition Principle

Workspace state transitions must be explicit, directional, and recoverable. A Workspace must not silently move into a state that changes member access, capability availability, or Workspace Switching eligibility.

## Standard Transition Path

The standard lifecycle path is:

Planned -> Provisioning -> Active -> Suspended -> Archived -> Removed

This path represents a normal Workspace lifespan from definition through retirement.

## Recovery Transition Path

The recovery path is:

Active -> Degraded -> Recovering -> Active

or:

Active -> Degraded -> Suspended -> Recovering -> Active

This path represents an interrupted or unsafe Workspace that must be restored before normal operation resumes.

## Allowed Transitions

| From | To | Requirement |
| --- | --- | --- |
| Planned | Provisioning | Workspace setup begins. |
| Provisioning | Active | Workspace is ready for member operation. |
| Provisioning | Suspended | Provisioning cannot safely complete. |
| Active | Degraded | Workspace remains usable with constraints. |
| Active | Suspended | Workspace operation must pause. |
| Active | Archived | Workspace is retired from normal operation. |
| Degraded | Active | Normal availability is restored. |
| Degraded | Recovering | Repair or state restoration begins. |
| Degraded | Suspended | Continued operation is unsafe. |
| Suspended | Recovering | Workspace restoration begins. |
| Suspended | Active | Workspace is safely restored without separate recovery state. |
| Suspended | Archived | Workspace is retired while unavailable. |
| Recovering | Active | Recovery completes successfully. |
| Recovering | Suspended | Recovery cannot safely complete. |
| Archived | Removed | Workspace is permanently removed as an operating context. |

## Disallowed Transitions

- Removed -> Active
- Removed -> Recovering
- Archived -> Active without a separate approved restoration process
- Planned -> Active without provisioning
- Degraded -> Removed without suspension or archival governance
- Any transition that bypasses permission, ownership, or lifecycle validation

## Transition Requirements

Every lifecycle transition must define:

- Source state
- Target state
- Trigger
- Eligibility condition
- Member-facing impact
- Shell impact
- Navigation impact
- Context impact
- Switching impact
- Recovery path when transition fails

## Switching Relationship

WEF-005 Workspace Switching must evaluate target lifecycle state before activation. A member must not switch into a Workspace state that cannot safely support operation.

## Transition Rule

Lifecycle transitions must never leave a Workspace in an ambiguous state between available, unavailable, and recoverable.
