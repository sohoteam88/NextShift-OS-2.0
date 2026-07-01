# NextShift UI Kit v1.0

# UK-006 Accessibility Guidelines

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-006 Accessibility Guidelines  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-006 Planning, UK-006 Documentation Implementation Contract, STD-001 through STD-004, UK-001 through UK-005, NextShift Design System v1.0  
**Outputs:** Accessibility guidance for Workspace-aware NextShift surfaces  
**Exit Criteria:** Accessibility guidance is Workspace-aware, implementation-independent, and ready for Requirements Verification

## Purpose

This document defines the UI Kit accessibility framework for NextShift Workspace interfaces.

Accessibility guidance describes how Workspace surfaces should preserve meaning, control, state, feedback, and navigation for members using keyboard, assistive technology, touch, pointer input, reduced motion settings, or compact viewports. It does not define CSS, component code, runtime behavior, ARIA implementation, token values, or automated test tooling.

## Scope

Included:

- Accessibility expectations for Workspace-aware views, flows, patterns, and components.
- Keyboard, focus, screen reader, semantic, feedback, and responsive guidance.
- Accessible usage guidance for existing Design System components.
- AI-assisted accessibility prompts and review criteria.
- Accessibility checklist and anti-patterns.

Excluded:

- Component implementation.
- Design token definitions.
- ARIA attribute implementation.
- Routing, persistence, data fetching, or authorization behavior.
- WCAG certification claims.
- Runtime test automation.

The released Design System, especially DS-007 Accessibility, remains the implementation authority.

## Accessibility Principles

| Principle | Rule |
| --- | --- |
| Meaning before presentation | State, hierarchy, and consequence must be communicated by language and structure, not appearance alone. |
| Keyboard parity | Any meaningful pointer interaction should have a keyboard-accessible path. |
| Focus visibility | Focus must be visible, predictable, and aligned to task order. |
| Assistive technology clarity | Screen reader output should expose identity, role, state, and consequence. |
| State without color alone | Status, tone, validation, and risk must use text, icon, shape, or structure in addition to color. |
| Responsive continuity | Compact layouts must preserve context, state, action access, and reading order. |
| Human and AI reviewability | Accessibility expectations should be explicit enough for human QA and AI design agents. |

## Workspace Accessibility Model

Every Workspace surface should preserve:

1. Workspace identity: where the member is working.
2. View purpose: what the current view supports.
3. Current state: loading, empty, error, success, disabled, selected, expanded, or blocked.
4. Primary decision: what needs attention.
5. Primary action: what moves work forward.
6. Feedback and recovery: what happened and what the member can do next.

This model applies to Retail, Recruitment, Admin, and future Workspace types without creating separate accessibility rules per Workspace.

## Content and Language Guidance

- Use approved UK-001 terms such as Workspace, View, Section, Panel, Card, Widget, Action, Flow, State, and Pattern.
- Name actions by outcome, not mechanism.
- Use plain-language status and error text.
- Avoid icon-only meaning unless the accessible name and visual label expectation are documented.
- Keep instructions near the field, control, or region they affect.
- Use consistent terms for repeated actions and states across Workspaces.

## State and Feedback Guidance

Accessible state communication should answer:

1. What is the current state?
2. What object or region is affected?
3. What can the member do next?
4. Is the state temporary, completed, blocked, or failed?

Required expectations:

- Loading state preserves context.
- Empty state explains absence and provides next action where available.
- Error state includes recovery.
- Disabled state explains why an action is unavailable when the reason is not obvious.
- Selected and expanded states remain clear after filtering, sorting, or responsive reflow.

## Visual Accessibility Guidance

- Do not rely on color alone for state, validation, priority, tone, risk, or AI confidence.
- Preserve contrast intent and defer exact token values to the Design System.
- Avoid motion as the only cue for change.
- Respect reduced-motion expectations at the pattern level.
- Keep text labels and controls legible in compact layouts.
- Use hierarchy to support scanning, not decoration.

## AI Accessibility Guidance

AI-generated design briefs should include:

```text
Accessibility scope:
Keyboard path:
Focus expectations:
Screen reader expectation:
State and feedback expectation:
Color-independent communication:
Responsive accessibility expectation:
Anti-patterns to avoid:
```

AI Design Agents must not invent components, token values, ARIA implementation, or runtime accessibility behavior. They should produce accessibility intent and QA-ready guidance that can be implemented through the released Design System.

## Relationship To Earlier UI Kit Slices

- UK-001 provides terminology and language discipline.
- UK-002 provides Accessibility By Default, Trustworthy Interaction, and Responsive-First Thinking.
- UK-003 provides component states, variants, and component categories.
- UK-004 provides responsive layout and hierarchy rules.
- UK-005 provides interaction, feedback, navigation, AI, and microinteraction patterns.

## Non-Goals

- No component redesign.
- No token values.
- No CSS, React, Vue, or Storybook implementation.
- No runtime accessibility automation.
- No formal legal compliance certification.

## Status

Implemented.
