# NextShift UI Kit v1.0

# UK-007 Logo and Identity

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-007 Theme & Branding Guide  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-007 Planning, UK-001 Terminology, UK-004 Workspace Layouts, UK-006 Accessibility Guidelines  
**Outputs:** Logo and identity usage guidance for Workspace-aware surfaces  
**Exit Criteria:** Logo and identity guidance clarifies hierarchy without defining assets or implementation

## Purpose

This document defines how logo and identity elements should be described and applied in NextShift product surfaces.

It does not create logo files, define clear-space measurements, specify asset formats, or implement UI rendering.

## Identity Hierarchy

Use this order:

1. NextShift platform identity.
2. Active Workspace identity.
3. Module or capability identity.
4. Entity or record identity.
5. Supporting visual asset.

The hierarchy protects orientation. Workspace or module identity must not visually overpower the current task or state.

## Platform Identity

Guidance:

- Platform identity should remain stable across Workspaces.
- Platform identity belongs in global shell, authentication, product-level settings, and system-level surfaces.
- Platform identity should not be repeated excessively inside every card, panel, or widget.
- Platform identity must not replace current Workspace context where Workspace-scoped actions are present.

## Workspace Identity

Guidance:

- Workspace identity should be visible in Workspace Header, Workspace Switcher, context bars, and Workspace-scoped settings.
- Workspace identity can include name, type, icon, label, or approved visual marker.
- Workspace identity should be metadata-driven rather than hardcoded per Workspace type.
- Workspace identity should remain accessible in compact layouts.

## Module and Capability Identity

Guidance:

- Module identity helps members understand which bounded area they are using.
- Module branding should remain secondary to Workspace context and current state.
- Module identity can appear in headers, module cards, navigation items, or onboarding flows.
- Module identity should not introduce a separate visual system.

## Logo Usage In Product UI

Use logos for:

- Product identification.
- Workspace identification where approved.
- Module or capability recognition where useful.
- Empty or onboarding state orientation when it clarifies the task.

Avoid logos for:

- Decorative repetition.
- State communication.
- Primary action emphasis.
- Replacing labels.
- Creating Workspace-specific shells.

## Identity Accessibility

- Logo-only identity should have an accessible name expectation.
- Workspace identity should not rely on logo shape or color alone.
- If a logo appears with a Workspace action, the action label still needs outcome-based text.
- Compact layouts must preserve enough identity for orientation.

## AI Design Guidance

```text
Identity level:
Platform identity:
Workspace identity:
Module identity:
Where identity appears:
Accessible name expectation:
Do not create or alter logo assets.
Do not replace labels with logos.
```

## Non-Goals

- No logo design.
- No asset export rules.
- No clear-space measurements.
- No typography or token values.
- No runtime branding logic.

## Status

Implemented.
