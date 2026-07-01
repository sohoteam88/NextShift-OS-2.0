# NextShift UI Kit v1.0

# UK-005 Feedback Patterns

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-005 Interaction Patterns  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-005 Planning, UK-002 Trustworthy Interaction, UK-003 Component States and Variants, UK-004 Layout Guidelines  
**Outputs:** Feedback pattern guidance for Workspace-aware interactions  
**Exit Criteria:** Feedback patterns define state, placement, timing, and recovery expectations without implementation details

## Purpose

This document defines how NextShift interfaces communicate system state, action results, errors, progress, and recovery.

Feedback patterns support member confidence. They do not define component implementation, animation timing, API behavior, persistence, or notification infrastructure.

## Feedback Principles

| Principle | Rule |
| --- | --- |
| Immediate acknowledgement | A member action should visibly register. |
| Contextual placement | Feedback appears near the affected object whenever practical. |
| Plain-language status | Feedback explains what happened and what the member can do. |
| Recovery included | Error and blocked states include a recovery path. |
| State continuity | Loading, empty, error, success, and disabled states preserve orientation. |
| AI transparency | AI feedback shows whether AI is working, uncertain, accepted, or dismissed. |

## Feedback Types

### Inline Validation

Use for field, form, or local input problems.

Guidance:

- Place validation near the affected input or control.
- Explain the required correction in plain language.
- Do not rely on color alone.
- Preserve entered information when validation fails.

### Action Feedback

Use after a member triggers an action.

Guidance:

- Show loading or pending state for async work.
- Show success when the result is not otherwise obvious.
- Show error with recovery when the action fails.
- Keep the affected object visible.

Examples:

- Saved state after editing a record.
- Retry path after failed import.
- Confirmation after scheduling a follow-up.

### Empty State

Use when a container, view, table, chart, dashboard region, or filtered result has no data.

Guidance:

- Explain why there is no data.
- Provide the next useful action where one exists.
- Distinguish true empty state from filtered empty state.
- Keep Workspace context visible.

### Loading State

Use when content or action result is in progress.

Guidance:

- Preserve the layout region where the result will appear.
- Show which content is loading when multiple regions exist.
- Avoid removing context while loading.
- Prevent duplicate risky actions during submission.

### Error State

Use when content fails to load or an action cannot complete.

Guidance:

- State the problem in plain language.
- Identify the affected object or region.
- Provide a recovery action.
- Escalate only when the member cannot recover locally.

Examples:

- `Retry import`
- `Reload customers`
- `Clear filters`
- `Review required fields`

### Success State

Use when completion is not otherwise obvious or when the result affects business operations.

Guidance:

- Confirm the completed outcome.
- Show the resulting state or next logical action.
- Avoid excessive success messaging for trivial reversible actions.

### Blocked State

Use when the member cannot continue because required data, permissions, setup, or external conditions are missing.

Guidance:

- Explain what blocks progress.
- Name the requirement or owner where appropriate.
- Provide the next recoverable step.
- Do not present blocked work as ordinary error if the issue requires setup or approval.

### AI Working State

Use when AI is generating, analyzing, ranking, or summarizing.

Guidance:

- Show that AI work is in progress.
- Preserve the original member context.
- Avoid implying certainty before output is ready.
- Provide cancel, dismiss, or retry where the flow supports it.

### AI Recommendation Feedback

Use when AI produces a recommendation, summary, or draft.

Guidance:

- Show recommendation first.
- Show reason and confidence or uncertainty.
- Provide accept, adjust, dismiss, regenerate, or inspect options.
- Show accepted or dismissed state after the member acts.

## Placement Guidance

| Feedback Scope | Preferred Placement |
| --- | --- |
| Field | Near the field |
| Card or panel | Inside the affected card or panel |
| Section | In the section feedback region |
| View | Near the view header or primary content region |
| Workspace-wide | In a Workspace-level feedback region |
| AI recommendation | Inside the AI component or adjacent decision region |

Feedback should not force members to search for the affected object.

## Timing Guidance

- Acknowledge direct actions immediately.
- Keep loading state visible until result state is available.
- Show validation before final submission where possible.
- Do not delay critical error or blocked feedback.
- Do not interrupt the member with unrelated feedback during a focused flow.

## Recovery Requirements

Error and blocked states should define:

1. What happened.
2. What is affected.
3. What the member can do next.
4. Whether the previous input or selection is preserved.

## Accessibility Expectations

- Feedback must not depend on color alone.
- Feedback text should be specific and concise.
- Focus and reading order should make feedback discoverable.
- Disabled actions should explain why they are unavailable when the reason is not obvious.

Implementation remains owned by the Design System and runtime layers.

## Non-Goals

- No notification service design.
- No toast component implementation.
- No animation values.
- No API error contract.
- No logging or telemetry requirements.

## Status

Implemented.
