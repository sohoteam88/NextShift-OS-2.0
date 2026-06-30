# UK-002 Design Principles

## Purpose

This document defines the official design principles for the NextShift UI Kit.

The principles guide every future NextShift interface, design brief, QA review, Claude Design output, AI design agent output, and business capability design artifact.

## Scope

Included:

- AI-first experience
- Decision-first UX
- Clarity over complexity
- Consistency
- Progressive disclosure
- Enterprise scalability
- Accessibility by default
- Human and AI collaboration
- Trustworthy interaction
- Responsive-first thinking

Excluded:

- Component implementation
- Design token definitions
- CSS, React, Vue, or Storybook implementation
- Runtime behavior
- API documentation
- Engineering governance

The released NextShift Design System v1.0 remains the implementation authority.

## Principle Summary

| Principle | Design Rule |
| --- | --- |
| AI-First Experience | Design artifacts must be understandable and reusable by both humans and AI systems. |
| Decision-First UX | Interfaces should help users understand, decide, and act. |
| Clarity Over Complexity | Interfaces should expose purpose, state, and next action without unnecessary explanation. |
| Consistency | Similar concepts should use the same language, structure, and behavior across surfaces. |
| Progressive Disclosure | Complexity should appear when useful, not before. |
| Enterprise Scalability | Surfaces should support more data, roles, states, and capabilities without redesign. |
| Accessibility By Default | Accessibility expectations should be considered during design, not repaired later. |
| Human And AI Collaboration | Documentation should support human judgment and AI-assisted production. |
| Trustworthy Interaction | Interactions should make consequence, system state, and recovery clear. |
| Responsive-First Thinking | Views should preserve hierarchy, task clarity, and action access across supported viewport sizes. |

## AI-First Experience

### Purpose

Ensure every UI Kit artifact can guide consistent AI-assisted design generation and review.

### Rationale

NextShift design work will be used by designers, engineers, QA reviewers, Claude Design, and future AI design agents. Ambiguous documentation produces inconsistent outputs.

### Usage Guidance

- Use approved UK-001 terminology.
- State the surface type: workspace, dashboard, view, flow, pattern, panel, card, or widget.
- Define context, state, and action explicitly.
- Include constraints that prevent Design System redesign.

### Examples

Use:

- `Customer Workspace`
- `Revenue Dashboard`
- `Empty State Pattern`
- `Primary action: Create customer`

Avoid:

- Generic surface names such as `page` or `screen`.
- Decorative instructions without task context.
- New component names not owned by the Design System.

### Anti-Patterns

- Asking AI to create a new visual system.
- Using synonyms for approved UI Kit terms.
- Omitting states such as loading, empty, error, success, disabled, or selected.

### Relationship To UK-001

Uses UK-001 AI Design Language, Information Language, and Terminology Glossary.

### Relationship To Design System

References the Design System as the implementation authority for tokens, components, accessibility implementation, theming, and interaction contracts.

## Decision-First UX

### Purpose

Make every interface help business operators understand what is happening, decide what matters, and act with confidence.

### Rationale

NextShift is an operating system for business work. Surfaces should not simply display data; they should make operational decisions easier.

### Usage Guidance

- Place the most decision-relevant information first.
- Make primary actions specific.
- Show why an item needs attention.
- Keep supporting details available but secondary.

### Examples

Use:

- A dashboard section that highlights overdue follow-ups before historical activity.
- A panel that pairs a recommendation with the reason it matters.

Avoid:

- Dense data without priority.
- Generic actions such as `Manage` when a specific action is available.

### Anti-Patterns

- Reporting metrics without explaining operational relevance.
- Making users inspect multiple views before finding the next action.

### Relationship To UK-001

Extends the UK-001 product mindset: understand, decide, and act.

### Relationship To Design System

Uses Design System components and states to communicate priority without redefining their implementation.

## Clarity Over Complexity

### Purpose

Ensure interfaces communicate purpose, state, and available action without unnecessary cognitive load.

### Rationale

Business users work under time pressure. UI should reduce interpretation work.

### Usage Guidance

- Use direct labels.
- Keep the current state visible.
- Prefer structured summaries over long explanations.
- Name actions by the outcome they produce.

### Examples

Use:

- `Schedule follow-up`
- `Convert lead`
- `Retry import`

Avoid:

- `Submit`
- `Continue`
- `Manage`

### Anti-Patterns

- Long instructional text where structure would be clearer.
- Ambiguous status labels.
- Hidden dependencies that affect user action.

### Relationship To UK-001

Uses UK-001 naming rules, action language, and state language.

### Relationship To Design System

Uses existing hierarchy, spacing, state, and feedback primitives without redefining them.

## Consistency

### Purpose

Make repeated concepts behave and read the same way across NextShift products.

### Rationale

Consistency reduces learning cost and makes future capabilities easier to design, build, test, and generate with AI.

### Usage Guidance

- Reuse approved terms.
- Reuse documented structures for repeated workflows.
- Keep action hierarchy stable.
- Document new patterns before adoption.

### Examples

Use:

- `Workspace` for durable business operating areas.
- `Dashboard` for operational summaries.
- `Panel` for focused controls or data.

Avoid:

- Switching between `screen`, `page`, and `view` for the same concept.
- Inventing new names for Design System components.

### Anti-Patterns

- Capability-specific terminology that conflicts with UI Kit terms.
- One-off interaction behavior for common actions.

### Relationship To UK-001

Directly depends on UK-001 Terminology Glossary and Information Language.

### Relationship To Design System

Design System remains the implementation source for component behavior and variants.

## Progressive Disclosure

### Purpose

