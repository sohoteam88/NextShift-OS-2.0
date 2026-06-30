# UK-002 Principle Explanations

## Purpose

This document explains how to interpret and apply each UK-002 design principle during product design, documentation review, QA review, and AI-assisted design generation.

## Principle Application Model

Every principle should answer:

- What user problem does this reduce?
- What design decision does this constrain?
- What documentation language should be used?
- What Design System responsibility must remain untouched?
- What should AI be allowed or prevented from generating?

## AI-First Experience

AI-first does not mean designing for AI instead of users. It means design guidance is structured so AI can produce consistent artifacts that humans can review.

Apply this principle when:

- Writing Claude Design briefs.
- Creating reusable UI Kit examples.
- Asking AI to generate a workspace, dashboard, view, flow, or pattern.
- Reviewing AI output for terminology drift.

Required explanation in future documents:

- Name the surface type.
- Name the user goal.
- Name the business context.
- Name required states.
- State constraints against Design System redesign.

## Decision-First UX

Decision-first UX means the interface is organized around the user's operational decision, not around internal data structures.

Apply this principle when:

- Designing dashboards.
- Prioritizing sections in a workspace.
- Choosing which status, alert, recommendation, or action appears first.
- Reviewing whether a surface helps the user act.

Required explanation in future documents:

- Identify the decision the user must make.
- Identify the information needed for that decision.
- Identify the next useful action.
- Explain what supporting detail can remain secondary.

## Clarity Over Complexity

Clarity is the baseline for operational trust. A clear interface names what it is, what changed, what matters, and what action is available.

Apply this principle when:

- Naming views, actions, states, and sections.
- Writing empty, loading, error, success, and warning states.
- Reviewing whether explanatory text is compensating for weak structure.

Required explanation in future documents:

- Use approved UK-001 names.
- Use direct action labels.
- Prefer structured summaries.
- Avoid vague commands.

## Consistency

Consistency keeps NextShift learnable across capabilities. It also makes AI-generated design artifacts easier to verify.

Apply this principle when:

- Reusing workspace, dashboard, view, section, panel, card, widget, flow, pattern, variant, context, action, and state language.
- Reviewing new capability documentation.
- Deciding whether a new pattern is justified.

Required explanation in future documents:

- Identify the existing term or pattern being reused.
- Document why a new variation is needed.
- Avoid introducing synonyms.

## Progressive Disclosure

Progressive disclosure reduces initial complexity without hiding critical information.

Apply this principle when:

- Designing advanced filters.
- Showing optional configuration.
- Exposing audit trails.
- Managing complex multi-step flows.

Required explanation in future documents:

- Name what stays visible.
- Name what can be disclosed.
- Explain why the disclosed content is secondary.
- Confirm that risk and primary actions remain visible.

## Enterprise Scalability

Enterprise scalability means the design survives growth in data, workflows, tenants, user roles, and capability scope.

Apply this principle when:

- Designing dashboards, tables, workspace navigation, filters, and multi-role views.
- Reviewing whether a design only works for the first release.
- Creating capability-specific UI guidance.

Required explanation in future documents:

- Describe expected growth conditions.
- Include empty, small-data, normal, and high-volume considerations where relevant.
- Avoid layout assumptions that block future modules.

## Accessibility By Default

Accessibility by default means design guidance anticipates names, state, feedback, focus, contrast, and motion expectations before implementation.

Apply this principle when:

- Defining action labels.
- Describing feedback and state changes.
- Creating destructive or long-running workflows.
- Reviewing icon-only controls and visual-only status indicators.

Required explanation in future documents:

- Identify required states.
- Describe feedback expectations.
- Use labels that communicate outcome.
- Avoid relying only on color or motion.

## Human And AI Collaboration

Human and AI collaboration means documentation must support human judgment while enabling structured AI output.

Apply this principle when:

- Creating prompts.
- Reviewing AI-generated design drafts.
- Producing reusable examples.
- Defining authority boundaries.

Required explanation in future documents:

- State design authority.
- State language authority.
- State workflow authority when applicable.
- State exact output format.

## Trustworthy Interaction

Trustworthy interaction means users understand consequences and can recover from mistakes where possible.

Apply this principle when:

- Designing destructive actions.
- Designing confirmation flows.
- Handling loading, success, warning, and error states.
- Showing automation or AI-generated recommendations.

Required explanation in future documents:

- Name the user action.
- Name the expected result.
- Name the feedback state.
- Name confirmation or recovery behavior where relevant.

## Responsive-First Thinking

Responsive-first thinking means layout changes should preserve meaning and workflow continuity.

Apply this principle when:

- Designing dashboards and workspaces.
- Reflowing tables, panels, cards, and widgets.
- Prioritizing mobile or narrow-viewport content.
- Reviewing whether primary actions remain available.

Required explanation in future documents:

- Preserve priority order.
- Preserve critical state.
- Preserve primary action access.
- Avoid breakpoint behavior that changes workflow meaning.

## Review Questions

Use these questions during documentation review:

- Does the guidance reuse UK-001 terminology?
- Does it identify the user's decision or task?
- Does it state what must remain visible?
- Does it identify states and feedback?
- Does it avoid Design System duplication?
- Can Claude Design or another AI agent use the document without inventing new terms?
- Can QA verify the principle without interpreting intent?

## Version History

| Version | Status | Notes |
| --- | --- | --- |
| v1.0 | Implemented | Initial UK-002 principle explanation guide. |
