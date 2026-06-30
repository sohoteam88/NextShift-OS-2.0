# UK-001 Documentation-Ready Assets

## Purpose

This document provides reusable assets for future UI Kit documents, Claude Design prompts, QA references, and business capability design briefs.

## UI Kit Document Template

```markdown
# UK-### Topic Name

## Purpose

Describe why this document exists.

## Scope

Included:

- Item

Excluded:

- Item

## Design Principles

- Principle

## Usage Guidance

- Guidance

## Examples

Context:

Use:

Avoid:

## Anti-Patterns

Problem:

Why it creates risk:

Preferred replacement:

## Relationships

Implementation authority:

Language authority:

Workflow authority:

## References

- Reference

## Version History

| Version | Status | Notes |
| --- | --- | --- |
| v1.0 | Draft | Initial version. |
```

## Claude Design Brief Template

```text
Project:
NextShift OS 3.1

Design authority:
NextShift Design System v1.0

Language authority:
NextShift UI Kit v1.0

Surface:
[Workspace/Dashboard/View/Flow/Pattern]

User goal:
[Goal]

Context:
[Business context, role, data state, workflow stage]

Required structure:
[Sections, panels, cards, widgets, actions]

Required states:
[Loading, empty, error, success, warning, disabled, selected, expanded]

Constraints:
Do not redesign tokens, components, layout engine, runtime, dashboard framework, accessibility implementation, theme implementation, governance, routing, or backend APIs.

Output:
[Design brief, layout brief, QA checklist, or documentation draft]
```

## QA Design Review Checklist

- Approved terminology used.
- Design System referenced as implementation authority.
- UI Kit referenced as language authority.
- Surface type is named.
- User goal is explicit.
- Primary action is specific.
- Required states are documented.
- Anti-patterns are identified where relevant.
- Scope boundaries are respected.
- No implementation details are duplicated from the Design System.

## Cross-Reference Snippet

```text
Implementation authority:
NextShift Design System v1.0

Language authority:
NextShift UI Kit v1.0

Workflow authority:
[Business Capability document]
```

## Anti-Pattern Snippet

```text
Problem:
[Describe the ambiguous or inconsistent design approach.]

Why it creates risk:
[Explain the user, operational, or AI-generation risk.]

Preferred replacement:
[State the approved term, pattern, or structure.]
```
