# NextShift UI Kit v1.0

# UK-005 User Flows

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-005 Interaction Patterns  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-005 Planning, UK-001 Terminology, UK-002 Design Principles, UK-003 Component Catalog, UK-004 Layout Guidelines  
**Outputs:** Reusable user flow guidance for Workspace-aware interfaces  
**Exit Criteria:** User flows define start, progression, completion, feedback, and recovery without runtime implementation details

## Purpose

This document defines the standard user flow model for NextShift Workspace interfaces.

A flow is a multi-step user journey with a start, progression, and completion state. This document defines the design-pattern structure for flows, not application routing, database transitions, API calls, or business-domain workflow logic.

## Flow Model

Every NextShift user flow should define:

1. Entry context: how the member enters the flow.
2. Workspace context: which Workspace scopes the flow.
3. Goal: what outcome the flow supports.
4. Required input: what the member must provide or decide.
5. Progression: how the member moves through the flow.
6. Feedback: what state confirms progress, completion, or failure.
7. Exit: where the member lands after completion or cancellation.
8. Recovery: how the member resumes, retries, or reverses where supported.

## Standard Flow Types

### Create Flow

Use when a member creates a new business object, configuration, record, task, or workspace item.

Expected pattern:

1. Start from the relevant Workspace view.
2. Provide a specific primary action.
3. Show required fields or decisions first.
4. Validate before completion.
5. Confirm success and show the created object or next action.

Required states:

- Empty state when no prior objects exist.
- Loading state during creation.
- Error state with recovery.
- Success state after completion.

### Edit Flow

Use when a member changes an existing object or setting.

Expected pattern:

1. Begin from an identified object, panel, or settings view.
2. Show current value before edit.
3. Distinguish required and optional changes.
4. Provide save and cancel/revert paths.
5. Confirm the saved state.

Guidance:

- Avoid hiding the object identity during edit.
- Show unsaved-change risk before navigation where appropriate.
- Keep destructive changes separate from ordinary edits.

### Review and Approve Flow

Use when a member evaluates a recommendation, request, import, change, or generated output.

Expected pattern:

1. Show the item requiring review.
2. Present status, reason, and consequence.
3. Provide approve, reject, adjust, or defer actions where relevant.
4. Confirm material approvals.
5. Show resulting status after action.

AI recommendations often use this flow.

### Recovery Flow

Use when work fails, data is missing, or the member cannot complete the intended action.

Expected pattern:

1. State what happened in plain language.
2. Explain what is affected.
3. Offer a recovery action.
4. Preserve context when retrying.
5. Confirm the result after recovery.

Examples:

- Retry import.
- Clear filters.
- Reconnect integration.
- Restore draft.

### Workspace Switch Flow

Use when a member changes the active Workspace context.

Expected pattern:

1. Member opens or activates the Workspace Switcher.
2. Available Workspaces are shown with the current Workspace selected.
3. Member chooses a different Workspace.
4. The Workspace Shell updates context.
5. The current view resolves to the corresponding Workspace-aware destination.

Guidance:

- Switching Workspace is not the same as changing a view.
- The active Workspace must be visible after the switch.
- Pending actions should not silently carry into another Workspace.

### Dashboard to Action Flow

Use when a dashboard signal leads a member into a task.

Expected pattern:

1. Dashboard shows current operational signal.
2. Member sees why the signal matters.
3. Member triggers the related primary action.
4. The target view opens with context preserved.
5. Completion feeds back into status or dashboard state.

Examples:

- Overdue follow-ups -> Schedule follow-up.
- Low stock alert -> Review inventory item.
- Candidate stage risk -> Review candidate pipeline.

### AI-Assisted Flow

Use when AI helps the member decide, draft, rank, summarize, or recommend.

Expected pattern:

1. Show AI recommendation or insight.
2. Show reason and confidence or uncertainty.
3. Provide human actions: accept, adjust, dismiss, regenerate, or inspect evidence.
4. Show state after the member acts.
5. Preserve audit or source detail where the surface requires it.

AI does not replace the member's final control over material business actions.

### Settings Flow

Use when members configure Workspace, account, or system preferences.

Expected pattern:

1. Show current setting and scope.
2. Indicate whether the setting affects the current Workspace or broader account.
3. Separate safe settings from risky or destructive settings.
4. Confirm material changes.
5. Show saved state.

## Flow State Requirements

Every flow that depends on data or async action should define:

- Initial state
- Loading state
- Empty state where applicable
- Error state with recovery
- Completed state
- Cancelled or dismissed state where applicable

The happy path alone is incomplete.

## Responsive Flow Guidance

- Preserve flow order when layouts stack.
- Keep Workspace context and current step visible.
- Keep the primary action reachable without moving secondary detail ahead of primary decisions.
- Do not create a different flow model for compact viewports.

## AI and QA Usage

For design briefs and QA, describe flows using this template:

```text
Flow:
Workspace context:
Entry point:
Primary goal:
Required states:
Primary action:
Feedback:
Recovery:
Exit:
```

## Non-Goals

- No route maps.
- No API sequencing.
- No database state machine definition.
- No role or permission implementation.
- No business-domain workflow ownership.

## Status

Implemented.
