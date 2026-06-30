# UK-001 AI Design Language

## Purpose

This document defines how Claude Design and future AI design agents should consume NextShift UI Kit guidance.

AI outputs should remain consistent with the released NextShift Design System and the approved UI Kit vocabulary.

## Prompt Structure

Use this structure for AI design prompts:

```text
Project:
NextShift OS 3.1

Design Authority:
NextShift Design System v1.0

Language Authority:
NextShift UI Kit v1.0

Surface:
Name the workspace, dashboard, view, flow, or pattern.

User Goal:
Describe what the user is trying to accomplish.

Context:
Describe the business state, data state, user role, and workflow stage.

Required Patterns:
List approved UI Kit patterns or structures.

States:
List loading, empty, error, success, warning, disabled, selected, or expanded states.

Constraints:
State what must not be redesigned or invented.

Output:
State the exact artifact expected.
```

## Deterministic Wording

AI prompts should use approved UI Kit terms.

Use:

- Workspace
- Dashboard
- View
- Section
- Panel
- Card
- Widget
- Flow
- Pattern
- Variant
- Context
- Action
- State

Avoid:

- Freeform synonyms
- Decorative descriptions
- Ambiguous layout names
- New component names not present in the Design System or UI Kit

## Component References

When referencing components, state the Design System as the implementation authority.

Example:

```text
Use Design System component language for buttons, inputs, cards, panels, modals, tables, dashboards, interaction states, visualization, accessibility, and theming.
Do not redefine component implementation.
```

## Layout References

Describe layouts by purpose and structure.

Example:

```text
Use a Dashboard view with a summary section, KPI widgets, an attention panel, and a recent activity section.
Prioritize scanning, comparison, and next action clarity.
```

## Pattern References

Patterns should be named explicitly.

Example:

```text
Use the Empty State Pattern for first-use customer data.
Include one primary action and one concise explanation.
```

## State Descriptions

State descriptions must be explicit.

Example:

```text
Loading state:
Show that customer data is loading. Preserve layout dimensions to avoid shifting.

Empty state:
Explain that no customers exist yet. Provide a primary action to create the first customer.

Error state:
Explain the failure and provide a retry action.
```

## Interaction Descriptions

Interaction descriptions should state intent and result.

Example:

```text
Primary action:
"Create customer" starts the customer creation flow.

Secondary action:
"Import customers" opens the import flow.

Destructive action:
"Delete customer" requires confirmation before completion.
```

## AI Output Requirements

AI-generated design artifacts should:

- Use approved terminology.
- Reference the Design System for implementation authority.
- Preserve UI Kit scope boundaries.
- Include states and anti-patterns when relevant.
- Avoid inventing new visual systems.
- Avoid introducing runtime or backend assumptions.

## Reusable Prompt Template

```text
Create a NextShift [surface type] for [business capability].

Use:
- Design authority: NextShift Design System v1.0
- Language authority: NextShift UI Kit v1.0
- Surface: [workspace/dashboard/view/flow/pattern]
- User goal: [goal]
- Context: [business context]
- Required structure: [sections/panels/widgets/actions]
- Required states: [loading/empty/error/success/warning]
- Constraints: Do not redesign tokens, components, runtime, backend APIs, routing, governance, accessibility implementation, or theme implementation.

Output:
[artifact type]
```
