# UK-002 Anti-Patterns

## Purpose

This document defines design approaches that should be avoided when applying UK-002 Design Principles.

Anti-patterns help designers, engineers, QA reviewers, Claude Design, and AI design agents identify design risk before it becomes implementation work.

## Scope

Included:

- Principle-level anti-patterns
- User experience risk
- AI generation risk
- Preferred replacements

Excluded:

- Component implementation defects
- Token values
- CSS, React, Vue, or Storybook guidance
- Runtime behavior
- API behavior

## Anti-Pattern Catalog

| Anti-Pattern | Risk | Preferred Replacement |
| --- | --- | --- |
| AI Visual Invention | AI creates a new visual system or component model. | State Design System authority and UI Kit terminology constraints. |
| Data Dump Dashboard | Dashboard shows metrics without priority or decision context. | Organize by status, risk, priority, and next action. |
| Ambiguous Action Labels | Users cannot predict the result of acting. | Use outcome-specific labels. |
| Synonym Drift | Same concept gets multiple names across docs. | Reuse UK-001 approved terms. |
| Hidden Primary Action | The main user action is buried in menus or disclosure. | Keep primary action visible. |
| Disclosure Of Critical Risk | Important warnings or blockers are collapsed. | Keep critical risk visible and secondary detail collapsible. |
| Small-Data Assumption | Design only works for first-use or low-volume data. | Document empty, normal, and high-volume behavior. |
| Accessibility Afterthought | Accessibility is deferred to implementation. | Document labels, states, feedback, focus, contrast intent, and motion expectations. |
| AI Authority Ambiguity | Prompts do not state what AI can and cannot change. | State design, language, and workflow authority. |
| Silent State Change | User action changes system state without feedback. | Provide success, error, warning, loading, or confirmation feedback. |
| Desktop-Only UX | Smaller viewports lose meaning, state, or action access. | Preserve hierarchy and critical actions responsively. |

## AI Visual Invention

Problem:

AI output introduces new visual systems, components, layout primitives, or style language.

Why it creates risk:

It conflicts with the released NextShift Design System and makes generated artifacts hard to implement or verify.

Preferred replacement:

Prompts must state:

- Design authority: NextShift Design System v1.0
- Language authority: NextShift UI Kit v1.0
- Constraint: do not redesign tokens, components, accessibility implementation, theming, or runtime behavior.

## Data Dump Dashboard

Problem:

A dashboard displays many metrics without hierarchy, priority, risk, or next action.

Why it creates risk:

Users must interpret everything themselves, which weakens decision-first UX.

Preferred replacement:

Organize dashboard content around:

- Current status
- What changed
- What needs attention
- Primary action
- Supporting detail

## Ambiguous Action Labels

Problem:

Commands use vague labels such as `Submit`, `Continue`, `Manage`, or `Do it`.

Why it creates risk:

Users cannot predict the result of the action.

Preferred replacement:

Use specific action labels:

- Create customer
- Convert lead
- Schedule follow-up
- Retry import
- Export report

## Synonym Drift

Problem:

Documentation switches between multiple names for the same concept.

Why it creates risk:

It weakens consistency and makes AI-generated output less deterministic.

Preferred replacement:

Use UK-001 approved terms:

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

## Hidden Primary Action

Problem:

The main action is placed inside a menu, collapsed panel, or secondary area.

Why it creates risk:

Users cannot quickly complete the intended workflow.

Preferred replacement:

Keep primary actions visible and label them by outcome.

## Disclosure Of Critical Risk

Problem:

Warnings, blockers, destructive consequences, or critical state are hidden behind disclosure.

Why it creates risk:

Users may act without seeing important context.

Preferred replacement:

Keep critical risk visible. Use disclosure for secondary details, audit trails, optional configuration, or advanced filters.

## Small-Data Assumption

Problem:

The design only works when there are few records, few roles, or one workflow path.

Why it creates risk:

The interface requires redesign as the product grows.

Preferred replacement:

Document how the surface handles:

- Empty state
- Normal data
- High-volume data
- Multiple roles
- Additional modules
- Error and warning states

## Accessibility Afterthought

Problem:

Accessibility is omitted from the design artifact and expected to be solved later.

Why it creates risk:

The design may rely on inaccessible labels, color-only state, unclear focus behavior, or motion-only feedback.

Preferred replacement:

Document accessibility intent when relevant:

- Accessible names
- Required states
- Feedback
- Focus expectations
- Contrast intent
- Reduced-motion expectations

## AI Authority Ambiguity

Problem:

AI prompts do not state which document owns implementation, language, or workflow decisions.

Why it creates risk:

AI may invent behavior or duplicate details from the wrong authority.

Preferred replacement:

Use the authority model:

- Implementation authority: NextShift Design System v1.0
- Language authority: NextShift UI Kit v1.0
- Workflow authority: relevant Business Capability document

## Silent State Change

Problem:

The interface changes data, workflow state, or automation state without feedback.

Why it creates risk:

Users cannot tell whether the action succeeded, failed, or remains in progress.

Preferred replacement:

Document feedback states:

- Loading
- Success
- Error
- Warning
- Disabled
- Selected

## Desktop-Only UX

Problem:

The design depends on a desktop layout and loses meaning on narrower screens.

Why it creates risk:

Responsive behavior may hide important state, reorder workflows incorrectly, or remove primary action access.

Preferred replacement:

Document responsive expectations:

- Preserve priority order.
- Preserve critical state.
- Preserve primary actions.
- Reflow comparison content without changing meaning.

## Version History

| Version | Status | Notes |
| --- | --- | --- |
| v1.0 | Implemented | Initial UK-002 anti-pattern catalog. |