Reveal complexity at the moment it becomes useful.

### Rationale

Operational software must support complex workflows without overwhelming first-level decisions.

### Usage Guidance

- Keep primary decisions visible.
- Place advanced controls behind clear disclosure.
- Preserve user orientation when details expand.
- Do not hide critical risk or required actions.

### Examples

Use:

- Advanced filters behind a clear filter control.
- Audit details in an expandable section.
- Optional setup configuration after required setup steps.

Avoid:

- Hiding the primary action in a menu.
- Revealing all advanced configuration before the user chooses a workflow.

### Anti-Patterns

- Collapsing risk, errors, or blockers.
- Treating disclosure as a way to hide poor information architecture.

### Relationship To UK-001

Extends UK-001 visual language guidance for hierarchy, density, and progressive disclosure.

### Relationship To Design System

Uses existing disclosure, modal, panel, and state patterns without redefining implementation.

## Enterprise Scalability

### Purpose

Ensure screens, patterns, and documentation can support growth in data volume, user roles, states, and business capabilities.

### Rationale

NextShift surfaces must remain coherent as the product expands.

### Usage Guidance

- Design for more rows, filters, states, permissions, and modules.
- Avoid layouts that assume only one tenant, role, or data state.
- Keep hierarchy and naming stable as capability scope grows.

### Examples

Use:

- Dashboard widgets that can scale from three signals to several groups.
- Workspace sections that can accept additional modules.

Avoid:

- Fixed copy or layouts that only work for an empty or small-data case.

### Anti-Patterns

- Hard-coded workflows in design guidance.
- One-off surfaces that cannot accept future states.

### Relationship To UK-001

Extends UK-001 scalability and business experience layers.

### Relationship To Design System

Relies on Design System layout, component, and responsive primitives as implementation constraints.

## Accessibility By Default

### Purpose

Treat accessibility as a design responsibility from the start.

### Rationale

Accessible design improves usability, QA reliability, and implementation quality.

### Usage Guidance

- Name interactive elements by outcome.
- Document required states and feedback.
- Consider focus order and keyboard expectations.
- Preserve contrast intent.
- Respect reduced-motion expectations.

### Examples

Use:

- A destructive action with clear label, confirmation, and recovery expectation.
- Loading and error states that preserve user orientation.

Avoid:

- Icon-only actions without an accessible name.
- Status communicated only by color.

### Anti-Patterns

- Deferring accessibility until implementation.
- Using visual emphasis without semantic meaning.

### Relationship To UK-001

Extends UK-001 accessibility-first thinking and state language.

### Relationship To Design System

Design System owns accessibility implementation contracts. UI Kit documents intent and usage.

## Human And AI Collaboration

### Purpose

Create design documentation that supports human review and AI-assisted production without conflict.

### Rationale

AI should accelerate design work, but human teams need deterministic artifacts they can inspect and govern.

### Usage Guidance

- State authorities: Design System, UI Kit, and Business Capability document.
- Use reusable prompt structures.
- Include constraints and anti-patterns.
- Keep examples concrete.

### Examples

Use:

- `Design authority: NextShift Design System v1.0`
- `Language authority: NextShift UI Kit v1.0`
- `Workflow authority: CAP-002 CRM`

Avoid:

- Asking AI to infer authority boundaries.

### Anti-Patterns

- Vague prompts that invite visual invention.
- Omitting the expected output type.

### Relationship To UK-001

Uses UK-001 AI prompt structure and cross-reference model.

### Relationship To Design System

Prevents AI outputs from redefining Design System primitives.

## Trustworthy Interaction

### Purpose

Ensure users understand what will happen before, during, and after interaction.

### Rationale

Business workflows require confidence, especially when actions affect customer data, revenue, campaigns, or automation.

### Usage Guidance

- Make consequences visible before irreversible action.
- Provide clear success, error, and warning states.
- Preserve recovery paths where possible.
- Distinguish primary, secondary, and destructive actions.

### Examples

Use:

- `Delete customer` with confirmation.
- `Retry import` after an import failure.
- `Schedule follow-up` with visible date and owner.

Avoid:

- Silent failures.
- Destructive actions without confirmation.
- Primary actions with unclear outcome.

### Anti-Patterns

- Ambiguous command labels.
- State changes without feedback.
- Removing user control during long-running operations without explanation.

### Relationship To UK-001

Uses UK-001 action language, state language, and interaction descriptions.

### Relationship To Design System

Design System owns component states and feedback implementation. UI Kit defines when and why they should be used.

## Responsive-First Thinking

### Purpose

Preserve task clarity, hierarchy, and action access across supported viewport sizes.

### Rationale

NextShift surfaces must remain usable across operational contexts without becoming simplified to the point of losing meaning.

### Usage Guidance

- Preserve primary actions across breakpoints.
- Keep hierarchy stable as layout changes.
- Avoid hiding essential state on smaller screens.
- Reflow comparison content so relationships remain understandable.

### Examples

Use:

- A dashboard that stacks widgets while keeping priority order.
- A table view that exposes essential row context on smaller screens.

Avoid:

- Removing critical actions from mobile layouts.
- Reordering content in a way that changes workflow meaning.

### Anti-Patterns

- Desktop-only information architecture.
- Mobile layouts that hide status, risk, or primary actions.

### Relationship To UK-001

Extends UK-001 layout language and scalability guidance.

### Relationship To Design System

Design System owns responsive implementation primitives. UI Kit defines responsive design expectations.

## Version History

| Version | Status | Notes |
| --- | --- | --- |
| v1.0 | Implemented | Initial UK-002 Design Principles documentation. |
