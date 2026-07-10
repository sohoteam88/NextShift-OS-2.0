# NextShift UI Kit v1.0

# UK-004 Information Hierarchy

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-004 Layout Guidelines  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-001 Terminology, UK-002 Decision-First UX, UK-003 Component Catalog  
**Outputs:** Information hierarchy guidance for Workspace layouts  
**Exit Criteria:** Layouts prioritize context, decision, action, and state consistently

## Purpose

This document defines the hierarchy rules that determine what information appears first, second, and later in a NextShift Workspace view.

Information hierarchy is about decision priority. It is not typography, token, or CSS guidance.

## Hierarchy Model

Every Workspace view should order information using this model:

1. Workspace context: where the member is working.
2. View purpose: what this view is for.
3. Current state: what is happening now.
4. Primary decision: what needs judgment.
5. Primary action: what moves work forward.
6. Supporting evidence: why the decision/action matters.
7. Secondary detail: history, reference, advanced options.
8. Recovery or feedback: how to recover from loading, empty, error, or blocked states.

## Decision-First Ordering

Use this question sequence:

1. What Workspace am I in?
2. What object, module, or dashboard am I viewing?
3. What is the current status?
4. What requires attention?
5. What action can I take?
6. What evidence supports that action?
7. What secondary detail can I inspect later?

If a view cannot answer these questions in order, its hierarchy needs revision.

## Dashboard Hierarchy

| Priority | Content |
| --- | --- |
| 1 | Workspace context and dashboard purpose |
| 2 | Highest-priority operational signal |
| 3 | Primary dashboard action or next action |
| 4 | KPI/widget grid |
| 5 | Charts, comparisons, supporting data |
| 6 | Module cards and related capabilities |
| 7 | AI recommendations and secondary guidance |

AI can assist interpretation, but the dashboard still starts with operational status.

## Detail Hierarchy

| Priority | Content |
| --- | --- |
| 1 | Entity identity and status |
| 2 | Summary and primary action |
| 3 | Current detail needed for action |
| 4 | Related records or supporting panels |
| 5 | Activity history |
| 6 | Advanced metadata |

## Form Hierarchy

| Priority | Content |
| --- | --- |
| 1 | Form purpose and expected outcome |
| 2 | Required fields |
| 3 | Field-level guidance |
| 4 | Optional sections |
| 5 | Review/validation |
| 6 | Submit/save action |
| 7 | Cancel/revert action |

## AI Information Hierarchy

AI content should be ordered as:

1. Recommendation or insight.
2. Reasoning summary.
3. Confidence or uncertainty.
4. Action options.
5. Audit or source detail.

Do not show AI reasoning before the recommendation unless the view is explicitly an audit or explanation view.

## Workspace Metadata Hierarchy

When rendering metadata-driven workspace content:

1. Workspace name and active type.
2. Navigation items relevant to the current Workspace.
3. Dashboard widgets ordered by priority.
4. Business capabilities.
5. Templates.
6. AI profile framing.

The structure is shared. Metadata changes the content, not the layout hierarchy.

## Hierarchy Anti-Patterns

- Historical data before current state.
- Multiple primary actions in the same region.
- AI recommendations without confidence or reason.
- Workspace-specific labels without Workspace context.
- Optional filters above critical status.
- Empty states that explain absence but provide no next action.
