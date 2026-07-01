# NextShift UI Kit v1.0

# UK-006 Keyboard Navigation

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-006 Accessibility Guidelines  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-006 Planning, UK-002 Accessibility By Default, UK-003 Component States and Variants, UK-005 Navigation Interactions  
**Outputs:** Keyboard navigation guidance for Workspace-aware interfaces  
**Exit Criteria:** Keyboard expectations preserve context, focus, action access, and recovery without implementation details

## Purpose

This document defines keyboard navigation expectations for NextShift Workspace surfaces.

Keyboard guidance describes the intended focus path, interaction parity, and escape/recovery expectations. It does not define event handlers, ARIA attributes, component code, browser behavior, or shortcut implementation.

## Core Rules

| Rule | Meaning |
| --- | --- |
| Visible focus | The currently focused item must be apparent. |
| Logical order | Focus follows the visual and task hierarchy. |
| No keyboard traps | Members can leave modals, panels, menus, and flows using expected controls. |
| Action parity | Critical pointer actions have keyboard-accessible alternatives. |
| Context preservation | Workspace identity, current view, and selected object remain understandable. |
| Recovery access | Error, cancel, retry, dismiss, and back actions are reachable by keyboard. |

## Focus Order Model

Workspace surfaces should follow this conceptual order:

1. Workspace shell and skip/access point where applicable.
2. Workspace identity and switcher.
3. View title and current state.
4. Primary content or task region.
5. Primary action.
6. Required feedback or validation.
7. Supporting panels and secondary actions.
8. Navigation or recovery controls.

Exact implementation remains owned by the Design System and application layer.

## Workspace Switcher

Guidance:

- The active Workspace should be identifiable.
- Available Workspace options should be reachable without relying on pointer hover.
- Switching Workspace should not leave focus in an obsolete region.
- Disabled or unavailable Workspaces should expose why they are unavailable when the reason matters.

## Navigation

Guidance:

- Active navigation state should be clear.
- Tabs, menus, breadcrumbs, command entry, and Workspace navigation should each preserve their distinct meaning.
- Navigation should not trigger destructive actions.
- Compact navigation should not remove the keyboard path to hidden destinations.

## Forms

Guidance:

- Required fields appear before optional fields where the flow depends on them.
- Labels remain associated with inputs at the documentation level.
- Validation feedback should be reachable after the affected field.
- Primary action should be reachable after review.
- Cancel, back, or revert actions should be reachable where the flow supports them.

## Tables and Lists

Guidance:

- Row selection state should be understandable.
- Bulk actions should be reachable only when valid selection exists.
- Sorting and filtering controls should be reachable before their affected region when they are primary for the task.
- Empty and error states should remain keyboard-recoverable.

## Modals, Panels, and Disclosure

Guidance:

- Opening a modal, panel, menu, or disclosure should preserve member orientation.
- Expanded and collapsed states should be clear.
- Close, cancel, or back controls should be reachable.
- Critical content should not be hidden behind hover-only disclosure.
- Focus should not move unpredictably when a region loads or changes state.

## AI Interactions

Guidance:

- AI recommendations should expose accept, adjust, dismiss, regenerate, and inspect actions where relevant.
- AI working, low-confidence, error, accepted, and dismissed states should be reachable and understandable.
- AI output should not silently complete material business actions through keyboard shortcuts or hidden commands.

## Responsive Keyboard Guidance

- Compact layouts must preserve focus order.
- Collapsed navigation should still expose a keyboard path.
- Stacked regions should follow the same priority order defined in UK-004.
- Touch-friendly layouts must not remove keyboard accessibility.

## Review Checklist

- Is focus visible?
- Does focus order match the task hierarchy?
- Can every primary action be reached by keyboard?
- Can members escape modal, panel, menu, or disclosure contexts?
- Are disabled, selected, loading, error, and expanded states understandable?
- Is Workspace identity preserved during keyboard navigation?
- Are recovery actions reachable?

## Non-Goals

- No keyboard event implementation.
- No shortcut definitions.
- No ARIA attribute implementation.
- No component code.
- No browser-specific behavior.

## Status

Implemented.
