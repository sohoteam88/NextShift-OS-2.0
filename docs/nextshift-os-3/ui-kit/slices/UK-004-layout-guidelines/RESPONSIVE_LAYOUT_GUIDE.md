# NextShift UI Kit v1.0

# UK-004 Responsive Layout Guide

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-004 Layout Guidelines  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-004 Planning, UK-002 Responsive-First Thinking, UK-003 Component Catalog  
**Outputs:** Responsive layout guidance for Workspace-aware interfaces  
**Exit Criteria:** Responsive rules preserve hierarchy, context, and action access

## Purpose

This document defines responsive layout guidance for NextShift Workspace surfaces.

Responsive guidance describes how layout priority changes across viewport sizes. It does not define CSS breakpoints, implementation code, or Design System token values.

## Responsive Principles

| Principle | Rule |
| --- | --- |
| Preserve context | Workspace identity and current view context stay available. |
| Preserve primary action | The main action remains reachable without hunting. |
| Preserve hierarchy | Reflow must not change what is most important. |
| Preserve state | Loading, empty, error, success, selected, and disabled states remain visible. |
| Reduce columns before hiding content | Prefer stacking or disclosure before removing important information. |

## Viewport Behavior Model

| Viewport class | Layout behavior |
| --- | --- |
| Compact | Stack regions vertically; keep context and primary action visible; use disclosure for secondary detail. |
| Medium | Use two-region layouts only when the primary task remains clear. |
| Wide | Use multi-column layouts for scanning, comparison, and supporting context. |

Viewport classes are conceptual. Implementation breakpoints remain owned by the Design System and application layer.

## Responsive Region Priority

When a layout compresses, preserve this order:

1. Workspace identity and current view context.
2. Primary decision or task.
3. Primary action.
4. Required status or feedback.
5. Supporting detail.
6. Historical or reference content.
7. Secondary actions.

## Dashboard Reflow

Wide:

```text
Context row
Priority widgets | Secondary widgets
Charts / comparisons
Module grid
AI panel
```

Compact:

```text
Context
Priority widget
Primary action
Remaining widgets
Charts / comparisons
Modules
AI panel
```

Rules:

- The first decision signal remains first.
- Dashboard widgets stack by priority, not by source order alone.
- Chart detail may move below KPI summaries.
- Empty states remain attached to their region.

## Detail View Reflow

Wide:

```text
Summary | Supporting panel
Main detail
Activity history
```

Compact:

```text
Summary
Primary action
Main detail
Supporting panel
Activity history
```

Rules:

- Entity identity and status remain first.
- Supporting panels do not precede the main detail.
- Activity history can move lower.

## Split View Reflow

Wide:

```text
List / table | Detail panel
```

Compact:

```text
List / table
Selected detail as focused region or next step
```

Rules:

- Selection state must remain visible.
- Detail actions are not shown without selected context.
- If the detail becomes a separate step, provide a clear way back to the list.

## Form Reflow

Rules:

- Labels stay attached to fields.
- Error messages stay near affected fields.
- Required fields remain before optional fields.
- Action rows remain reachable after review.
- Multi-column forms collapse to a single decision sequence.

## Navigation Reflow

Rules:

- Active destination remains visible or clearly represented.
- Workspace switching and navigation remain distinct.
- Overflow navigation uses a shared Menu or Command Entry pattern from UK-003.
- Do not drop navigation items without an alternate path.

## Responsive Anti-Patterns

- Hiding the primary action on compact viewports.
- Reordering content so supporting detail appears before current status.
- Removing empty/error states to save space.
- Using compact layouts that depend only on icons without accessible labels.
- Creating separate mobile-only page structures that do not match the shared template.
