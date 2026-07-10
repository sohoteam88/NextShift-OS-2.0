# NextShift UI Kit v1.0

# UK-008 Prompt Construction Rules

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-008 Claude Design Brief  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-008 Planning, UK-001 AI Design Language, UK-003 AI Component Prompts, UK-005 through UK-007 prompt templates  
**Outputs:** Prompt construction rules for Claude Design and AI Design Agents  
**Exit Criteria:** Prompts are deterministic, authority-scoped, Workspace-aware, and implementation-independent

## Purpose

This document defines how to write prompts that produce UI Kit-aligned design artifacts.

Prompt construction rules reduce ambiguity and prevent AI-generated outputs from inventing components, layout systems, tokens, runtime logic, or brand systems.

## Prompt Requirements

Every prompt should include:

1. Authority statements.
2. Surface type.
3. Workspace context.
4. Member goal.
5. Business context.
6. Required component guidance.
7. Required layout guidance.
8. Interaction and state guidance.
9. Accessibility guidance.
10. Theme and branding guidance.
11. Output format.
12. Constraints and anti-patterns.

## Prompt Template

```text
Create a NextShift [surface type] for [Workspace or business capability].

Authority:
- Design authority: NextShift Design System v1.0
- Language authority: NextShift UI Kit v1.0
- Slice guidance: UK-001 through UK-008

Context:
- Workspace:
- Member goal:
- Business state:
- Data state:
- Workflow stage:

Use:
- Components:
- Layout template:
- Interaction pattern:
- Accessibility constraints:
- Theme and branding constraints:

States:
- Loading:
- Empty:
- Error:
- Success:
- Disabled/selected/expanded where applicable:

Output:
- [design brief, screen spec, component composition, review checklist]

Constraints:
- Do not generate runtime code, CSS, tokens, routes, API behavior, database behavior, or new components.
```

## Deterministic Wording Rules

- Use Workspace, Dashboard, View, Flow, Pattern, Section, Panel, Card, Widget, Module, Action, State, Component, Layout, and Variant.
- Use action labels by outcome.
- Use component names from UK-003.
- Use layout templates from UK-004.
- Use interaction names from UK-005.
- Use accessibility constraints from UK-006.
- Use theme constraints from UK-007.

Avoid:

- "Make it modern."
- "Create a new component."
- "Use any layout that looks good."
- "Apply a custom theme."
- "Build the UI."
- "Implement the screen."

## State Prompt Rules

State prompts should specify:

- Trigger or condition.
- Affected region.
- Member-facing message.
- Recovery action where applicable.
- Accessibility expectation.

Example:

```text
Error state:
Show that customer data failed to load in the table region.
Provide a Retry action.
Preserve Workspace context and current filters.
Communicate error by text and structure, not color alone.
```

## Output Format Rules

Prompts must name the artifact expected:

- Design brief.
- View specification.
- Component composition.
- Flow specification.
- QA checklist.
- AI review notes.

Do not ask Claude Design for code unless a separate software-engineering task explicitly requests code.

## Non-Goals

- No prompt for runtime implementation.
- No hidden instruction to generate CSS or tokens.
- No component invention.
- No route or database assumptions.
- No business workflow invention.

## Status

Implemented.
