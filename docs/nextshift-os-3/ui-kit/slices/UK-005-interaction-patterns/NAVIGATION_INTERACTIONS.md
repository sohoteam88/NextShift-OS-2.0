# NextShift UI Kit v1.0

# UK-005 Navigation Interactions

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-005 Interaction Patterns  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-005 Planning, UK-001 Terminology, UK-003 Workspace Components, UK-004 Layout Guidelines  
**Outputs:** Navigation interaction guidance for Workspace-aware interfaces  
**Exit Criteria:** Navigation interactions distinguish Workspace context, view movement, and local disclosure without routing implementation

## Purpose

This document defines interaction guidance for navigating NextShift Workspace interfaces.

Navigation interactions help members move between Workspaces, views, sections, and local details while preserving orientation. This document does not define routing architecture, URL schemes, application state management, or component implementation.

## Navigation Layers

| Layer | Purpose | Interaction Meaning |
| --- | --- | --- |
| Workspace switch | Change active business context | The member is now operating in a different Workspace. |
| Global navigation | Move between major platform areas | The member changes product area. |
| Workspace navigation | Move between modules in the active Workspace | The member changes view within the same Workspace. |
| View navigation | Move within a flow or detail structure | The member changes the current task surface. |
| Local disclosure | Reveal detail without leaving context | The member stays in place and expands supporting information. |

Workspace switching and navigation must remain distinct.

## Workspace Switcher Interaction

The Workspace Switcher changes context.

Guidance:

- Show the active Workspace before and after the switch.
- Show available Workspaces in a stable order.
- Indicate unavailable Workspaces only when the member needs to understand access or setup state.
- Avoid switching Workspaces as a side effect of ordinary navigation.
- Preserve the shared Workspace Shell.

The switcher is not a filter, tab set, or view-level segmented control.

## Workspace Navigation

Workspace navigation moves between modules or views inside the active Workspace.

Guidance:

- Show the active navigation item.
- Use labels from Workspace metadata where applicable.
- Keep navigation structure consistent across Workspace types.
- Preserve member orientation when a module has empty, loading, or error state.
- Do not hardcode a separate navigation model per Workspace.

## Breadcrumbs

Use breadcrumbs when the member needs object hierarchy or return context.

Guidance:

- Breadcrumbs should show meaningful hierarchy, not every click.
- Use object names and view labels from approved terminology.
- Keep breadcrumbs secondary to the current view title and primary action.
- Do not use breadcrumbs as the only way to recover from a flow.

## Tabs

Use tabs to switch between sibling views or sections of the same object or module.

Guidance:

- Tabs should not change Workspace context.
- Show selected state clearly.
- Keep tab labels stable and short.
- Do not hide critical error or required action inside an unmarked tab.

## Menus

Use menus for secondary, contextual, or less frequent actions.

Guidance:

- Do not place the only primary action in a menu unless space or platform convention requires it.
- Keep destructive actions visually and semantically distinct.
- Group related actions.
- Avoid using menus for navigation when persistent navigation is required.

## Search and Command Entry

Use search to find content and command entry to trigger known actions.

Guidance:

- Search results should stay scoped to the visible context unless broader scope is explicit.
- Command options should use outcome-based labels.
- Empty results should provide a recovery path.
- AI-assisted search or command suggestions must show confidence or reason when material.

## Flow Navigation

Use step movement when a task requires ordered progression.

Guidance:

- Show current step when flow length matters.
- Allow review before completion for material changes.
- Preserve input when moving backward.
- Explain why a next step is unavailable.
- Keep cancellation or exit available where safe.

## Responsive Navigation

Responsive navigation should preserve:

- Active Workspace context
- Current view identity
- Primary action access
- Selected navigation state
- Feedback and recovery visibility

Compact layouts may change presentation, but they should not change the meaning of navigation.

## Navigation Feedback

Navigation interactions should show:

- Active state for selected view or section.
- Loading state when destination content is pending.
- Empty or error state inside the destination region when needed.
- Recovery if the destination cannot be shown.

## Anti-Confusion Rules

- Do not use tabs to switch Workspaces.
- Do not use filters as navigation.
- Do not use navigation to silently trigger destructive actions.
- Do not collapse Workspace identity on compact layouts.
- Do not make AI recommendations appear as navigation unless they actually move the member to a destination.

## Non-Goals

- No route definitions.
- No URL patterns.
- No navigation component implementation.
- No authorization or visibility implementation.
- No persistence of navigation state.

## Status

Implemented.
