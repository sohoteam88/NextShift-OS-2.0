# NextShift UI Kit v1.0

# UK-007 Workspace Branding

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-007 Theme & Branding Guide  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-007 Planning, UK-004 Workspace Layouts, UK-005 Interaction Patterns, UK-006 Accessibility Guidelines  
**Outputs:** Workspace-aware branding guidance for shared NextShift surfaces  
**Exit Criteria:** Workspace branding guidance supports current and future Workspaces without visual or implementation forks

## Purpose

This document defines how Workspace branding should be applied across NextShift product surfaces.

Workspace branding clarifies business context. It must not create per-Workspace visual systems, shell forks, component forks, or runtime rules.

## Workspace Branding Model

Workspace branding may include:

- Workspace name.
- Workspace type.
- Workspace icon or marker.
- Workspace accent.
- Module labels.
- Approved supporting imagery.
- Contextual empty-state or onboarding assets.

These elements should be derived from Workspace metadata or approved design guidance, not hardcoded into separate UI families.

## Shared Workspace Rules

- Retail, Recruitment, Admin, and future Workspaces use the same product theme system.
- Workspace branding changes content and identity, not component contracts.
- The Workspace Shell remains shared.
- Workspace branding must preserve navigation, focus, feedback, and state consistency.
- A new Business OS should be added through metadata and approved branding guidance, not a new theme architecture.

## Branding By Region

| Region | Branding Guidance |
| --- | --- |
| Workspace Header | Show active Workspace identity and optional approved marker. |
| Workspace Switcher | Show current Workspace and available Workspace identities. |
| Context Bar | Reinforce current Workspace and view scope where needed. |
| Dashboard | Use Workspace identity to frame metrics and modules. |
| Module Cards | Use module identity without creating separate component styling. |
| Detail Views | Entity status and action remain more important than decorative brand elements. |
| Empty States | Brand or Workspace imagery may support orientation when paired with next action. |

## Retail and Recruitment Examples

Retail:

- Workspace identity may reference store, inventory, revenue, customer, or campaign context.
- Branding supports operational clarity; it does not create a Retail-only shell.

Recruitment:

- Workspace identity may reference hiring pipeline, candidates, roles, or client context.
- Branding supports context; it does not create a Recruitment-only component system.

These examples illustrate metadata and content differences, not implementation differences.

## Workspace Brand Accessibility

- Workspace identity should not rely on color or logo alone.
- Workspace name or label should remain available in compact layouts.
- Workspace accent must not override warning, error, success, or disabled states.
- Workspace branding must not reduce contrast intent.

## AI Design Guidance

```text
Workspace:
Workspace type:
Workspace identity elements:
Shared shell:
Allowed brand accents:
State and accessibility constraints:
Anti-fork rule: do not create a Workspace-specific shell, component library, or token set.
```

## Anti-Fork Rule

Do not create:

- Retail theme system.
- Recruitment theme system.
- Admin-only shell brand system.
- Workspace-specific component styling.
- Business OS-specific token sets.

Use shared theme and branding guidance with Workspace-specific metadata.

## Non-Goals

- No runtime Workspace registry design.
- No theme token implementation.
- No Workspace-specific component code.
- No brand asset generation.
- No business workflow branding.

## Status

Implemented.
