# NextShift UI Kit v1.0

# UK-006 Accessibility Testing Guide

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-006 Accessibility Guidelines  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-006 Planning, UK-006 Accessibility Checklist, UK-001 through UK-005  
**Outputs:** Accessibility testing guidance for documentation, design, QA, and AI review  
**Exit Criteria:** Testing guidance supports repeatable review without defining runtime test implementation

## Purpose

This guide defines how to review NextShift UI Kit artifacts for accessibility readiness.

It is a documentation and QA guide, not an automated test implementation plan. It does not define Playwright, Storybook, axe, browser scripts, or CI configuration.

## Review Levels

| Level | Reviewer | Purpose |
| --- | --- | --- |
| Documentation review | Product Architect, Documentation Engineer | Confirm accessibility expectations are present. |
| Design review | Designer, AI Design Agent, QA | Confirm visual and interaction intent is accessible. |
| Implementation QA | Software Engineer, QA | Confirm the final implementation follows Design System contracts. |
| Audit | Audit Engineer | Independently confirm repository consistency and lifecycle compliance. |

UK-006 owns the first two levels. Implementation QA belongs to later engineering work.

## Documentation Review Procedure

1. Confirm the artifact identifies Workspace context.
2. Confirm primary actions use outcome-based labels.
3. Confirm required states are documented.
4. Confirm keyboard expectations are documented.
5. Confirm screen reader expectations are documented.
6. Confirm color-independent state communication is documented.
7. Confirm responsive accessibility expectations are documented.
8. Confirm Design System implementation authority is preserved.

## Design Review Procedure

Use this sequence:

1. Navigate the proposed view by task priority.
2. Identify the active Workspace and current view.
3. Identify the primary decision and primary action.
4. Identify focusable controls and expected focus order.
5. Identify each state and feedback region.
6. Confirm errors and blocked states have recovery.
7. Confirm compact layout preserves context and labels.
8. Confirm AI output includes reason, confidence or uncertainty, and member action.

## Keyboard Review

Questions:

- Can the member reach the primary action?
- Can the member navigate menus, tabs, disclosures, modals, panels, lists, and tables?
- Can the member leave focused contexts?
- Does focus order match the task hierarchy?
- Are selected, disabled, expanded, loading, and error states understandable?

## Screen Reader Review

Questions:

- Is the active Workspace clear?
- Is the view purpose clear?
- Are controls named by outcome?
- Are repeated actions distinguishable?
- Are state changes understandable?
- Do errors identify affected fields or regions?
- Do charts, KPI Cards, and Widgets have textual meaning expectations?

## Visual Review

Questions:

- Does state avoid color-only meaning?
- Is contrast intent preserved without redefining token values?
- Does motion support understanding instead of replacing it?
- Are labels and control names visible or documented?
- Does responsive reflow preserve hierarchy and action access?

## AI Review Prompt

```text
Review this NextShift UI Kit artifact for UK-006 accessibility readiness.
Check Workspace context, action labels, keyboard path, focus order, screen reader expectation, state communication, feedback recovery, responsive accessibility, AI output accessibility, and Design System boundary compliance.
Return blocking issues first, then non-blocking improvements.
Do not propose runtime, CSS, token, or component implementation changes unless explicitly requested.
```

## Evidence To Record

- Artifact reviewed.
- Workspace or surface type.
- Applicable checklist items.
- Blocking issues.
- Non-blocking recommendations.
- Design System boundary notes.
- Verification decision.

## Non-Goals

- No automated testing framework selection.
- No CI configuration.
- No browser-specific assistive technology matrix.
- No runtime implementation QA sign-off.
- No legal certification.

## Status

Implemented.
