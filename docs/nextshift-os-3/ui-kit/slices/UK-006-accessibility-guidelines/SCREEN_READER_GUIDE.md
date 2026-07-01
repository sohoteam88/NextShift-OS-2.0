# NextShift UI Kit v1.0

# UK-006 Screen Reader Guide

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-006 Accessibility Guidelines  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-006 Planning, UK-001 Terminology, UK-002 Accessibility By Default, UK-004 Information Hierarchy, UK-005 Feedback Patterns  
**Outputs:** Screen reader and semantic guidance for Workspace-aware interfaces  
**Exit Criteria:** Screen reader guidance defines identity, role, state, feedback, and reading order without implementation details

## Purpose

This document defines screen reader and semantic expectations for NextShift Workspace surfaces.

It describes what information should be available to assistive technology users. It does not define ARIA implementation, DOM structure, component code, or browser support.

## Screen Reader Principles

| Principle | Rule |
| --- | --- |
| Identify context | Workspace, view, and object identity should be understandable. |
| Expose purpose | Interactive controls should communicate their outcome. |
| Expose state | Selected, expanded, disabled, loading, error, success, and AI states should be understandable. |
| Keep order meaningful | Reading order follows Workspace context, decision, action, feedback, and supporting detail. |
| Pair feedback with recovery | Errors and blocked states explain what happened and what to do next. |

## Workspace Reading Order

Workspace views should communicate:

1. Active Workspace.
2. Current view or module.
3. Current object or dashboard context where applicable.
4. Current state or priority signal.
5. Primary decision or task.
6. Primary action.
7. Required feedback or recovery.
8. Supporting details.

This order mirrors UK-004 information hierarchy and UK-005 interaction patterns.

## Accessible Names

Guidance:

- Actions should be named by outcome.
- Icon-only controls need a documented accessible name expectation.
- Ambiguous labels such as `Submit`, `Continue`, `Manage`, or `OK` should be replaced with outcome-based names where possible.
- Repeated controls should include enough object context to distinguish them.

Examples:

- `Schedule follow-up`
- `Retry import`
- `Dismiss recommendation`
- `Open customer details`

## State Communication

Screen reader-accessible state should distinguish:

- Current Workspace.
- Active view or selected navigation item.
- Selected row, item, tab, option, or filter.
- Expanded or collapsed disclosure.
- Disabled or unavailable action.
- Loading, empty, error, success, or blocked region.
- AI working, accepted, dismissed, low-confidence, or error state.

State should not be communicated by visual tone alone.

## Feedback and Errors

Guidance:

- Error text should identify the affected field, object, region, or action.
- Recovery actions should be discoverable after the error.
- Inline validation should remain close to the affected input.
- Workspace-wide feedback should not obscure local field or action feedback.
- Success feedback should confirm material outcomes without interrupting trivial interactions.

## Tables, Lists, and Dashboards

Guidance:

- Tables and lists should preserve item identity, status, and available action.
- KPI Cards and Widgets should communicate metric meaning, not only numeric value.
- Charts and visualizations should include a textual summary expectation where the data affects decisions.
- Empty states should explain whether absence is true absence or filtered absence.

## AI Output

AI output should communicate:

1. Output type: recommendation, insight, draft, ranking, summary, or assistant response.
2. Reason or evidence where material.
3. Confidence or uncertainty.
4. Available member actions.
5. Resulting state after accept, adjust, dismiss, or retry.

AI content should not be presented as final authority without member action.

## Responsive and Dynamic Content

Guidance:

- Responsive reflow should preserve reading order.
- Loading or refreshed content should not remove context unexpectedly.
- Expanded content should appear in a meaningful reading sequence.
- Hidden compact navigation must still have a discoverable path.

## Non-Goals

- No ARIA syntax.
- No DOM implementation.
- No screen reader vendor-specific behavior.
- No component code.
- No automated accessibility testing implementation.

## Status

Implemented.
