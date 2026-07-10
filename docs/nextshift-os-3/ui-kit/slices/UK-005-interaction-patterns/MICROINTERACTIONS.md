# NextShift UI Kit v1.0

# UK-005 Microinteractions

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-005 Interaction Patterns  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-005 Planning, UK-002 Trustworthy Interaction, UK-003 Component States and Variants, UK-004 Layout Guidelines  
**Outputs:** Microinteraction guidance for Workspace-aware surfaces  
**Exit Criteria:** Microinteractions clarify state, feedback, and control without implementation details

## Purpose

This document defines microinteraction guidance for NextShift interfaces.

Microinteractions are small state and feedback changes that help members understand whether an element is interactive, focused, selected, working, expanded, collapsed, accepted, dismissed, or unavailable. This document does not define animation curves, CSS transitions, code, or Design System implementation details.

## Microinteraction Principles

| Principle | Rule |
| --- | --- |
| Communicate state | Microinteractions exist to clarify state and consequence. |
| Support control | Members should understand what can be acted on. |
| Preserve orientation | State changes should not disorient or move content unexpectedly. |
| Avoid decoration-only motion | Motion or emphasis should serve feedback, hierarchy, or transition clarity. |
| Remain accessible | State must not depend on color, motion, or hover alone. |

## Standard Microinteraction States

### Hover

Use to indicate pointer availability.

Guidance:

- Hover should clarify interactivity.
- Hover must not reveal critical information that keyboard or touch users cannot access.
- Hover should not change layout dimensions.

### Focus

Use to indicate keyboard or assistive technology focus.

Guidance:

- Focus state must be visible.
- Focus order should follow visual and task order.
- Focus should stay within active modal, panel, or flow context where applicable.

### Active

Use when a member is pressing or engaging an interactive target.

Guidance:

- Active state should confirm the action target.
- Active state should be brief and not replace loading state for async work.

### Disabled

Use when an action or option is unavailable.

Guidance:

- Disable only when interaction is truly unavailable.
- Explain why an action is unavailable when the reason is not obvious.
- Avoid disabling a primary action without visible validation or requirement guidance.

### Loading

Use when work is in progress.

Guidance:

- Loading should preserve the member's context.
- Loading should identify the affected region where multiple regions exist.
- Loading should prevent duplicate risky action where required.

### Selected

Use when an item, tab, option, row, filter, or Workspace is chosen.

Guidance:

- Selected state should be persistent until the member changes or clears it.
- Selection should remain clear after filtering, sorting, or responsive reflow.
- Multi-select should show count and available bulk actions.

### Expanded and Collapsed

Use when details are disclosed or hidden.

Guidance:

- The control should indicate current disclosure state.
- Expanded content should appear close to its trigger or in a clearly connected panel.
- Collapsing should not hide errors, blockers, or required actions.

### Accepted and Dismissed

Use for AI recommendations, requests, alerts, prompts, or review items.

Guidance:

- Accepted state should show what changed or what will happen next.
- Dismissed state should be clear without implying completion.
- Dismissed AI output should not remove required business alerts unless the dismissal is itself the intended action.

## Interaction Feedback Matrix

| Interaction | Required Microinteraction |
| --- | --- |
| Button action | hover, focus, active, loading when async |
| Menu item | hover, focus, selected where applicable |
| Tab | focus, selected |
| Workspace switch | selected active Workspace, loading or transition feedback where needed |
| Table row selection | hover where interactive, focus, selected |
| Disclosure | expanded/collapsed state |
| Destructive action | focus, confirmation, completion or cancellation feedback |
| AI recommendation | working, accepted, dismissed, error or low-confidence state |

## Responsive Guidance

- Microinteractions should not depend on hover alone.
- Touch and keyboard states must remain understandable.
- Compact layouts should preserve focus, selection, and expanded state visibility.
- State changes should not resize controls unpredictably.

## AI and QA Usage

For AI-generated design or QA review, describe microinteractions using:

```text
Element:
Interactive states:
Feedback state:
Selected or expanded behavior:
Disabled behavior:
Recovery behavior:
Accessibility note:
```

## Anti-Patterns

- Hover-only disclosure of critical actions.
- Loading states that remove Workspace or object identity.
- Disabled actions with no visible reason.
- Selection state that disappears after sorting or filtering.
- Microinteractions used only as decoration.
- Motion that obscures state, action, or feedback.

## Non-Goals

- No animation specifications.
- No CSS or transition values.
- No component implementation.
- No browser event handling.
- No motion design token definitions.

## Status

Implemented.
