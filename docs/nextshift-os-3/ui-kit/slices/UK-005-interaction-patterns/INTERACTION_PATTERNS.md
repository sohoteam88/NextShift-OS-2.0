# NextShift UI Kit v1.0

# UK-005 Interaction Patterns

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-005 Interaction Patterns  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-005 Planning, UK-005 Documentation Implementation Contract, STD-001 through STD-004, UK-001, UK-002, UK-003, UK-004  
**Outputs:** Reusable interaction pattern guidance for Workspace-aware NextShift surfaces  
**Exit Criteria:** Interaction patterns are Workspace-aware, implementation-independent, and ready for Requirements Verification

## Purpose

This document defines the standard interaction patterns for NextShift Workspace interfaces.

Interaction patterns describe how members understand context, trigger actions, receive feedback, recover from problems, navigate between views, and collaborate with AI. They do not define CSS, React, Vue, runtime routing, API behavior, persistence, or Design System implementation details.

## Scope

Included:

- User-triggered actions
- Workspace switching behavior at the design-pattern level
- Primary, secondary, destructive, and recovery actions
- Async interaction expectations
- Disclosure and selection patterns
- State transition expectations
- AI-assisted interaction patterns at the UI Kit level

Excluded:

- Component implementation
- Design token definitions
- Animation implementation
- Routing logic
- Data fetching behavior
- Authorization rules
- Business workflow specifications

## Interaction Principles

| Principle | Interaction Rule |
| --- | --- |
| Context before action | Members must understand the active Workspace and view before acting. |
| One primary action | Each card, panel, section, or view should expose one dominant next action. |
| Consequence visibility | Actions should communicate what will change before the member commits. |
| Feedback continuity | Every meaningful action should produce visible state or feedback. |
| Recovery by default | Errors and destructive actions need a clear recovery path or confirmation. |
| Progressive control | Advanced controls appear when useful, not before. |
| AI explainability | AI-assisted actions must show recommendation, reason, confidence, and human control. |

## Standard Interaction Anatomy

Every documented interaction should identify:

1. Context: where the member is working.
2. Trigger: what the member does.
3. Target: what object, flow, or state is affected.
4. Feedback: what visible response confirms progress or failure.
5. Result: what changes after completion.
6. Recovery: what the member can do if the interaction fails or is reversed.

This anatomy keeps design briefs, QA reviews, and AI-generated surfaces deterministic.

## Core Patterns

### Primary Action

Use for the most important action in a unit of composition.

Guidance:

- Use one primary action per view region, section, panel, or card.
- Place the action near the decision it completes.
- Label the action by outcome, not mechanism.
- Pair async primary actions with loading and success or error feedback.

Examples:

- `Create customer`
- `Schedule follow-up`
- `Approve recommendation`
- `Retry import`

Avoid:

- Generic labels such as `Submit`, `Continue`, or `Manage` when a specific outcome is known.
- Competing primary actions in the same region.

### Secondary Action

Use for a supporting action that does not complete the main task.

Guidance:

- Secondary actions should not visually compete with the primary action.
- Group secondary actions by relationship to the primary task.
- Keep secondary actions visible when they are required for safe completion.
- Move rarely used actions behind disclosure where appropriate.

### Destructive Action

Use for actions that remove data, revoke access, cancel workflows, or materially change a business record.

Guidance:

- Use destructive emphasis only when consequence is material.
- Require confirmation before completion.
- State the affected object and consequence in plain language.
- Provide recovery guidance where recovery is available.
- Do not hide destructive actions next to unrelated secondary actions.

### Confirmation

Use when an action is irreversible, risky, or affects a Workspace-wide state.

Guidance:

- Confirm the exact object, Workspace, and consequence.
- Make the confirming action explicit.
- Keep the cancel action available and clearly lower emphasis.
- Avoid confirmation for low-risk reversible actions.

### Selection

Use when a member chooses one or more items from a set.

Guidance:

- Show selected state clearly.
- Preserve selected items when sorting or filtering unless the member clears them.
- Show the count when multiple items are selected.
- Keep bulk actions disabled or unavailable until a valid selection exists.

### Filtering and Sorting

Use to narrow or reorder data without changing the underlying records.

Guidance:

- Filters should show active criteria.
- Sorting should preserve the member's orientation.
- Empty filtered results should explain that no item matched the criteria and provide a way to clear or adjust filters.
- Do not use filtering to hide critical status or errors.

### Progressive Disclosure

Use when additional detail or advanced controls are useful only after the member understands the primary state.

Guidance:

- Keep the primary decision visible before disclosure.
- Use disclosure for advanced options, audit detail, configuration, and supporting evidence.
- Do not hide errors, blockers, risk, or required actions behind disclosure.
- Preserve orientation when a panel, drawer, or expanded section opens.

### Async Action

Use when a member action starts work that may take time to complete.

Guidance:

- Enter loading state immediately.
- Preserve context while work is in progress.
- Prevent duplicate submission when repeat action would cause risk.
- Show success, error, or pending status after completion.
- Provide a recovery path for failure.

### Workspace Switch

Use when the member changes the active business operating context.

Guidance:

- Treat Workspace switching as context change, not view navigation.
- Preserve the Workspace Shell pattern.
- Make the active Workspace visible after switching.
- Avoid surprising action carryover between Workspaces.
- Do not create separate interaction models per Workspace type.

### Status Transition

Use when an item changes from one state to another, such as lead status, task status, or recommendation status.

Guidance:

- Show the current state before the transition.
- Name the target state in the action or confirmation.
- Confirm material transitions when they affect business records.
- Show the resulting state after completion.

## Workspace-Aware Rules

- Retail, Recruitment, Admin, and future Workspaces use the same interaction patterns.
- Workspace-specific behavior should come from metadata, content, labels, and capability rules, not bespoke UI patterns.
- The active Workspace context must remain visible for actions with Workspace-scoped consequences.
- Navigation interactions and Workspace switching must remain distinct.
- AI-assisted actions must be scoped to the active Workspace and current view context.

## Relationship To Earlier UI Kit Slices

- UK-001 supplies approved terms such as Action, Context, Flow, Pattern, State, View, and Workspace.
- UK-002 supplies Decision-First UX, Trustworthy Interaction, Progressive Disclosure, and Human And AI Collaboration.
- UK-003 supplies component states, variants, and composition rules.
- UK-004 supplies layout regions where interaction patterns appear.

## Non-Goals

- No component redesign.
- No implementation code.
- No routing, persistence, or API rules.
- No Design System token or behavior duplication.
- No business-specific workflow definition.

## Status

Implemented.
