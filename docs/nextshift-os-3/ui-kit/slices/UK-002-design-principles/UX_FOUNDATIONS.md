# UK-002 UX Foundations

## Purpose

This document defines the UX foundation behind UK-002 Design Principles.

It translates the principles into reusable design decision guidance for NextShift product surfaces.

## UX Philosophy

NextShift interfaces exist to help business operators understand, decide, and act.

The experience should feel like a coherent business operating system, not a set of disconnected tools. Every surface should preserve context, reduce decision effort, and make the next useful action clear.

## User Operating Context

NextShift users need to:

- Scan operational status.
- Compare priorities.
- Understand business risk.
- Act on customers, leads, campaigns, content, revenue, or AI recommendations.
- Move between workflows without losing orientation.
- Trust the system state before acting.

## Decision Framework

Every view should answer:

1. What is happening?
2. Why does it matter?
3. What needs attention?
4. What can the user do now?
5. What changed since the last interaction?

If a view cannot answer these questions, its information architecture needs revision.

## Interface Priorities

Order interface decisions by user value:

1. Current context
2. Critical state or risk
3. Primary decision
4. Primary action
5. Supporting information
6. Secondary actions
7. Historical or reference detail

This order may change by capability, but the document must explain why.

## Surface Guidance

### Workspace

A workspace is a durable business operating area.

Workspace UX should:

- Preserve user orientation.
- Show active context.
- Provide access to modules or major sections.
- Keep primary workflows easy to resume.

### Dashboard

A dashboard is an operational summary interface.

Dashboard UX should:

- Prioritize scanning and comparison.
- Show status, risk, progress, and priority.
- Make the next useful action visible.
- Avoid becoming a static report.

### View

A view is a complete route-level surface.

View UX should:

- Have a clear purpose.
- Use stable hierarchy.
- Group related content into sections or panels.
- Include relevant states.

### Flow

A flow is a multi-step user journey.

Flow UX should:

- Show progress.
- Keep the current step clear.
- Avoid unnecessary intermediate screens.
- Explain irreversible or high-risk actions.

### Pattern

A pattern is a reusable user experience solution.

Pattern UX should:

- Be named consistently.
- Include expected states.
- Document when to use and when to avoid.
- Remain implementation-independent.

## AI Generation Guidance

AI-generated UX artifacts should include:

- Surface type.
- User goal.
- Business context.
- Required sections, panels, widgets, actions, or states.
- Authority boundaries.
- Anti-patterns to avoid.

Reusable prompt fragment:

```text
Use UK-002 Design Principles to prioritize the user's decision, preserve context, document states, and avoid redesigning the NextShift Design System.
```

## QA Review Guidance

Reviewers should check:

- The user goal is explicit.
- The primary decision is visible.
- The primary action is specific.
- Critical states are documented.
- Supporting detail does not overwhelm priority.
- The design can scale to more data and roles.
- Responsive behavior preserves hierarchy and action access.
- Accessibility intent is present.
- UK-001 terminology is reused.
- Design System implementation details are not duplicated.

## Relationship To UK-001

UK-001 provides the approved vocabulary, relationship model, documentation language, and AI design language. UK-002 uses those foundations to define UX decision rules.

## Relationship To Design System

The Design System owns implementation-ready primitives and contracts. This document defines UX intent and usage guidance only.

## Version History

| Version | Status | Notes |
| --- | --- | --- |
| v1.0 | Implemented | Initial UK-002 UX foundation guide. |
