# NextShift UI Kit v1.0

# UK-008 Design Review Checklist

**Execution Role:** Documentation Engineer  
**Assigned Agent:** Codex  
**Project:** NextShift UI Kit v1.0  
**Slice:** UK-008 Claude Design Brief  
**Lifecycle Phase:** Documentation Implementation  
**Inputs:** UK-008 Planning, UK-003 QA Component Checklist, UK-006 Accessibility Checklist, UK-007 Brand Anti-Patterns  
**Outputs:** Review checklist for AI-generated NextShift UI artifacts  
**Exit Criteria:** AI-generated design artifacts can be reviewed consistently before implementation

## Purpose

This checklist helps reviewers assess Claude Design or AI-generated NextShift UI artifacts.

It is a documentation review tool, not an implementation QA script or automated test suite.

## Authority Review

- [ ] Design authority is stated as NextShift Design System v1.0.
- [ ] Language authority is stated as NextShift UI Kit v1.0.
- [ ] Business authority is stated where relevant.
- [ ] Output does not redefine Design System or UI Kit guidance.

## Terminology Review

- [ ] Uses Workspace, Dashboard, View, Flow, Section, Panel, Card, Widget, Module, Action, State, Pattern, Component, Layout, and Variant correctly.
- [ ] Avoids screen, pagelet, box, thing, manage, and vague visual synonyms.
- [ ] Action labels are outcome-based.

## Workspace Review

- [ ] Active Workspace context is clear.
- [ ] Workspace switching and navigation are distinct.
- [ ] Workspace differences are metadata/content differences.
- [ ] No Retail, Recruitment, Admin, or future Workspace fork is introduced.

## Component Review

- [ ] Components are selected from released Design System or UK-003 language.
- [ ] No new primitive is invented.
- [ ] Data-dependent components include loading, empty, and error states.
- [ ] Interactive components include focus and disabled expectations where applicable.
- [ ] AI components include reason, confidence or uncertainty, and member actions.

## Layout Review

- [ ] Layout template is named.
- [ ] Workspace context appears before content.
- [ ] Primary decision and primary action are clear.
- [ ] Supporting details do not outrank current state.
- [ ] Responsive priority preserves hierarchy and action access.

## Interaction Review

- [ ] One primary action per unit.
- [ ] Destructive actions include confirmation.
- [ ] Async actions include loading, success, error, and recovery.
- [ ] Feedback appears near the affected object or region.
- [ ] AI recommendations remain under human control.

## Accessibility Review

- [ ] State is not communicated by color alone.
- [ ] Keyboard and focus expectations are included.
- [ ] Screen reader expectations are included where relevant.
- [ ] Error and blocked states include recovery.
- [ ] Compact layouts preserve labels, state, and context.

## Theme and Branding Review

- [ ] Branding supports context and does not overpower task hierarchy.
- [ ] Workspace branding does not fork tokens, components, shell, or theme.
- [ ] Color usage does not define token values or palettes.
- [ ] Light and dark mode preserve the same meaning.

## Output Review

- [ ] Artifact type matches the prompt.
- [ ] Output is implementation-independent.
- [ ] No CSS, token, code, API, database, or route behavior is included.
- [ ] Anti-patterns are listed.
- [ ] Known assumptions are explicit.

## Sign-Off

An AI-generated artifact is ready for downstream design or implementation planning only when applicable checklist items pass or are documented as intentionally out of scope.

## Status

Implemented.
